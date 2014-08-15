'use strict';
var crypto = require('crypto');
var path = require('path');
var fs = require('fs');
var semver = require('semver');
var chalk = require('chalk');
var eachAsync = require('each-async');

module.exports = function (grunt) {
  grunt.registerMultiTask('filerev', 'File revisioning based on content hashing', function () {
    var options = this.options({
      encoding: 'utf8',
      algorithm: 'md5',
      length: 8
    });
    var target = this.target;
    var filerev = grunt.filerev || {summary: {}};
    var replacement = '\ufffd';

    // http://blog.nodejs.org/2014/06/16/openssl-and-breaking-utf-8-change/
    // https://github.com/felixge/node-unicode-sanitize/blob/master/index.js
    var loneSurrogates = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|([^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/g;
    var useSanitation = (options.encoding === 'utf8' &&  !( typeof process.env.NODE_INVALID_UTF8 !== 'undefined' || semver.lt(process.version, '0.10.29') ) );
    var sanitizeUtf8 = function(str) {
      grunt.verbose.writeln('Sanitizing utf8');
      return str.replace(loneSurrogates, '$1' + replacement);
    };

    eachAsync(this.files, function (el, i, next) {
      var move = true;

      // If dest is furnished it should indicate a directory
      if (el.dest) {
        // When globbing is used, el.dest contains basename, we remove it
        if (el.orig.expand) {
          el.dest = path.dirname(el.dest);
        }

        try {
          var stat = fs.lstatSync(el.dest);
          if (stat && !stat.isDirectory()) {
            grunt.fail.fatal('Destination ' + el.dest  + ' for target ' + target + ' is not a directory');
          }
        } catch (err) {
          grunt.log.writeln('Destination dir ' + el.dest + ' does not exists for target ' + target + ': creating');
          grunt.file.mkdir(el.dest);
        }
        // We need to copy file as we now have a dest different from the src
        move = false;
      }

      el.src.forEach(function (file) {
        if (grunt.file.isDir(file)) {
          return;
        }

        var dirname;
        var fileSrc = grunt.file.read(file);

        if( useSanitation ) {
          fileSrc = sanitizeUtf8(fileSrc);
        } 
        var hash = crypto.createHash(options.algorithm).update(fileSrc, options.encoding).digest('hex');
        var suffix = hash.slice(0, options.length);
        var ext = path.extname(file);
        var newName = [path.basename(file, ext), suffix, ext.slice(1)].join('.');
        var resultPath;

        if (move) {
          dirname = path.dirname(file);
          resultPath = path.resolve(dirname, newName);
          fs.renameSync(file, resultPath);
        } else {
          dirname = el.dest;
          resultPath = path.resolve(dirname, newName);
          grunt.file.copy(file, resultPath);
        }

        filerev.summary[path.normalize(file)] = path.join(dirname, newName);
        grunt.log.writeln(chalk.green('✔ ') + file + chalk.gray(' changed to ') + newName);
      });

      next();
    }, this.async());

    grunt.filerev = filerev;
  });
};
