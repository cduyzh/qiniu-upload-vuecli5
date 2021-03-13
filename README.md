<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200"
      src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
  <h1>Upload To Qiniu vue-cli5 Webpack Plugin</h1>
  <p>A plugin upload file to qiniu clound for vue-cli4|vue-cli5</p>
</div>

<h2 align="center">Install</h2>

```bash
  npm i --save-dev qiniu-upload-vuecli5
```

```bash
  yarn add qiniu-upload-vuecli5 --dev
```

<h2 align="center">Usage</h2>

**vue.config.js**

```js
const Upload2QiniuPlugin = require("qiniu-upload-vuecli5");

module.exports = {
  entry: "index.js",
  output: {
    path: __dirname + "/dist",
    filename: "index_bundle.js",
  },
  plugins: [
    new Upload2QiniuPlugin({
      qiniuAccessKey: "xxxx",
      qiniuSecretKey: "xxxxx",
      qiniuBucket: "xxx",
      qiniuZone: "Zone_z0",
    }),
  ],
};
```

<h2 align="center">Options</h2>

You can pass a hash of configuration options to `qiniu-upload-vuecli5`.
Allowed values are as follows

|            Name            |    Type     |                                        Default                                        | Description                                                                                             |
| :------------------------: | :---------: | :-----------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------ |
| **[`qiniuAccessKey`](#)**  | `{String}`  |                                        `null`                                         | Your Qiniu AccessKey                                                                                    |
| **[`qiniuSecretKey`](#)**  | `{String}`  |                                        `null`                                         | Your Qiniu SecretKey                                                                                    |
|   **[`qiniuBucket`](#)**   | `{String}`  |                                        `null`                                         | Your Qiniu Bucket Name                                                                                  |
|    **[`qiniuZone`](#)**    | `{String}`  |                                        `null`                                         | Your Qiniu zone code                                                                                    |
| **[`enabledRefresh`](#)**  | `{Boolean}` |                                        `false`                                        | Is enable refresh the file on Qiniu Clound after file upload                                            |
|   **[`excludeHtml`](#)**   | `{Boolean}` |                                        `true`                                         | Is exclude html file                                                                                    |
| **[`onlyRefreshHtml`](#)** | `{Boolean}` |                                        `false`                                        | only refresh html file (eg: _/demo/index.html + _/demo/), throws an exception in the case of a failure. |
|   **[`prefixPath`](#)**    | `{String}`  |                                           -                                           | prefix path for the file                                                                                |
|  **[`uploadLogPath`](#)**  | `{String}`  | [webpackConfig.context](https://webpack.js.org/configuration/entry-context/#context)  | Provide a directory where log file should be stored                                                     |
|   **[`uploadTaget`](#)**   | `{String}`  | [webpackConfig.output.path](https://webpack.js.org/configuration/output/#output-path) | The target file/folder to upload                                                                        |

About [Zone](https://developer.qiniu.com/kodo/sdk/1289/nodejs):

|      Name       | value      |
| :-------------: | :--------- |
| **[`华东`](#)** | "Zone_z0"  |
| **[`华北`](#)** | "Zone_z1"  |
| **[`华南`](#)** | "Zone_z2"  |
| **[`北美`](#)** | "Zone_na0" |
