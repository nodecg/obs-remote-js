# OBSRemote

## Class: OBSSource

This represents a 'source' in OBS. It only holds data.

### new OBSSource(width, height, x, y, name, rendered)

Constructs a new OBSSource object.

* `width` Number
* `height` Number
* `x` Number
* `y` Number
* `name` String
* `rendered` Boolean

## Class: OBSScene

This represents a 'scene' in OBS. It only holds data.

### new OBSScene(name, sources)

Constructs a new OBSSource object.

* `name` String
* `sources` Array of OBSSource

## Class OBSRemote

This class is responsible for communication with OBS.

### new OBSRemote()

Constructs a new OBSRemote object.

### remote.connect([address [, password]])

Connects to OBS. If address is not given, `localhost:4444` is used.
If the password is given, OBSRemote will automatically attempt authentication.

### remote.authenticate(password)

Attempts to authenticate with OBS.
Will cause either `onAuthenticationFailed` or `onAuthenticationSucceeded` to be called

### remote.isAuthRequired(function (Boolean isRequired) {} )

Checks if authentication is required

### remote.toggleStream(previewMode)

Starts or stops OBS from streaming, recording, or previewing.
Result of this will be either the `onStreamStarted` or `onStreamStopped` callback.

### remote.getVersion(function (Number version) {} )

Requests the OBS Remote plugin version

### remote.getSceneList(function (String currentScene, Array scenes) {} )

Gets name of current scene and full list of all other scenes

### remote.getCurrentScene(function (OBSScene scene) {} )

Gets the current scene and full list of sources

### remote.setCurrentScene(sceneName)

Tells OBS to switch to the given scene name
If successful the `onSceneSwitched` will be called

### remote.setSourcesOrder(sources)

Reorders sources in the current scene
`sources` can be an Array of either Strings or OBSSources

### remote.setSourceRender(sourceName, shouldRender)

Sets a source's render state in the current scene

### remote.getStreamingStatus(function (Boolean streaming, Boolean previewOnly) {} )

Gets current streaming status, and if we're previewing or not

### remote.getVolumes(function (Number microphoneVolume, Boolean microphoneMuted, Number desktopVolume, Boolean desktop) {} )

Gets current volume levels and mute statuses

### remote.setMicrophoneVolume(volume, adjusting)

Sets microphone volume, and whether we're still adjusting it

### remote.toggleMicrophoneMute()

Toggles microphone mute state

### remote.setDesktopVolume(volume, adjusting)

Sets desktop volume, and whether we're still adjusting it

### remote.toggleDesktopMute()

Toggles desktop mute state

### remote.onConnectionOpened()

Called when the connection to OBS is made
You may still need to authenticate!

### remote.onConnectionClosed()

Called when the connection to OBS is closed

### remote.onConnectionFailed()

Called when the connection to OBS fails

### remote.onAuthenticationSucceeded()

Called when authentication is successful

### remote.onAuthenticationFailed(Number remainingAttempts)

Called when authentication fails

### remote.onStreamStarted(previewing)

Called when OBS starts streaming, recording or previewing

### remote.onStreamStopped(previewing)

Called when OBS stops streaming, recording or previewing

### remote.onStatusUpdate(streaming, previewing, bytesPerSecond, strain, streamDurationInMS, totalFrames, droppedFrames, framesPerSecond)

Called frequently by OBS while live or previewing

### remote.onSceneSwitched(sceneName)

Called when OBS switches scene

### remote.onScenesChanged(scenes)

Called when the scene list changes (new order, addition, removal or renaming)

### remote.onSourceOrderChanged(sources)

Called when source oder changes in the current scene

### remote.onSourceAddedOrRemoved(sources)

Called when a source is added or removed from the current scene

### remote.onSourceChanged(originalName, source)

Called when a source in the current scene changes

### remote.onMicrophoneVolumeChanged(volume, muted, adjusting)

Called when the microphone volume changes, or is muted

### remote.onDesktopVolumeChanged(volume, muted, adjusting)

Called when the desktop volume changes, or is muted
