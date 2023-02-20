### upload

生成默认配置文件

```bash
$ ali-oss-cli init
```

或者手动在项目根目录下新建配置文件 **.ali-oss-src** 或者 **.ali-oss-src.js**， 示例如下：

```javascript
{
  "accessKeyId": "xxxxx",
  "accessKeySecret": "xxxxx",
  "bucket": "xxxx",
  "region": "cn",
  "envs": {
    "dev": {
      "source": "dist/",
      "target": "test/dev/"
    },
    "prod": {
      "source": "dist/",
      "target": "test/prod/",
      "isProd": true
    }
  }
}
```

| 参数 | 说明 | 类型 | required | 默认值 |
| accessKeyId | oss key id | string | true | --- |
| accessKeySecret | oss key secret | string | true | --- |
| bucket | bucket名字 | string | true | --- |
| region | oss region | string | true | --- |
| envs | 环境配置 | obj | true | --- |
| source | 源文件路径 | string | true | --- |
| target | 目标路径 | string | true | --- |
| isProd | 是否为正式环境，为true的话不允许覆盖上传 | boolean | false | --- |
| ignore | 后缀名数组，上传时忽略这些后缀的文件 | `array<string>` | false | --- |

```bash
$ ali-oss-cli  upload --env=prod
```

不传--env的话，默认为dev环境

### features

* 分环境配置

不同环境共用一个oss只需在外层配置oss信息，如果不同环境不同oss的话把oss信息放在下面，示例：

```javascript
{
  "accessKeyId": "xxxxx",
  "accessKeySecret": "xxxxx",
  "bucket": "xxxx",
  "region": "cn",
  "envs": {
    "dev": {
      "source": "dist/",
      "target": "test/dev/"
    },
    "prod": {
      "accessKeyId": "xxxx",
      "accessKeySecret": "xxxx",
      "bucket": "oss-prod",
      "region": "cn",
      "source": "dist/",
      "target": "test/prod/",
      "isProd": true
    }
  }
}
```

* 覆盖提醒

* 正式环境上传不能覆盖

