# OBS Remote JS

## ❗ DEPRECATION NOTICE ❗
This library is for the very old OBS Remote plugin for the very old OBS Classic. It DOES NOT work with the newer OBS Studio or obs-websocket. You probably want to use [obs-websocket-js](https://github.com/haganbmj/obs-websocket-js) instead.

-----

OBS Remote JS is a Javascript API for [OBS Remote](http://www.obsremote.com/), a plugin [for Open Broadcaster Software](https://obsproject.com/), which can be used in browsers and NodeJS.
It largely follows the API laid out in this plugin, but some callbacks have been changed for ease of use.
Documentation is provided in the `docs` folder.

### Installation and Usage
#####Node
`npm install obs-remote`

```var OBSRemote = require('obs-remote');
var obs = new OBSRemote();
obs.connect('localhost', 'myPassword');```

#####Browser (via Bower)
`bower install obs-remote`

```var obs = new OBSRemote();
obs.connect('localhost', 'myPassword');```

### License
OBS Remote JS is provided under the MIT license, which is available to read in the [LICENSE][] file.
[license]: LICENSE
