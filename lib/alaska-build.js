/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-03-02
 * @author Liang <liang@maichong.it>
 */

'use strict';

let build = (() => {
  var ref = _asyncToGenerator(function* () {
    const dir = process.cwd() + '/';
    if (!util.isFile(dir + '.alaska')) {
      throw new Error('Current folder is not an alaska project!');
    }

    let rc = util.readJSON(dir + '.alaska');
    if (!rc || !rc.id) {
      throw new Error('.alaska file error!');
    }

    if (!util.isDirectory(dir + 'runtime/alaska-admin-view/src')) {
      throw new Error(dir + 'runtime/alaska-admin-view/src is not exists!');
    }

    const modulesDir = dir + 'node_modules/';
    const modulesList = yield fs.readdir(modulesDir);

    let views = {};
    let wrappers = {};
    modulesList.forEach(function (name) {
      try {
        let m = require(modulesDir + name);
        if (m.views && typeof m.views === 'object') {
          for (let name in m.views) {
            let view = m.views[name];
            if (typeof view === 'string') {
              views[name] = view;
            } else if (typeof view === 'object' && view.name) {
              views[view.name] = view.path || view.field;
            }
          }
        }
        if (m.wrappers) {
          for (let name in m.wrappers) {
            let wrapper = m.wrappers[name];
            if (!wrappers[name]) {
              wrappers[name] = [];
            }
            wrappers[name] = wrappers[name].concat(wrapper);
          }
        }
        return;
      } catch (err) {}
    });

    let content = '/* this file is created by alaska build command */\n\n';

    for (let name in views) {
      content += `exports.${ name } = require('${ views[name] }').default;\n`;
      console.log(`view : ${ name } -> ${ views[name] }`);
    }
    content += '\nexports.wrappers={\n';
    for (let name in wrappers) {
      console.log(`wrapper : ${ name }`);
      content += `  ${ name }:[`;
      wrappers.forEach(function (wrapper) {
        content += ` require('${ wrapper }').default,`;
        console.log(`\t-> ${ wrapper }`);
      });
      content += ' ]\n';
    }
    content += '};';

    yield fs.writeFile(dir + 'runtime/alaska-admin-view/src/views.js', content);

    console.log('webpack');
    child_process.execFileSync(modulesDir + '.bin/webpack', {
      stdio: 'inherit'
    });
  });

  return function build() {
    return ref.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

const fs = require('mz/fs');
const path = require('path');
const util = require('./util');
const child_process = require('child_process');

build().then(function () {
  console.log('Built!');
}, function (error) {
  console.log('Failed to build!');
  console.log(error.stack);
});