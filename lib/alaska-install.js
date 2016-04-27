/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-04-28
 * @author Liang <liang@maichong.it>
 */

'use strict';

const esprima = require('esprima');
const escodegen = require('escodegen');

const fs = require('fs');
const path = require('path');
const co = require('co');
const util = require('./util');
const npm = require('./npm');

const program = require('commander');

program
  .version(require('../package.json').version)
  .usage('service[:alias] [service:alias ...]')
  .parse(process.argv);

const rcFile = process.cwd() + '/.alaska';
if (!util.isFile(rcFile)) {
  throw new Error(`Can not find project file '${rcFile}'`);
}
const rc = util.readJSON(rcFile);
const configFile = process.cwd() + '/config/' + rc.id + '.js';
if (!util.isFile(configFile)) {
  throw new Error(`Can not find config file '${rcFile}'`);
}

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function* install(pkg) {
  console.log(`Install service packages`);
  let conf = {
    save: true,
    argv: {
      remain: pkg,
      cooked: ['install', '--save'].concat(pkg),
      original: ['install', '-S'].concat(pkg)
    },
    _exit: true
  };
  yield npm.load(conf);
  yield npm.commands.install(process.cwd(), pkg);
}

function* update(services) {
  console.log('Update config file...');

  let content = fs.readFileSync(configFile, 'utf8');
  //console.log(content);
  let data;
  try {
    data = esprima.parse(content, {
      comment: true,
      attachComment: true,
      range: false,
      loc: false,
      sourceType: 'module'
    });
  } catch (err) {
    throw new Error('Can not parse config file:' + err.message);
  }


  let success = false;
  for (let i in data.body) {
    let d = data.body[i];
    if (d.type !== 'ExportDefaultDeclaration') {
      continue;
    }
    for (let p in d.declaration.properties) {
      let prop = d.declaration.properties[p];
      if (prop.key.name !== 'services') {
        continue;
      }
      let elements = prop.value.elements;
      services.forEach(s => {
        elements.push({
          type: 'ObjectExpression',
          properties: [{
            type: 'Property',
            key: {
              type: 'Identifier',
              name: 'id'
            },
            value: {
              type: 'Literal',
              value: s.id,
              raw: `'${s.id}'`
            },
            kind: 'init'
          }, {
            type: 'Property',
            key: {
              type: 'Identifier',
              name: 'alias'
            },
            value: {
              type: 'Literal',
              value: s.alias,
              raw: `'${s.alias}'`
            },
            kind: 'init'
          }]
        });
      });
      success = true;
    }
  }
  if (!success) {
    throw new Error('Can not find services config');
  }

  content = escodegen.generate(data, {
    format: { indent: { style: '  ' } },
    comment: true
  });

  fs.writeFileSync(configFile, content);

  services.forEach(s => {
    rc.services[s.id] = true;
  });
  fs.writeFileSync(rcFile, JSON.stringify(rc, null, 2));
}

if (program.args.length) {
  co(function*() {
    let services = [];
    let pkg = [];
    for (let i in program.args) {
      let arg = program.args[i];
      arg = arg.split(':');
      let id = arg[0];
      let alias = arg[1];
      if (rc.services[id]) {
        console.log(`Skip '${id}', service is already installed`);
        continue;
      }
      services.push({ id: id, alias: alias || '' });
      pkg.push(id);
    }

    yield co(install(pkg));
    yield sleep(100);
    yield co(update(services));
    yield sleep(100);

  }).then(() => {
    console.log(`Installation completed`);
  }, err => {
    console.log(err);
  });
} else {
  program.help();
}
