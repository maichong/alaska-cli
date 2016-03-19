/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-03-02
 * @author Liang <liang@maichong.it>
 */

'use strict';

let readValue = (() => {
  var ref = _asyncToGenerator(function* (options, checker) {
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

  return function readValue(_x, _x2) {
    return ref.apply(this, arguments);
  };
})();

let readBool = (() => {
  var ref = _asyncToGenerator(function* (options, def) {
    if (typeof options == 'string') {
      options = {
        prompt: options
      };
    }
    if (def !== undefined) {
      options.default = def === true || def == 'yes' || def == 'y' ? 'yes' : 'no';
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

  return function readBool(_x3, _x4) {
    return ref.apply(this, arguments);
  };
})();

let writeJson = (() => {
  var ref = _asyncToGenerator(function* (file, data) {
    return fs.writeFile(file, JSON.stringify(data, null, 2));
  });

  return function writeJson(_x5, _x6) {
    return ref.apply(this, arguments);
  };
})();

let copy = (() => {
  var ref = _asyncToGenerator(function* (src, target) {
    let data = yield fs.readFile(src);
    return yield fs.writeFile(target, data);
  });

  return function copy(_x7, _x8) {
    return ref.apply(this, arguments);
  };
})();

let copyAndReplace = (() => {
  var ref = _asyncToGenerator(function* (src, target, replaces) {
    let data = yield fs.readFile(src, 'utf8');
    for (let key in replaces) {
      data = data.replace(new RegExp('\\$\\{' + key + '\\}', 'g'), replaces[key]);
    }
    return yield fs.writeFile(target, data);
  });

  return function copyAndReplace(_x9, _x10, _x11) {
    return ref.apply(this, arguments);
  };
})();

let init = (() => {
  var ref = _asyncToGenerator(function* () {
    let dir = process.cwd() + '/';
    let templateDir = path.resolve(__dirname, '../template') + '/';
    console.log('Initialize alaska project: ', dir);
    let rcFile = dir + '.alaska';
    if (yield fs.exists(rcFile)) {
      //.alaska 文件已经存在
      throw new Error('Current folder is already initialized!');
    }

    if (!(yield fs.exists(dir + 'package.json'))) {
      throw new Error('Current folder is not a npm project,please run "npm init" first!');
    }
    let rc = {
      services: {}
    };
    let id = rc.id = yield readValue({ prompt: 'id?', default: rc.id || path.basename(dir) });
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
      services: ['alaska-update'],
      domain: '',
      redirect: '',
      prefix: '',
      statics: [{
        root: 'public',
        prefix: '/'
      }],
      superUser: ''
    };

    let dependencies = ['alaska', 'alaska-update', 'babel-plugin-syntax-async-functions', 'babel-plugin-syntax-class-properties', 'babel-plugin-syntax-export-extensions', 'babel-plugin-transform-async-to-generator', 'babel-plugin-transform-class-properties', 'babel-plugin-transform-export-extensions', 'babel-plugin-transform-object-rest-spread', 'babel-register'];
    let devDependencies = ['babel-eslint', 'babel-loader', 'babel-preset-es2015', 'babel-preset-react', 'babel-preset-stage-0', 'css-loader', 'eslint', 'eslint-config-airbnb', 'eslint-plugin-react', 'less', 'less-loader', 'style-loader', 'webpack'];
    let withUser = false;
    let withAdmin = yield readBool('is this project need a admin dashboard?', true);
    if (withAdmin) {
      withUser = true;
      config.services.push({ id: 'alaska-admin', alias: 'admin' });
      rc.services['alaska-admin'] = true;
      dependencies.push('alaska-admin');
      devDependencies.push('alaska-admin-view');
    } else {
      withUser = yield readBool('is this project with user system?', true);
      if (withUser) {
        rc.services['alaska-user'] = true;
      }
    }
    if (withUser) {
      config.services.push({ id: 'alaska-user', alias: 'user' });
      dependencies.push('alaska-user');
    }

    let port = yield readValue({ prompt: 'http port?', default: 5000 }, Number.isInteger);
    config.port = parseInt(port);

    yield mkdirp(dir + 'config');
    if (!(yield fs.exists(configFile))) {
      yield fs.writeFile(configFile, '\nexport default ' + JSON.stringify(config, null, 2).replace(/\"/g, '\''));
    }
    yield mkdirp(dir + 'controllers');
    yield mkdirp(dir + 'models');
    yield mkdirp(dir + 'api');
    yield mkdirp(dir + 'templates');
    yield mkdirp(dir + 'views');
    yield mkdirp(dir + 'public');
    yield mkdirp(dir + 'updates');
    yield mkdirp(dir + 'runtime');

    yield writeJson(rcFile, rc);

    if (!(yield fs.exists(dir + '.babelrc'))) {
      yield copy(templateDir + '.babelrc', dir + '.babelrc');
    }

    if (!(yield fs.exists(dir + 'views/.babelrc'))) {
      yield copy(templateDir + 'views/.babelrc', dir + 'views/.babelrc');
    }

    if (!(yield fs.exists(dir + '.eslintrc'))) {
      yield copy(templateDir + '.eslintrc', dir + '.eslintrc');
    }

    if (!(yield fs.exists(dir + '.editorconfig'))) {
      yield copy(templateDir + '.editorconfig', dir + '.editorconfig');
    }

    if (!(yield fs.exists(dir + 'webpack.config.js'))) {
      yield copy(templateDir + 'webpack.config.js', dir + 'webpack.config.js');
    }

    if (!(yield fs.exists(dir + 'webpack.production.js'))) {
      yield copy(templateDir + 'webpack.production.js', dir + 'webpack.production.js');
    }

    if (!(yield fs.exists(dir + 'index.js'))) {
      yield copyAndReplace(templateDir + 'index.js', dir + 'index.js', {
        ID: id
      });
    }

    if (!(yield fs.exists(dir + id + '.js'))) {
      yield copyAndReplace(templateDir + 'init.js', dir + id + '.js', {
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
    } catch (err) {}
    try {
      console.log('npm install -S ' + dependencies.join(' '));
      child_process.execSync('npm install -S ' + dependencies.join(' '), {
        stdio: 'inherit',
        env: {
          NPM_CONFIG_LOGLEVEL: 'http',
          NPM_CONFIG_PROGRESS: false
        }
      });
    } catch (err) {}
  });

  return function init() {
    return ref.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

const program = require('commander');
const path = require('path');
const fs = require('mz/fs');
const read = require('read-promise');
const mkdirp = require('mkdirp-promise');
const child_process = require('child_process');

program.parse(process.argv);

init().then(function () {
  console.log('\n\n\n\n\n\t\tInitialization is complete!\n\n\n\n');
}, function (error) {
  console.log('Failed to initialize!');
  console.log(error.stack);
});