/**
 * 脉冲软件
 * http://maichong.it
 * Created by LiYuDeng on 2016/3/3.
 * li@maichong.it
 */
'use strict';
const program = require('commander');
const buildAdmin = require('./lib/alaska-build');
program
  .version('0.1.0')
  .command('alaska-build')
  .alias('build')
  .description('build admin views')
  .action(buildAdmin);

program.parse(process.argv);
