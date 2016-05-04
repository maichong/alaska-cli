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
require('shelljs/global');

const program = require('commander');
program
  .version(require('../package.json').version)
  .option('-w, --watch', 'webpack watch')
  .option('-d, --dev', 'compile dev lib')
  .usage('')
  .parse(process.argv);

function filepath(file) {
  return process.platform === 'win32' ? file.replace(/\\/g, '\\\\') : file;
}

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


  if (!util.isDirectory(dir + 'runtime/alaska-admin-view')) {
    mkdir('-p', 'runtime/alaska-admin-view');
  }

  const modulesDir = dir + 'node_modules/';
  const modulesList = fs.readdirSync(modulesDir);

  let views = {};
  let wrappers = {};
  let routes = [];

  function parse(m) {
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
  }

  let viewsFile = process.cwd() + '/views/views.js';
  if (util.isFile(viewsFile)) {
    parse(require(viewsFile));
  }

  modulesList.forEach(function (name) {
    try {
      let m = require(modulesDir + name);
      parse(m);
      return;
    } catch (err) {
    }
  });

  let content = '/* this file is created by alaska build command */\n\n';

  for (let name in views) {
    let file = filepath(views[name]);
    content += `exports.${name} = require('${file}').default;\n`
    console.log(`view : ${name} -> ${file}`);
  }
  content += '\nexports.wrappers={\n';
  for (let name in wrappers) {
    console.log(`wrapper : ${name}`);
    content += `  '${name}':[`;
    for (let key in wrappers) {
      let file = filepath(wrappers[key]);
      content += ` require('${file}').default,`;
      console.log(`\t-> ${file}`);
    }
    content += ' ]\n';
  }
  content += '};';

  content += '\n\nexports.routes=[\n';
  routes.forEach(route => {
    let file = filepath(route.component);
    content += `  {\n    component: require('${file}').default,\n    path: '${route.path}'\n  },\n`;
    console.log(`route : ${route.path} -> ${file}`);
  });
  content += '];\n';

  fs.writeFileSync(dir + 'runtime/alaska-admin-view/views.js', content);

  let args = ['webpack', '--config'];

  if (program.dev) {
    args.push('webpack.admin.dev.js');
  } else {
    args.push('webpack.admin.pro.js');
  }

  if (program.watch) {
    args.push('-w');
  }

  console.log(args.join(' '));
  let execFile = modulesDir + '.bin/webpack';
  if (process.platform === 'win32') {
    execFile += '.cmd';
  }
  execFileSync(execFile, args.slice(1), {
    stdio: 'inherit'
  });
}

try {
  build();
  console.log('Built!');
} catch (error) {
  console.log('Failed to build!');
  console.log(error.message);
}
