(function () {
    /*jshint plusplus: false */
    'use strict';

    function OBSRemote() {
        Object.defineProperty(this, "apiVersion", {value: 1.1, writable: false});

        this._connected = false;
        this._socket = undefined;
        this._messageCounter = 0;
        this._responseCallbacks = {};

        this._auth = {salt: "", challenge: ""};
    }

    // IE11 crypto object is prefixed
    var crypto = window.crypto || window.msCrypto || {};
    // Safari crypto.subtle is prefixed
    crypto.subtle = crypto.subtle || crypto.webkitSubtle || undefined;
    OBSRemote.prototype._authHash = _webCryptoHash;

    if (typeof crypto.subtle === "undefined") {
        // Native crypto not available, fall back to CryptoJS
        if (typeof CryptoJS === "undefined") {
            throw new Error("OBS Remote requires CryptoJS when native crypto is not available!");
        }

        OBSRemote.prototype._authHash = _cryptoJSHash;
    }

    Object.defineProperty(OBSRemote, "DEFAULT_PORT", {value: 4444, writable: false});
    Object.defineProperty(OBSRemote, "WS_PROTOCOL", {value: "obsapi", writable: false});

    /**
     * Try to connect to OBS, with optional password
     * @param address "ipAddress" or "ipAddress:port"
     *        defaults to "localhost"
     * @param password Optional authentication password
     */
    OBSRemote.prototype.connect = function (address, password) {
        // Password is optional, set to empty string if undefined
        password = (typeof password === "undefined") ?
            "" :
            password;

        // Check for address
        address = (typeof address === "undefined" || address === "") ?
            "localhost" :
            address;

        // Check for port number, if missing use 4444
        var colonIndex = address.indexOf(':');
        if (colonIndex < 0 || colonIndex === address.length - 1) {
            address += ":" + OBSRemote.DEFAULT_PORT;
        }

        // Check if we already have a connection
        if (this._connected) {
            this._socket.close();
            this._connected = false;
        }

        // Connect and setup WebSocket callbacks
        this._socket = new WebSocket("ws://" + address, OBSRemote.WS_PROTOCOL);

        var self = this;

        this._socket.onopen = function (event) {
            self._connected = true;
            self.onConnectionOpened();

            self.isAuthRequired(function(required) {
                if (!required) return;

                self.authenticate(password);
            })
        };

        this._socket.onclose = function (code, reason, wasClean) {
            self.onConnectionClosed();
            self._connected = false;
        };

        this._socket.onerror = function (event) {
            self.onConnectionFailed();
            self._connected = false;
        };

        this._socket.onmessage = function (message) {
            self._messageReceived(message);
        };
    };

    OBSRemote.prototype.authenticate = function (password) {
        var self = this;
        this._authHash(password, function(authResp) {
            var msg = {
                "request-type": "Authenticate",
                "auth": authResp
            };

            function cb(message) {
                var successful = (message.status === "ok");
                var remainingAttempts = 0;

                if (!successful) {
                    // TODO: improve and pull request I guess?
                    // ¯\_(ツ)_/¯
                    remainingAttempts = message.error.substr(43);

                    self.onAuthenticationFailed(remainingAttempts);
                } else {
                    self.onAuthenticationSuccessful();
                }
            }

            self._sendMessage(msg, cb);
        })
    };

    /**
     * Starts or stops OBS from streaming, recording, or previewing.
     * Result of this will be either the onStreamStarted or onStreamStopped callback.
     * @param previewOnly Only toggle the preview
     */
    OBSRemote.prototype.toggleStream = function (previewOnly) {
        // previewOnly is optional, default to false
        previewOnly = (typeof previewOnly === "undefined") ?
            false :
            previewOnly;

        var msg = {
            "request-type": "StartStopStreaming",
            "preview-only": previewOnly
        };

        this._sendMessage(msg);
    };

    /**
     * Requests OBS Remote version
     * @param callback function(Number version)
     */
    OBSRemote.prototype.getVersion = function (callback) {
        var msg = {
            "request-type": "GetVersion"
        };

        function cb (message) {
            callback(message.version);
        }

        this._sendMessage(msg, cb);
    };

    /**
     * Checks if authentication is required
     * @param callback function(Boolean required)
     */
    OBSRemote.prototype.isAuthRequired = function (callback) {
        var msg = {
            "request-type": "GetAuthRequired"
        };

        var self = this;
        function cb (message) {
            var authRequired = message.authRequired;

            if (authRequired) {
                self._auth.salt = message.salt;
                self._auth.challenge = message.challenge;
            }

            callback(authRequired);
        }

        this._sendMessage(msg, cb);
    };

    OBSRemote.prototype.onConnectionOpened = function () {};

    OBSRemote.prototype.onConnectionClosed = function () {};

    OBSRemote.prototype.onConnectionFailed = function () {};

    OBSRemote.prototype.onStreamStarted = function (previewOnly) {};

    OBSRemote.prototype.onStreamStopped = function (previewOnly) {};

    OBSRemote.prototype.onAuthenticationSuccessful = function () {};

    OBSRemote.prototype.onAuthenticationFailed = function (remainingAttempts) {};

    OBSRemote.prototype._sendMessage = function (message, callback) {
        if (this._connected) {
            var msgId = this._getNextMsgId();

            // Ensure callback isn't undefined, empty function one is not given/needed
            callback = (typeof callback === "undefined") ?
                function () {} :
                callback;

            // Store the callback with the message ID
            this._responseCallbacks[msgId] = callback;

            message["message-id"] = msgId;

            var serialisedMsg = JSON.stringify(message);
            this._socket.send(serialisedMsg);
        }
    };

    OBSRemote.prototype._getNextMsgId = function () {
        this._messageCounter += 1;
        return this._messageCounter + "";
    };

    OBSRemote.prototype._messageReceived = function (msg) {
        var message = JSON.parse(msg.data);
        if (!message) {
            return;
        }

        // Check if this is an update event
        var updateType = message["update-type"];
        if (updateType) {
            switch (updateType) {
                case "StreamStarting":
                    this._onStreamStarting(message);
                    break;
                case "StreamStopping":
                    this._onStreamStopping(message);
                    break;
                default:
                    console.warn("[OBSRemote] Unknown OBS update type: " + updateType);
            }
        } else {
            var msgId = message["message-id"];

            if (message.status === "error") {
                console.error("[OBSRemote] Error:", message.error);
            }

            var callback = this._responseCallbacks[msgId];
            callback(message);
            delete this._responseCallbacks[msgId];
        }
    };

    OBSRemote.prototype._onStreamStarting = function (message) {
        var previewOnly = message["preview-only"];
        this.onStreamStarted(previewOnly);
    };

    OBSRemote.prototype._onStreamStopping = function (message) {
        var previewOnly = message["preview-only"];
        this.onStreamStopped(previewOnly);
    };

    function _webCryptoHash(pass, callback) {
        var utf8Pass = _encodeStringAsUTF8(pass);
        var utf8Salt = _encodeStringAsUTF8(this._auth.salt);

        var ab1 = _stringToArrayBuffer(utf8Pass + utf8Salt);

        var self = this;
        crypto.subtle.digest("SHA-256", ab1)
            .then(function (authHash) {
                var utf8AuthHash = _encodeStringAsUTF8(_arrayBufferToBase64(authHash));
                var utf8Challenge = _encodeStringAsUTF8(self._auth.challenge);

                var ab2 = _stringToArrayBuffer(utf8AuthHash + utf8Challenge);

                crypto.subtle.digest("SHA-256", ab2)
                    .then(function(authResp) {
                        var authRespB64 = _arrayBufferToBase64(authResp);
                        callback(authRespB64);
                    });
            });
    }

    function _cryptoJSHash(pass, callback) {
        var utf8Pass = _encodeStringAsUTF8(pass);
        var utf8Salt = _encodeStringAsUTF8(this._auth.salt);

        var authHash = CryptoJS.SHA256(utf8Pass + utf8Salt).toString(CryptoJS.enc.Base64);

        var utf8AuthHash = _encodeStringAsUTF8(authHash);
        var utf8Challenge = _encodeStringAsUTF8(this._auth.challenge);

        var authResp = CryptoJS.SHA256(utf8AuthHash + utf8Challenge).toString(CryptoJS.enc.Base64);

        callback(authResp);
    }

    function _encodeStringAsUTF8(string) {
        return unescape(encodeURIComponent(string));
    }

    function _stringToArrayBuffer(string) {
        var ret = new Uint8Array(string.length);
        for (var i = 0; i < string.length; i++) {
            ret[i] = string.charCodeAt(i);
        }
        return ret.buffer;
    }

    function _arrayBufferToBase64(arrayBuffer) {
        var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var base64String = "";
        var n, p, bits;

        var uint8 = new Uint8Array(arrayBuffer);
        var len = arrayBuffer.byteLength * 8;
        for (var offset = 0; offset < len; offset += 6) {
            n = (offset/8) | 0;
            p = offset % 8;
            bits = ((uint8[n] || 0) << p) >> 2;
            if (p > 2) {
                bits |= (uint8[n+1] || 0) >> (10 - p);
            }
            base64String += alphabet.charAt(bits & 63);
        }
        base64String += (p == 4) ?
            '=' :
            (p == 6) ?
                '==':
                '';
        return base64String;
    }

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = OBSRemote;
    } else {
        window.OBSRemote = OBSRemote;
    }
})();
