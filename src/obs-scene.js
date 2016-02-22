(function() {
    'use strict';

    function OBSScene(name, sources) {
        this.name = name || '';
        this.sources = sources || [];
    }

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports.OBSScene = OBSScene;
    } else {
        window.OBSScene = OBSScene;
    }
})();
