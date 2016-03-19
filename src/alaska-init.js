/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-03-02
 * @author Liang <liang@maichong.it>
 */

'use strict';

const program = require('commander');
const path = require('path');
const fs = require('mz/fs');
const read = require('read-promise');
const mkdirp = require('mkdirp-promise');
const child_process = require('child_process');

program
  .parse(process.argv);

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
  if (await fs.exists(rcFile)) {
    //.alaska 文件已经存在
    throw new Error('Current folder is already initialized!');
  }

  if (!await fs.exists(dir + 'package.json')) {
    throw new Error('Current folder is not a npm project,please run "npm init" first!');
  }
  let rc = {
    services: {}
  };
  let id = rc.id = await readValue({ prompt: 'id?', default: rc.id || path.basename(dir) });
  let configFile = dir + 'config/' + id + '.js';
  let config = {
    id,
    session: {
      type: 'alaska-cache-lru',
      store: {
        maxAge: 1000 * 60 * 60
      }
    },
    db: 'mongodb://localhost/' + id,
    services: [
      'alaska-update'
    ],
    domain: '',
    redirect: '',
    prefix: '',
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
  if (withAdmin) {
    withUser = true;
    config.services.push({ id: 'alaska-admin', alias: 'admin' });
    rc.services['alaska-admin'] = true;
    dependencies.push('alaska-admin');
    devDependencies.push('alaska-admin-view');
  } else {
    withUser = await readBool('is this project with user system?', true);
    if (withUser) {
      rc.services['alaska-user'] = true;
    }
  }
  if (withUser) {
    config.services.push({ id: 'alaska-user', alias: 'user' });
    dependencies.push('alaska-user');
  }

  let port = await readValue({ prompt: 'http port?', default: 5000 }, Number.isInteger);
  config.port = parseInt(port);

  await mkdirp(dir + 'config');
  if (!await fs.exists(configFile)) {
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

  await writeJson(rcFile, rc);

  if (!await fs.exists(dir + '.babelrc')) {
    await copy(templateDir + '.babelrc', dir + '.babelrc');
  }

  if (!await fs.exists(dir + 'views/.babelrc')) {
    await copy(templateDir + 'views/.babelrc', dir + 'views/.babelrc');
  }

  if (!await fs.exists(dir + '.eslintrc')) {
    await copy(templateDir + '.eslintrc', dir + '.eslintrc');
  }

  if (!await fs.exists(dir + '.editorconfig')) {
    await copy(templateDir + '.editorconfig', dir + '.editorconfig');
  }

  if (!await fs.exists(dir + 'webpack.config.js')) {
    await copy(templateDir + 'webpack.config.js', dir + 'webpack.config.js');
  }

  if (!await fs.exists(dir + 'webpack.production.js')) {
    await copy(templateDir + 'webpack.production.js', dir + 'webpack.production.js');
  }

  if (!await fs.exists(dir + 'index.js')) {
    await copyAndReplace(templateDir + 'index.js', dir + 'index.js', {
      ID: id
    });
  }

  if (!await fs.exists(dir + id + '.js')) {
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
  console.log('\n\n\n\n\n\t\tInitialization is complete!\n\n\n\n');
}, function (error) {
  console.log('Failed to initialize!');
  console.log(error.stack);
});



