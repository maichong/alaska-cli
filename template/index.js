
'use strict';

process.env.BABEL_CACHE_PATH = process.env.BABEL_CACHE_PATH || '.babel-cache.json';

require('babel-register')({
  ignore: /node_modules/
});

require('./${ID}');
