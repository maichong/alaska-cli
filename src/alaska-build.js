/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-03-02
 * @author Liang <liang@maichong.it>
 */


'use strict';
const fs = require('mz/fs');
const path = './node_modules';


async function createDirectoryAndWriteValue(value) {
  if (!(await fs.exists(process.cwd() + '/runtime'))) {
    await fs.mkdir(process.cwd() + '/runtime');
  }
  if (!(await fs.exists(process.cwd() + '/runtime/alaska-admin-view'))) {
    await fs.mkdir(process.cwd() + '/runtime/alaska-admin-view');
  }
  if (!(await fs.exists(process.cwd() + '/runtime/alaska-admin-view/src'))) {
    await fs.mkdir(process.cwd() + '/runtime/alaska-admin-view/src');
  }
  let outPath = process.cwd() + '/runtime/alaska-admin-view/src/views.js';
  await fs.writeFile(outPath, value).then((err) => {
    if (err) {
      console.log(err);
    } else {
      console.log('=> ' + outPath);
    }
  });
}
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
            viewsResult += `\nexports.${views[o].name} = require('${views[o].field}').default;`;
          }
          for (let o in wrap) {
            wrappersResult += `\n  ${o}: [require('${wrap[o]}').default],`;
          }
        }
      } catch (e) {
      }
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
  fs.readdir(path).then((files) => {
    if (typeof files === 'object' && files.length > 0) {
      collection(files);
    } else {
      console.log('未找到要构建的文件！');
    }
  });
};
