'use strict';

const OSS = require('ali-oss');
const signale = require('signale');
const { createReadStream } = require('fs');
const promiseLimit = require('promise-limit');


const wait = async (seconds = 0) => {
  if (seconds) return new Promise(resolve => setTimeout(resolve, seconds * 1000));
};

class SyncFiles {
  constructor(options) {
    const ossOptions = {
      accessKeyId: options.accessKeyId,
      accessKeySecret: options.accessKeySecret,
      bucket: options.bucket,
      endpoint: options.endpoint,
      internal: options.internal,
      region: options.region,
      stsToken: options.stsToken,
      secure: options.secure,
      timeout: options.timeout,
    };
    this.options = options;
    this.oss = new OSS(ossOptions);
  }

  async upload(prefix, fileInfoArr) {
    await wait(this.options.waitBeforeUpload);
    const limit = promiseLimit(this.options.limit || 10);
    const globalStartTime = Date.now();
    await Promise.all(fileInfoArr.map(fileInfo => limit(async () => {
      const startTime = Date.now();
      const targetKey = `${prefix}${fileInfo[0]}`;
      signale.pending(`Uploading ${targetKey}...`);
      const stream = createReadStream(fileInfo[1]);
      const headers = {
        ...this.options.headers,
        'x-oss-object-acl': fileInfo[2],
      };
      const result = await this.oss.putStream(targetKey, stream, { headers });
      if (result.res.status === 200) {
        console.log(result.res.requestUrls[0]);
        signale.success(targetKey, `${(Date.now() - startTime) / 100}s`);
      } else {
        signale.error(targetKey, JSON.stringify(result.res));
      }
    })));

    return new Promise(resolve => resolve(Date.now() - globalStartTime));
  }

  async list(prefix) {
    let marker = prefix;
    const existsFileArr = [];
    while (typeof marker === 'string') {
      const result = await this.oss.list({ prefix, marker });
      if (result.res.status === 200 && result.objects) {
        existsFileArr.push(...result.objects.map(obj => obj.name));
        marker = result.nextMarker;
      } else {
        break;
      }
    }
    return existsFileArr;
  }
}

module.exports = SyncFiles;
