'use strict';

const path = require('path');
const { readdirSync, statSync } = require('fs');
const prompts = require('prompts');
const chalk = require('chalk');
const signale = require('signale');
const SyncFiles = require('../lib/syncFiles');
const getConfig = require('../lib/getConfig');

const defaultOptions = {
  bijection: false,
  headers: {},
  ignore: {},
  prefix: '',
  waitBeforeDelete: 3,
  waitBeforeUpload: 0,
};


const config = getConfig();

const handleAcl = (rule, fileInfoArr, acl) => {
  if (Array.isArray(rule)) {
    fileInfoArr.forEach(fileInfo => {
      if (rule.includes(fileInfo[0])) {
        fileInfo[2] = acl;
      }
    });
  } else if (rule instanceof RegExp) {
    fileInfoArr.forEach(fileInfo => {
      if (rule.test(fileInfo[0])) {
        fileInfo[2] = acl;
      }
    });
  }
};

const uploadDist = acl => {
  // eslint-disable-next-line no-unused-vars
  const { source, target, version, env, type, isProd, s3, ...restOptions } = config;
  const options = {
    acl,
    ...defaultOptions,
    ...restOptions,
  };
  const {
    ignore: { extname = [ '.htm', 'html' ] },
  } = options;
  let prefix = `${target}${version}`;

  // check options
  if (!options.endpoint && (!options.bucket || !options.region)) {
    return signale.error('No valid bucket configuration was found.');
  }
  if (!prefix.endsWith('/')) prefix += '/';
  if (prefix.startsWith('/')) prefix = prefix.slice(1);

  const syncFiles = new SyncFiles({ ...options });

  (async function() {
    // check pkg version
    const existsFileArr = await syncFiles.list(prefix);
    if (existsFileArr.length > 0) {
      // already has this version
      if (isProd) {
        console.log(`${chalk.cyan('线上已有该版本: ')}${chalk.bgRed(version)}, ${chalk.cyan('正式环境不支持覆盖')}`);
        return;
      }

      const response = await prompts([
        {
          type: 'confirm',
          name: 'cancel',
          message: `线上已有该版本: ${version}, 是否取消上传？`,
          initial: true,
        },
        {
          type: prev => (!prev ? 'confirm' : null),
          name: 'cover',
          message: `确认覆盖该版本: ${version}`,
          initial: true,
        },
      ]);
      if (!response.cover) return;
    }
    let fileInfoArr = readdirSync(source).map(name => [ name, path.join(source, name), 'private' ]);
    if (fileInfoArr.some(fileInfo => fileInfo[0] === 'static')) {
      const staticDir = path.join(source, 'static');
      if (statSync(staticDir).isDirectory()) {
        fileInfoArr = fileInfoArr.concat(
          readdirSync(staticDir).map(name => {
            return [ `static/${name}`, path.join(staticDir, name), 'private' ];
          })
        );
      }
    }

    if (extname) {
      fileInfoArr = fileInfoArr.filter(filePath => {
        return !extname.includes(path.extname(filePath[0]));
      });
    }

    if (Array.isArray(options.ignore.sizeBetween)) {
      fileInfoArr = fileInfoArr.filter(filePath => {
        const stat = statSync(filePath[1]);
        if (!stat.isFile()) return false;
        return !options.ignore.sizeBetween.some(([ min, max ]) => {
          return stat.size >= min && stat.size <= max;
        });
      });
    } else {
      fileInfoArr = fileInfoArr.filter(filePath => statSync(filePath[1]).isFile());
    }

    // handle files' acl
    options.acl = options.acl || options.headers['x-oss-object-acl'] || 'private';
    if (typeof options.acl === 'string') {
      fileInfoArr.forEach(fileInfo => (fileInfo[2] = options.acl));
    } else {
      options.acl.else = options.acl.else || 'private';
      fileInfoArr.forEach(fileInfo => (fileInfo[2] = options.acl.else));
      const { publicReadWrite, publicRead, private: privateAcl } = options.acl;
      handleAcl(publicReadWrite, fileInfoArr, 'public-read-write');
      handleAcl(publicRead, fileInfoArr, 'public-read');
      handleAcl(privateAcl, fileInfoArr, 'private');
    }

    // Empty list
    if (!fileInfoArr.length) {
      return signale.success('There is nothing need to be uploaded.\n');
    }

    // upload and print results
    signale.success(
      `The following files will be uploaded to ${options.endpoint || options.bucket}/${prefix}:\n${fileInfoArr
        .map(fileInfo => {
          if (fileInfo[0].length > 48) {
            return `...${fileInfo[0].slice(-45)}    ${fileInfo[2]}`;
          }
          const space = Array.from({ length: 48 - fileInfo[0].length }).map(() => '');
          return `${fileInfo[0]}${space.join(' ')}    ${fileInfo[2]}`;
        })
        .join('\n')}\n`
    );

    const uploadCosts = await syncFiles.upload(prefix, fileInfoArr);
    signale.success(`Uploaded in ${uploadCosts / 1000}s\n`);
  })();
};

uploadDist('public-read');
