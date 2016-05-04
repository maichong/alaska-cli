/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-04-03
 * @author Liang <liang@maichong.it>
 */

'use strict';

const co = require('co');
const fs = require('fs');
const request = require('request');
const versions = require('../lib/versions.json');

function update(pkg) {
  return new Promise(function (resolve, reject) {
    request('http://registry.npm.taobao.org/' + pkg, function (e, r, body) {
      try {
        let json = JSON.parse(body);
        if (json['dist-tags']) {
          resolve(json['dist-tags'].latest);
        } else {
          reject(new Error('not found'));
        }
      } catch (error) {
        reject(error);
      }
    });
  });
}

co(function *() {
  for (let pkg in versions) {
    try {
      versions[pkg] = yield update(pkg);
      console.log(pkg, versions[pkg]);
    } catch (err) {
      console.log(err.stack);
    }
  }
}).then(function () {
  fs.writeFileSync('lib/versions.json', JSON.stringify(versions, null, 2));
});
