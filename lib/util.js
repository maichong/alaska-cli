/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-01-19
 * @author Liang <liang@maichong.it>
 */

'use strict';

const fs = require('fs');
const co = require('co');
const read = require('read-promise');

/**
 * 判断指定路径是否是文件
 * @param path
 * @returns {boolean}
 */
exports.isFile = function isFile(path) {
  try {
    return fs.statSync(path).isFile();
  } catch (e) {
    return false;
  }
};

/**
 * 判断指定路径是否是文件夹
 * @param path
 * @returns {boolean}
 */
exports.isDirectory = function isDirectory(path) {
  try {
    return fs.statSync(path).isDirectory();
  } catch (e) {
    return false;
  }
};

exports.readJSON = function readJSON(file) {
  let data = fs.readFileSync(file, 'utf8');
  return JSON.parse(data);
};

exports.writeJson = function writeJson(file, data) {
  return fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

exports.readValue = function readValue(options, checker) {
  return co(function*() {
    let value = yield read(options);
    if (!checker) {
      checker = function (v) {
        return v;
      };
    }
    if (checker(value)) {
      return value;
    } else {
      return yield readValue(options, checker);
    }
  });
};

exports.readBool = function readBool(options, def) {
  return co(function*() {
    if (typeof options == 'string') {
      options = {
        prompt: options
      };
    }
    if (def !== undefined) {
      options.default = (def === true || def == 'yes' || def == 'y') ? 'yes' : 'no';
    }
    let value = yield read(options);
    if (['yes', 'y'].indexOf(value) > -1) {
      return true;
    }
    if (['no', 'n'].indexOf(value) > -1) {
      return false;
    }
    return yield readBool(options);
  });
};

exports.copyAndReplace = function copyAndReplace(src, target, replaces) {
  let data = fs.readFileSync(src, 'utf8');
  for (let key in replaces) {
    data = data.replace(new RegExp('\\$\\{' + key + '\\}', 'g'), replaces[key]);
  }
  fs.writeFileSync(target, data);
};
