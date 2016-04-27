/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-03-02
 * @author Liang <liang@maichong.it>
 */

'use strict';

const program = require('commander');

program
  .version(require('../package.json').version)
  .command('init', 'init a project')
  .command('install service[:alias]', 'install services')
  .command('build', 'build admin dashboard')
  .parse(process.argv);
