/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-03-02
 * @author Liang <liang@maichong.it>
 */

'use strict';

const program = require('commander');

program.version('0.1.0').command('create [name]', 'create project').command('install [service]', 'install a service').command('build-admin', 'build admin views').parse(process.argv);