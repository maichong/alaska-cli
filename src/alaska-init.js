/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-03-02
 * @author Liang <liang@maichong.it>
 */

'use strict';

const path = require('path');
const fs = require('mz/fs');
const read = require('read-promise');
const mkdirp = require('mkdirp-promise');
const child_process = require('child_process');
const util = require('./util');

async function readValue(options, checker) {
  let value = await read(options);
  if (!checker) {
    checker = function (v) {
      return v;
    };
  }
  if (checker(value)) {
    return value;
  } else {
    return await readValue(options, checker);
  }
}

async function readBool(options, def) {
  if (typeof options == 'string') {
    options = {
      prompt: options
    };
  }
  if (def !== undefined) {
    options.default = (def === true || def == 'yes' || def == 'y') ? 'yes' : 'no';
  }
  let value = await read(options);
  if (['yes', 'y'].indexOf(value) > -1) {
    return true;
  }
  if (['no', 'n'].indexOf(value) > -1) {
    return false;
  }
  return await readBool(options);
}

async function writeJson(file, data) {
  return fs.writeFile(file, JSON.stringify(data, null, 2));
}

async function copy(src, target) {
  let data = await fs.readFile(src);
  return await fs.writeFile(target, data);
}

async function copyAndReplace(src, target, replaces) {
  let data = await fs.readFile(src, 'utf8');
  for (let key in replaces) {
    data = data.replace(new RegExp('\\$\\{' + key + '\\}', 'g'), replaces[key]);
  }
  return await fs.writeFile(target, data);
}

async function init() {
  let dir = process.cwd() + '/';
  let templateDir = path.resolve(__dirname, '../template') + '/';
  console.log('Initialize alaska project: ', dir);
  let rcFile = dir + '.alaska';
  if (util.isFile(rcFile)) {
    //.alaska 文件已经存在
    throw new Error('Current folder is already initialized!');
  }

  if (!util.isFile(dir + 'package.json')) {
    throw new Error('Current folder is not a npm project,please run "npm init" first!');
  }
  let rc = {
    services: {}
  };
  let id = rc.id = await readValue({ prompt: 'id?', default: rc.id || path.basename(dir) });
  let db = await readValue({ prompt: 'MongoDB url?', default: 'mongodb://localhost/' + id });
  let configFile = dir + 'config/' + id + '.js';
  let config = {
    id,
    db,
    session: {
      type: 'alaska-cache-lru',
      store: {
        maxAge: 1000 * 60 * 60
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
      prefix: '/'
    }],
    superUser: ''
  };

  let dependencies = [
    'alaska',
    'alaska-update',
    'babel-plugin-syntax-async-functions',
    'babel-plugin-syntax-class-properties',
    'babel-plugin-syntax-export-extensions',
    'babel-plugin-transform-async-to-generator',
    'babel-plugin-transform-class-properties',
    'babel-plugin-transform-export-extensions',
    'babel-plugin-transform-object-rest-spread',
    'babel-register'
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
  let withAdmin = await readBool('is this project need a admin dashboard?', true);
  let username;
  let password;
  if (withAdmin) {
    withUser = true;
    config.services.push({ id: 'alaska-admin', alias: 'admin' });
    rc.services['alaska-admin'] = true;
    dependencies.push('alaska-admin');
    devDependencies.push('alaska-admin-view');
    username = await readValue({ prompt: 'username for admin user?', default: 'alaska' });
    password = await readValue({ prompt: 'password for admin user?', replace: '*', silent: true });
  } else {
    withUser = await readBool('is this project with user system?', true);
    if (withUser) {
      rc.services['alaska-user'] = true;
    }
  }
  if (withUser) {
    config.services.push({ id: 'alaska-user', alias: 'user' });
    dependencies.push('alaska-user');
    rc.services['alaska-user'] = true;
  }

  let port = await readValue({ prompt: 'http port?', default: 5000 }, Number.isInteger);
  config.port = parseInt(port);

  await mkdirp(dir + 'config');
  if (!util.isFile(configFile)) {
    await fs.writeFile(configFile, '\nexport default ' + JSON.stringify(config, null, 2).replace(/\"/g, '\''));
  }
  await mkdirp(dir + 'controllers');
  await mkdirp(dir + 'models');
  await mkdirp(dir + 'api');
  await mkdirp(dir + 'templates');
  await mkdirp(dir + 'views');
  await mkdirp(dir + 'public');
  await mkdirp(dir + 'updates');
  await mkdirp(dir + 'runtime');
  if (withAdmin) {
    await mkdirp(dir + 'runtime/alaska-admin-view/src');
    if (!util.isFile(dir + 'runtime/alaska-admin-view/src/index.jsx')) {
      await copy(templateDir + 'index.jsx', dir + 'runtime/alaska-admin-view/src/index.jsx');
    }
    if (!util.isFile(dir + 'webpack.config.js')) {
      await copy(templateDir + 'webpack.config.js', dir + 'webpack.config.js');
    }

    if (!util.isFile(dir + 'webpack.production.js')) {
      await copy(templateDir + 'webpack.production.js', dir + 'webpack.production.js');
    }
    await copyAndReplace(templateDir + 'updates/0.0.1-admins.js', dir + 'updates/0.0.1-admins.js', {
      ID: id,
      USERNAME: username,
      PASSWORD: password
    });
  }

  await writeJson(rcFile, rc);

  if (!util.isFile(dir + '.babelrc')) {
    await copy(templateDir + '.babelrc', dir + '.babelrc');
  }

  if (!util.isFile(dir + 'views/.babelrc')) {
    await copy(templateDir + 'views/.babelrc', dir + 'views/.babelrc');
  }

  if (!util.isFile(dir + '.eslintrc')) {
    await copy(templateDir + '.eslintrc', dir + '.eslintrc');
  }

  if (!util.isFile(dir + '.editorconfig')) {
    await copy(templateDir + '.editorconfig', dir + '.editorconfig');
  }

  if (!util.isFile(dir + 'index.js')) {
    await copyAndReplace(templateDir + 'index.js', dir + 'index.js', {
      ID: id
    });
  }

  if (!util.isFile(dir + id + '.js')) {
    await copyAndReplace(templateDir + 'init.js', dir + id + '.js', {
      ID: id
    });
  }

  try {
    console.log('npm install -D ' + devDependencies.join(' '));
    child_process.execSync('npm install -D ' + devDependencies.join(' '), {
      stdio: 'inherit',
      env: {
        NPM_CONFIG_LOGLEVEL: 'http',
        NPM_CONFIG_PROGRESS: false
      }
    });
  } catch (err) {
  }
  try {
    console.log('npm install -S ' + dependencies.join(' '));
    child_process.execSync('npm install -S ' + dependencies.join(' '), {
      stdio: 'inherit',
      env: {
        NPM_CONFIG_LOGLEVEL: 'http',
        NPM_CONFIG_PROGRESS: false
      }
    });
  } catch (err) {
  }
}

init().then(function () {
  console.log('\n\n\n\n\n\t\t\tCongratulations!\n\n\t\t   Initialization is complete!\n\n\n\n');
}, function (error) {
  console.log('Failed to initialize!');
  console.log(error.stack);
});
