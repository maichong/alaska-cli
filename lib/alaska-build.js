/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-03-02
 * @author Liang <liang@maichong.it>
 */

'use strict';

let createDirectoryAndWriteValue = (() => {
  var ref = _asyncToGenerator(function* (value) {
    if (!(yield fs.exists(process.cwd() + '/runtime'))) {
      yield fs.mkdir(process.cwd() + '/runtime');
    }
    if (!(yield fs.exists(process.cwd() + '/runtime/alaska-admin-view'))) {
      yield fs.mkdir(process.cwd() + '/runtime/alaska-admin-view');
    }
    if (!(yield fs.exists(process.cwd() + '/runtime/alaska-admin-view/src'))) {
      yield fs.mkdir(process.cwd() + '/runtime/alaska-admin-view/src');
    }
    let outPath = process.cwd() + '/runtime/alaska-admin-view/src/views.js';
    yield fs.writeFile(outPath, value).then(function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log('=> ' + outPath);
      }
    });
  });

  return function createDirectoryAndWriteValue(_x) {
    return ref.apply(this, arguments);
  };
})();
/**
 * 整理需要的内容
 * */


function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

const fs = require('mz/fs');
const path = './node_modules';

function collection(files) {
  let viewsResult = '';
  let wrappersResult = '\nexports.wrappers = {';
  for (let i = 0; i < files.length; i++) {
    if (files[i].substr(0, 1) !== '.') {
      try {
        let obj = require(files[i]);
        if (typeof obj.views === 'object' && typeof obj.wrappers === 'object') {
          let views = obj.views;
          let wrap = obj.wrappers;
          for (let o in views) {
            viewsResult += `\nexports.${ views[o].name } = require('${ views[o].field }').default;`;
          }
          for (let o in wrap) {
            wrappersResult += `\n  ${ o }: [require('${ wrap[o] }').default],`;
          }
        }
      } catch (e) {}
    }
  }
  viewsResult += wrappersResult + '\n}';
  let arr = [];
  for (let i = 0; i < viewsResult.length; i++) {
    if (viewsResult[i] === '\\') {
      arr.push('/');
    } else {
      arr.push(viewsResult[i]);
    }
  }
  viewsResult = arr.join('');
  createDirectoryAndWriteValue(viewsResult);
}
module.exports = function () {
  fs.readdir(path).then(files => {
    if (typeof files === 'object' && files.length > 0) {
      collection(files);
    } else {
      console.log('未找到要构建的文件！');
    }
  });
};