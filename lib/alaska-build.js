/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-03-02
 * @author Liang <liang@maichong.it>
 */

'use strict';

const fs = require('fs');
const path = './node_modules';
/**
 * 整理需要的内容
 * */
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
  let outPath = process.cwd() + '/runtime/alaska-admin-view/src/views.js';
  let p = new Promise((resolve, reject) => {
    if (!fs.existsSync(process.cwd() + '/runtime')) {
      fs.mkdir(process.cwd() + '/runtime', e => {
        if (e) {
          reject(e);
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });

  let p1 = new Promise((resolve, reject) => {
    if (!fs.existsSync(process.cwd() + '/runtime/alaska-admin-view')) {
      fs.mkdir(process.cwd() + '/runtime/alaska-admin-view', e => {
        if (e) {
          reject(e);
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });

  let p2 = new Promise((resolve, reject) => {
    if (!fs.existsSync(process.cwd() + '/runtime/alaska-admin-view/src')) {
      fs.mkdir(process.cwd() + '/runtime/alaska-admin-view/src', e => {
        if (e) {
          reject(e);
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
  p.then(() => p1, e => console.log(e)).then(() => p2, e => console.log(e)).then(() => {
    fs.writeFile(outPath, viewsResult, err => {
      if (err) {
        console.log(err);
      } else {
        console.log('=> ' + outPath);
      }
    });
  }, e => console.log(e));
}

/**
 * 所有读取文件时的错误处理
 * */
function excludeError(err, files) {
  if (err) {
    console.log(err);
  } else {
    if (typeof files === 'object' && files.length > 0) {
      collection(files);
    } else {
      console.log('未找到要构建的文件！');
    }
  }
}
module.exports = function () {
  fs.readdir(path, excludeError);
};