'use strict';
var fs = require('fs');
var semver = require('semver');
var assert = require('assert');

// http://blog.nodejs.org/2014/06/16/openssl-and-breaking-utf-8-change/
var useBrokenUTF = (typeof process.env.NODE_INVALID_UTF8 !== 'undefined' || semver.lt(process.version, '0.10.29'));
var hashes = {
  'test/fixtures/file.png' : useBrokenUTF ? 'test/tmp/file.a0539763.png' : 'test/tmp/file.d01d8f48.png',
  'test/fixtures/cfgfile.png' : useBrokenUTF ? 'test/tmp/cfgfile.f64f.png' : 'test/tmp/cfgfile.46a6.png'
};

it('should revision files based on content', function () {
  var file = 'test/fixtures/file.png';
  var original = fs.statSync(file).size;
  var revisioned= fs.statSync(hashes[file]).size;
  assert(revisioned === original);
});

it('should accept options', function () {
  var file = 'test/fixtures/cfgfile.png';
  var original = fs.statSync(file).size;
  var revisioned= fs.statSync(hashes[file]).size;
  assert(revisioned === original);
});

it('should allow a dest directory option', function () {
  var file = 'test/fixtures/file.png';
  var original = fs.statSync(file).size;
  var revisioned= fs.statSync(hashes[file]).size;
  assert(revisioned === original);
});

it('should allow sources defined with expand', function () {
  var file = 'test/fixtures/file.png';
  var original = fs.statSync(file).size;
  var revisioned= fs.statSync(hashes[file]).size;
  assert(revisioned === original);
});
