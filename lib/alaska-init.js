/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-03-02
 * @author Liang <liang@maichong.it>
 */

'use strict';

const co = require('co');
const path = require('path');
const fs = require('fs');
const util = require('./util');
const npm = require('./npm');
require('shelljs/global');

const versions = Object.assign({}, require('./versions'), {
  'koa-logger': '2.0.0'
});

function* init() {
  const dir = process.cwd() + '/';
  const templateDir = path.resolve(__dirname, '../template') + '/';
  console.log('Initialize alaska project: ', dir);
  const rcFile = dir + '.alaska';

  yield npm.load({});

  if (!util.isFile(dir + 'package.json')) {
    yield npm.commands.init();
  }
  let rc = {
    services: {}
  };
  let id = rc.id = yield util.readValue({ prompt: 'Alaska service id?', default: rc.id || path.basename(dir) });
  let db = yield util.readValue({ prompt: 'MongoDB url?', default: 'mongodb://localhost/' + id });
  let configFile = dir + 'config/' + id + '.js';
  let config = {
    id,
    db,
    appMiddlewares: [{
      id: 'koa-logger',
      sort: 1000
    }],
    session: {
      cookie: {},
      store: {
        type: 'alaska-cache-mongo',
        url: db,
        collection: 'app_session',
        maxAge: 60 * 60
      }
    },
    services: [
      'alaska-update'
    ],
    domain: '',
    prefix: '',
    redirect: '',
    statics: [{
      root: 'public',
      prefix: ''
    }],
    superUser: '',
    autoUpdate: true,

    'alaska-field-image': {
      ////本地文件夹
      dir: 'public/uploads/',
      ////路径模板
      pathFormat: 'YYYY/MM/DD/',
      ////URL前缀
      ////本地路径 = CWD + folder + path + filename
      ////URL = prefix + path + filename
      prefix: '/uploads/'
    }
  };

  let dependencies = [
    'alaska',
    'alaska-update',
    'alaska-cache-mongo',
    'babel-plugin-syntax-async-functions',
    'babel-plugin-syntax-class-properties',
    'babel-plugin-syntax-export-extensions',
    'babel-plugin-transform-async-to-module-method',
    'babel-plugin-transform-class-properties',
    'babel-plugin-transform-export-extensions',
    'babel-plugin-transform-object-rest-spread',
    'babel-plugin-transform-es2015-parameters',
    'babel-plugin-transform-es2015-modules-commonjs',
    'babel-plugin-transform-es2015-destructuring',
    'babel-register',
    'koa-logger'
  ];
  let devDependencies = [
    'babel-eslint',
    'babel-loader',
    'babel-preset-es2015',
    'babel-preset-react',
    'babel-preset-stage-0',
    'babel-plugin-transform-runtime',
    'css-loader',
    'eslint',
    'eslint-config-airbnb',
    'eslint-plugin-react',
    'less',
    'less-loader',
    'style-loader',
    'webpack'
  ];
  let withUser = false;
  let withAdmin = yield util.readBool('is this project need a admin dashboard?', true);
  let username;
  let password;
  if (withAdmin) {
    withUser = true;
    config.services.push({ id: 'alaska-admin', alias: 'admin' });
    rc.services['alaska-admin'] = true;
    dependencies.push('alaska-admin');
    devDependencies.push('alaska-admin-view');
    username = yield util.readValue({ prompt: 'username for admin user?', default: 'alaska' });
    password = yield util.readValue({ prompt: 'password for admin user?', replace: '*', silent: true });
  } else {
    withUser = yield util.readBool('is this project with user system?', true);
    if (withUser) {
      rc.services['alaska-user'] = true;
    }
  }
  if (withUser) {
    config.services.push({ id: 'alaska-user', alias: 'user' });
    dependencies.push('alaska-user');
    rc.services['alaska-user'] = true;
  }

  let port = yield util.readValue({ prompt: 'http port?', default: 5000 }, p => (p > 1 && p < 65535));
  config.port = parseInt(port);
  ['config', 'models', 'middlewares', 'controllers', 'api', 'sleds', 'templates', 'views', 'public', 'updates', 'runtime'].forEach(d => {
    mkdir('-p', dir + d);
  });

  if (!util.isFile(configFile)) {
    fs.writeFileSync(configFile, '\nexport default ' + JSON.stringify(config, null, 2).replace(/\"/g, '\'').replace(/'([a-z\d\_]+)'\:/gi, (a, b) => (b + ':')));
  }

  function copy(file) {
    if (!util.isFile(dir + file)) {
      cp(templateDir + file, dir + file);
    }
  }

  function copyAndReplace(file, data) {
    if (!util.isFile(dir + file)) {
      util.copyAndReplace(templateDir + file, dir + file, data);
    }
  }

  if (withAdmin) {
    mkdir('-p', dir + 'runtime/alaska-admin-view');
    copy('views/admin.jsx');
    copy('webpack.admin.dev.js');
    copy('webpack.admin.pro.js');
    copy('config/alaska-admin.js');

    copyAndReplace('updates/0.0.1-init.js', {
      ID: id,
      USERNAME: username,
      PASSWORD: password
    });
  }

  util.writeJson(rcFile, rc);

  cp('-R', templateDir + 'locales', dir + 'locales');
  copy('controllers/default.js');
  copy('middlewares/index.js');
  copy('templates/index.swig');
  copy('views/.babelrc');
  copy('.babelrc');
  copy('.eslintrc');
  copy('.editorconfig');

  copyAndReplace('index.js', {
    ID: id
  });
  if (!util.isFile(dir + id + '.js')) {
    util.copyAndReplace(templateDir + 'init.js', dir + id + '.js', {
      ID: id
    });
  }

  let pkg = require(dir + 'package.json');
  if (!pkg.devDependencies) {
    pkg.devDependencies = {};
  }
  if (!pkg.dependencies) {
    pkg.dependencies = {};
  }
  devDependencies.forEach(name => {
    pkg.devDependencies[name] = versions[name] ? ('^' + versions[name]) : 'latest';
  });
  dependencies.forEach(name => {
    pkg.dependencies[name] = versions[name] ? ( '^' + versions[name]) : 'latest';
  });
  util.writeJson(dir + 'package.json', pkg);

  console.log('install package...');
  exec('npm install');
}

co(init).then(function () {
  console.log('\n\n\n\n\n\t\t\tCongratulations!\n\n\t\t   Initialization is complete!\n\n\n\n');
}, function (error) {
  console.log('Failed to initialize!');
  console.log(error.stack);
});
