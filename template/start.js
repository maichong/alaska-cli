'use strict';

process.title = '${ID}';

process.chdir(__dirname);

process.env.BABEL_CACHE_PATH = process.env.BABEL_CACHE_PATH || 'runtime/babel-cache.json';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

process.title = '${ID}';

require('babel-register')({
  ignore: /node_modules/,
  babelrc: false,
  presets: [],
  plugins: [
    'syntax-async-functions',
    'syntax-export-extensions',
    'transform-class-properties',
    'transform-es2015-modules-commonjs',
    'transform-es2015-destructuring',
    'transform-es2015-parameters',
    'transform-export-extensions',
    'transform-object-rest-spread',
    ['transform-async-to-module-method', {
      module: 'co',
      method: 'wrap'
    }]
  ]
});

let service = require('./').default;

service.launch().then(() => {
  console.log('${ID} started');
}, (error) => {
  process.exit(1);
});
