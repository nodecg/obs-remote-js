module.exports = function(grunt) {
    'use strict';

    // Force use of Unix newlines
    grunt.util.linefeed = '\n';

    // Project configuration.
    grunt.initConfig({

        // Metadata.
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*!\n' +
        ' * OBS Remote JS API v<%= pkg.version %> (<%= pkg.homepage %>)\n' +
        ' * Copyright 2014 <%= pkg.author %>\n' +
        ' * Licensed under <%= pkg.license.type %> (<%= pkg.license.url %>)\n' +
        ' */\n',

        // Task configuration.
        clean: {
            dist: 'dist'
        },

        jshint: {
            options: {
                jshintrc: 'src/.jshintrc'
            },
            core: {
                src: 'src/*.js'
            }
        },

        concat: {
            options: {
                banner: '<%= banner %>',
                stripBanners: false
            },
            obsremote: {
                src: [
                    'src/obs-source.js',
                    'src/obs-scene.js',
                    'src/obs-remote.js'
                ],
                dest: 'dist/<%= pkg.name %>.js'
            }
        },

        uglify: {
            options: {
                preserveComments: 'some'
            },
            core: {
                src: '<%= concat.obsremote.dest %>',
                dest: 'dist/<%= pkg.name %>.min.js'
            }
        }
    });

    // These plugins provide necessary tasks.
    require('load-grunt-tasks')(grunt, { scope: 'devDependencies' });
    require('time-grunt')(grunt);

    // JS distribution task.
    grunt.registerTask('build', ['clean:dist', 'concat', 'uglify:core']);

    // Default task.
    grunt.registerTask('default', ['build']);
};