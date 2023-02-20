'use strict';

const assert = require('assert');
const path = require('path');
const { existsSync, readFileSync } = require('fs');
const stripJsonComments = require('strip-json-comments');
const minimist = require('minimist');

const args = process.argv.slice(2);
const program = minimist(args);
const env = program.env || 'dev';
const type = program.type || 'aliyun';

function getConfig(opts = {}) {
  const {
    cwd = process.cwd(),
    configFile = '.ali-oss-src',
    // env = 'dev',
  } = opts;

  const rcFile = path.resolve(cwd, configFile);
  const jsRCFile = path.resolve(cwd, `${configFile}.js`);

  assert(
    !(existsSync(rcFile) && existsSync(jsRCFile)),
    `${configFile} file and ${configFile}.js file can not exist at the same time.`
  );

  let config = {};
  if (existsSync(rcFile)) {
    config = JSON.parse(stripJsonComments(readFileSync(rcFile, 'utf-8')));
  }

  if (existsSync(jsRCFile)) {
    // no cache
    delete require.cache[jsRCFile];
    config = require(jsRCFile);
    if (config.default) {
      config = config.default;
    }
  }

  const pkgFile = path.resolve(cwd, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgFile, 'utf-8'));

  if (type !== 'aliyun') {
    if (!config[type]) {
      throw new Error(`miss ${type} configs in ${configFile}`);
    }
    if (!config[type].envs) {
      throw new Error(`miss field ${type} envs in ${configFile}`);
    }
    const { envs, ...rest } = config[type];
    const envConfig = envs[env];
    if (!envConfig) {
      throw new Error(`can't find ${type} env: ${env}`);
    }

    const newConfig = {
      ...rest,
      ...envConfig,
      env,
      type,
    };

    const verParams = [ 'accessKeyId', 'secretAccessKey' ];

    verParams.forEach(k => {
      if (!(k in newConfig)) {
        throw new Error(`miss ${type} config param ${k}`);
      }
    });

    newConfig.version = pkg.version;

    return newConfig;

  }
  if (!config.envs) {
    throw new Error(`miss field envs in ${configFile}`);
  }
  const { envs, ...rest } = config;
  const envConfig = envs[env];
  if (!envConfig) {
    throw new Error(`can't find env: ${env}`);
  }
  const newConfig = {
    ...rest,
    ...envConfig,
    env,
    type,
  };

  const verParams = [ 'region', 'accessKeyId', 'accessKeySecret', 'bucket', 'source', 'target' ];
  verParams.forEach(k => {
    if (!(k in newConfig)) {
      throw new Error(`miss config param ${k}`);
    }
  });

  newConfig.version = pkg.version;

  return newConfig;

}

module.exports = getConfig;
