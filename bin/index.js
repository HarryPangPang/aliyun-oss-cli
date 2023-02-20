#!/usr/bin/env node

'use strict';

const updater = require('update-notifier');
const chalk = require('chalk');
const fork = require('child_process').fork;
const pkg = require('../package.json');

updater({ pkg }).notify({ defer: true });

const script = process.argv[2];
const args = process.argv.slice(3);

switch (script) {
  case '-v':
  case '--version':
    console.log(pkg.version);
    if (!(pkg._from && pkg._resolved)) {
      console.log(chalk.cyan('@local'));
    }
    break;
  case 'init':
  case 'upload':
    // eslint-disable-next-line no-case-declarations
    const proc = fork(
      require.resolve(`../scripts/${script}`),
      args,
      {
        stdio: 'inherit',
      }
    );
    proc.once('exit', code => {
      process.exit(code);
    });
    process.once('exit', () => {
      proc.kill();
    });
    break;
  default:
    console.log(`Unknown script ${chalk.cyan(script)}.`);
    break;
}
