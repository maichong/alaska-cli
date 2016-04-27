/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-04-03
 * @author Liang <liang@maichong.it>
 */

'use strict';

const npm = require('npm');
const commands = exports.commands = {};
Object.keys(npm.commands).forEach(key => {
  commands[key] = function () {
    let args = Array.prototype.slice.apply(arguments);
    return new Promise(function (resolve, reject) {
      args.push(function (error, res) {
        if (error) {
          reject(error);
        } else {
          resolve(res);
        }
      });
      npm.commands[key].apply(npm.commands, args);
    });
  };
});

exports.load = function (options) {
  return new Promise(function (resolve, reject) {
    npm.load(options, function (error, res) {
      if (error) {
        reject(error);
      } else {
        resolve(res);
      }
    });
  });
};
