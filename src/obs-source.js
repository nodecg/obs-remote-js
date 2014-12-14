(function () {
    'use strict';

    function OBSSource(width, height, x, y, name, rendered) {
        this.width = width || 0;
        this.height = height || 0;
        this.x = x || 0;
        this.y = y || 0;
        this.name = name || '';
        this.rendered = rendered || false;
    }

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports.OBSSource = OBSSource;
    } else {
        window.OBSSource = OBSSource;
    }
})();
