/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-03-02
 * @author Liang <liang@maichong.it>
 */

'use strict';

const fs = require('fs');
const path = require('path');
const execFileSync = require('child_process').execFileSync;
const util = require('./util');

function build() {
  console.log('Alaska build...');
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
  const modulesList = fs.readdirSync(modulesDir);

  let views = {};
  let wrappers = {};
  let routes = [];
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
      if (m.routes) {
        if (Array.isArray(m.routes)) {
          m.routes.forEach(route => routes.push(route));
        } else if (m.routes.component) {
          routes.push(m.routes)
        }
      }
      return;
    } catch (err) {
    }
  });

  let content = '/* this file is created by alaska build command */\n\n';

  for (let name in views) {
    content += `exports.${name} = require('${views[name]}').default;\n`
    console.log(`view : ${name} -> ${views[name]}`);
  }
  content += '\nexports.wrappers={\n';
  for (let name in wrappers) {
    console.log(`wrapper : ${name}`);
    content += `  '${name}':[`;
    for (let key in wrappers) {
      content += ` require('${wrappers[key]}').default,`;
      console.log(`\t-> ${wrappers[key]}`);
    }
    content += ' ]\n';
  }
  content += '};';

  content += '\n\nexports.routes=[\n';
  routes.forEach(route => {
    content += `  {\n    component: require('${route.component}').default,\n    path: '${route.path}'\n  }\n`;
    console.log(`route : ${route.path} -> ${route.component}`);
  });
  content += '];\n';

  fs.writeFileSync(dir + 'runtime/alaska-admin-view/src/views.js', content);

  console.log('webpack --config webpack.production.js');
  execFileSync(modulesDir + '.bin/webpack', ['--config', 'webpack.production.js'], {
    stdio: 'inherit'
  });
}

try {
  build();
  console.log('Built!');
} catch (error) {
  console.log('Failed to build!');
  console.log(error.stack);
}
