'use strict';

const { existsSync, writeFileSync } = require('fs');
const path = require('path');
const prompts = require('prompts');

const configFile = '.ali-oss-src';
const cwd = process.cwd();

const rcFile = path.resolve(cwd, configFile);
const jsRCFile = path.resolve(cwd, `${configFile}.js`);

if (existsSync(rcFile) || existsSync(jsRCFile)) {
  console.log('config already exists');
  return;
}

const template = {
  accessKeyId: '',
  accessKeySecret: '',
  bucket: '',
  region: '',
  envs: {
    dev: {
      source: 'dist/',
      target: '',
    },
    prod: {
      source: 'dist/',
      target: '',
      isProd: true,
    },
  },
};

(async () => {
  const response = await prompts([
    {
      type: 'text',
      name: 'accessKeyId',
      message: 'ali oss accessKeyId',
    },
    {
      type: 'invisible',
      name: 'accessKeySecret',
      message: 'ali oss accessKeySecret',
    },
    {
      type: 'text',
      name: 'bucket',
      message: 'ali oss bucket',
    },
    {
      type: 'text',
      name: 'region',
      message: 'ali oss region',
    },
  ]);
  const config = {
    ...template,
    ...response,
  };
  writeFileSync(rcFile, JSON.stringify(config, null, 2), 'utf8');
})();
