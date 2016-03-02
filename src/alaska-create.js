/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-03-02
 * @author Liang <liang@maichong.it>
 */

'use strict';

const program = require('commander');

program
  .option('-f, --force', 'force installation')
  .parse(process.argv);

console.log(program.args);
