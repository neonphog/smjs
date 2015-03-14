module.exports = function (grunt) {
  grunt.initConfig({
    jscs: {
      src: ['<%= jshint.all %>'],
      options: {
        config: '.jscsrc'
      }
    },

    jshint: {
      all: [
        'Gruntfile.js',
        'lib/*.js',
        'test/*.js',
        'bin/smjs'
      ],
      options: {
        jshintrc: true
      }
    },

    mochaTest: {
      test: {
        src: ['test/test.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('test', ['jscs', 'jshint', 'mochaTest']);

  grunt.registerTask('default', ['test']);
};

