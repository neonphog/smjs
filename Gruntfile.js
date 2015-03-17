var fs = require('fs');
var UglifyJS = require('uglify-js');
var semver = require('semver');

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

  function minify(outfile, infiles) {
    var min = UglifyJS.minify(infiles, {
      output: {
        "ascii_only": true
      }
    }).code;

    fs.writeFileSync(outfile, min);
    console.log('Generated "' + outfile + '" (' + min.length + ' bytes)');
  }

  function bump(version) {
    var common = fs.readFileSync('lib/common.js').toString();
    var sidx = common.indexOf("VERSION:START");
    sidx = common.indexOf("\n", sidx);
    var eidx = common.indexOf("VERSION:END");
    eidx = common.lastIndexOf("\n", eidx);

    if (!version) {
      version = JSON.parse("{" + common.substring(sidx, eidx) + "}").version;
      var pre = semver.parse(version).prerelease[0] || 'alpha';
      version = semver.inc(version, 'prerelease', pre);
    }
    var newCommon = common.substring(0, sidx);
    newCommon += '\n    "version": "' + version + '"';
    newCommon += common.substring(eidx);
    fs.writeFileSync('lib/common.js', newCommon);

    var pack = JSON.parse(fs.readFileSync('package.json'));
    pack.version = version;
    fs.writeFileSync('package.json', JSON.stringify(pack, null, '  '));
  }

  grunt.registerTask('build', function (version) {
    bump(version);

    minify('browser/smjs.acorn.full.min.js', [
      'node_modules/acorn/acorn.js',
      'lib/common.js',
      'lib/encoder.js',
      'lib/decoder.js'
      ]);
    minify('browser/smjs.full.min.js', [
      'lib/common.js',
      'lib/encoder.js',
      'lib/decoder.js'
      ]);
    minify('browser/smjs.decoder.min.js', [
      'lib/common.js',
      'lib/decoder.js'
      ]);
  });

};

