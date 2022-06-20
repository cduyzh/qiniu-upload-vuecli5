<div align="center">
  <a href="https://cli.vuejs.org/">
    <img width="200" height="200"
      src="https://cli.vuejs.org/favicon.png">
  </a>
  <h1>Upload To qiniu cloud  webpack|vue-cli-Plugin</h1>
  <h1>Qiniu Cloud scaffolding package upload plug-in package，webpack5，vue-cli4|vue-cli5 plugin</h1>
  <p>A plugin upload file to qiniu clound for vue-cli4|vue-cli5</p>

<p align="center">
    <img src="https://img.shields.io/npm/v/webpack-plugin-qiniu-upload?style=flat-square" alt="npm version" />
    <img src="https://img.shields.io/npm/dm/webpack-plugin-qiniu-upload.svg?style=flat-square&color=#4fc08d" alt="downloads" />
</p>
</div>
<h2 align="center">Features</h2>

☁️ Support the latest SDK Qiniu Cloud upload, adapted to the latest VUE scaffolding CLI4.0 and 5.0 versions

💪 Suitable for the latest vue scaffolding cli4.0 and 5.0 versions, support webpack5 configuration

💪 Webpack5 configuration is supported

🚀 Incremental file upload is supported, eliminating the annoyance and waiting time of repeatedly uploading and refreshing files for all resources

<h2 align="center">Install</h2>

```bash
  pnpm add webpack-plugin-qiniu-upload -D
```

```bash
  yarn add webpack-plugin-qiniu-upload -D
```

<h2 align="center">Use the sample</h2>

**vue.config.js**

```js
const UploadQiNiuPlugin = require("webpack-plugin-thirdparty-upload");

module.exports = {
  ...,
  plugins: [
    new UploadQiNiuPlugin({
      qiniuAccessKey: "xxxx",
      qiniuSecretKey: "xxxxx",
      qiniuBucket: "xxx",
      qiniuZone: "Zone_z0",
      enabledRefresh: true,
      publicPath: 'https://www.yourdomain.com/',
      uploadTarget: path.resolve(__dirname, './dist'),
      appName: 'xxxx',
      fileLogPath: 'log/'
    }),
  ],
};
```

<h2 align="center">Options</h2>

### qiniu cloud Options

|            Name            |    Type     |                                             Default                                              | Description                                                                                             |
| :------------------------: | :---------: | :----------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------ |
| **[`qiniuAccessKey`](#)**  | `{String}`  |                                              `null`                                              | Your Qiniu AccessKey                                                                                    |
| **[`qiniuSecretKey`](#)**  | `{String}`  |                                              `null`                                              | Your Qiniu SecretKey                                                                                    |
|   **[`qiniuBucket`](#)**   | `{String}`  |                                              `null`                                              | Your Qiniu Bucket Name                                                                                  |
|    **[`qiniuZone`](#)**    | `{String}`  |                                              `null`                                              | Your Qiniu zone code                                                                                    |
| **[`enabledRefresh`](#)**  | `{Boolean}` |                                             `false`                                              | Is enable refresh the file on Qiniu Clound after file upload                                            |
|   **[`excludeHtml`](#)**   | `{Boolean}` |                                              `true`                                              | Is exclude html file                                                                                    |
| **[`onlyRefreshHtml`](#)** | `{Boolean}` |                                             `false`                                              | only refresh html file (eg: _/demo/index.html + _/demo/), throws an exception in the case of a failure. |
|   **[`prefixPath`](#)**    | `{String}`  |                                                -                                                 | prefix path for the file                                                                                |
|   **[`fileLogPath`](#)**   | `{String}`  |                                              `log/`                                              | Provide a directory where log file should be stored                                                     |
|   **[`publicPath`](#)**    | `{String}`  | [webpackConfig.output.publicPath](https://webpack.js.org/configuration/output/#outputpublicpath) | The prefix path to your packaged resource                                                               |
|  **[`uploadTarget`](#)**   | `{String}`  |      [webpackConfig.output.path](https://webpack.js.org/configuration/output/#output-path)       | Directory of the folder to be uploaded                                                                  |
|     **[`appName`](#)**     | `{Number}`  |                                           `Date.now()`                                           | Optional. Name of the file used to generate resource mapping file logs                                  |
|       **[`env`](#)**       | `{String}`  |                                          `development`                                           | The environment directory corresponding to the JSON file of log               |

About [qiniuZone](https://developer.qiniu.com/kodo/sdk/1289/nodejs):

## TODO LIST

- [x] Supports incremental update file upload
- [x] Supports environment With log json file
- [ ] Support log file cleaning or pull range filtering
