<div align="center">
  <a href="https://cli.vuejs.org/">
    <img width="200" height="200"
      src="https://cli.vuejs.org/favicon.png">
  </a>
  <h1>Upload To qiniu cloud  webpack|vue-cli-Plugin</h1>
  <h1>七牛云脚手架打包上传的插件封装，webpack5和vue-cli4|vue-cli5 plugin</h1>
  <p>A plugin upload file to qiniu clound for vue-cli4|vue-cli5</p>

<p align="center">
    <img src="https://img.shields.io/npm/v/webpack-plugin-qiniu-upload?style=flat-square" alt="npm version" />
    <img src="https://img.shields.io/npm/dm/webpack-plugin-qiniu-upload.svg?style=flat-square&color=#4fc08d" alt="downloads" />
</p>
</div>
<h2 align="center">功能特点</h2>

☁️  支持最新的sdk 七牛云上传，适配最新的vue脚手架cli4.0及5.0以上版本

💪  适配最新的vue脚手架cli4.0及5.0以上版本，支持webpack5的配置

💪  支持webpack5的配置

🚀  支持增量文件上传，告别所有资源重复上传并刷新文件的烦恼和等待时间



<h2 align="center">安装</h2>

```bash
  pnpm add webpack-plugin-qiniu-upload -D
```

```bash
  yarn add webpack-plugin-qiniu-upload -D
```

<h2 align="center">使用示例</h2>

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
|   **[`publicPath`](#)**    | `{String}`  | [webpackConfig.output.publicPath](https://webpack.js.org/configuration/output/#outputpublicpath) | 你打包后的资源所带的前缀路径                                                                            |
|  **[`uploadTarget`](#)**   | `{String}`  |      [webpackConfig.output.path](https://webpack.js.org/configuration/output/#output-path)       | 待上传的文件夹目录                                                                                      |
|     **[`appName`](#)**     | `{Number}`  |  `Date.now()`       | 可选，用于生成资源映射文件日志的文件名                                                                  |


About [qiniuZone](https://developer.qiniu.com/kodo/sdk/1289/nodejs):

|      Name       | value      |
| :-------------: | :--------- |
| **[`华东`](#)** | "Zone_z0"  |
| **[`华北`](#)** | "Zone_z1"  |
| **[`华南`](#)** | "Zone_z2"  |
| **[`北美`](#)** | "Zone_na0" |

## 待办事项
- [x] 支持增量更新的文件上传
- [ ] 支持日志文件清理或拉取范围筛选