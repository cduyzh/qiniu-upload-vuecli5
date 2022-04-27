"use strict";
const promisify = require("util.promisify");
const dayjs = require("dayjs");
const qiniu = require("qiniu");
const fs = require("fs");
const path = require("path");
const _array = require("lodash/array");
const _extend = require("lodash/extend");
const hideFile = require("hideFile");
const chalk = require("chalk");
const fsStatPromise = promisify(fs.stat);
const fsReadDirPromise = promisify(fs.readdir);

const log = console.log;

class UploadQiNiuPlugin {
  constructor(options) {
    this.options = _extend(
      {
        qiniuAccessKey: "qiniuAccessKey",
        qiniuSecretKey: "qiniuSecretKey",
        qiniuBucket: "qiniuBucket",
        qiniuZone: "Zone_z0",
        uploadTarget: null, // targe to upload
        excludeHtml: true,
        publicPath: "",
        enabledRefresh: false,
        onlyRefreshHtml: false,
        uploadLogPath: null,
        prefixPath: "",
      },
      options
    );
    this.config = new qiniu.conf.Config();
    this.config.zone = qiniu.zone[this.options.qiniuZone];
    qiniu.conf.RPC_TIMEOUT = 600000;

    this.mac = new qiniu.auth.digest.Mac(
      this.options.qiniuAccessKey,
      this.options.qiniuSecretKey
    );

    // global value
    this.allUploadIsSuccess = true;
    this.allRefreshIsSuccess = true;
    this.failedObj = {
      uploadFiles: {},
      refreshArr: [],
    };
    this.needUploadArray = [];
    this.successUploadFilesData = {};

    this.uploadCount = 0;
    this.fileCount = 0;

    this.callback = null;
  }
  apply(compiler) {
    const _this = this;

    if (!_this.options.uploadTarget) {
      _this.options.uploadTarget = compiler.options.output.path;
    }

    if (!_this.options.publicPath) {
      _this.options.publicPath = compiler.options.output.publicPath;
    }

    if (!_this.options.uploadLogPath) {
      _this.options.uploadLogPath = compiler.options.context;
    }

    (compiler.hooks
      ? compiler.hooks.afterEmit.tapAsync.bind(
          compiler.hooks.afterEmit,
          "UploadQiNiuPlugin "
        )
      : compiler.plugin.bind(compiler, "afterEmit"))(
      (compilation, callback) => {
        _this.callback = callback.bind(this);

        log(chalk.black.bgBlue.bold("\nStarting upload"));

        _this.readFilesFormDir(_this.options.uploadTarget).then((paths) => {
          _this.fileCount = paths.length;
          log(`${chalk.green("Starting upload files to qiniu cloud")}`);

          paths.forEach((item) => {
            let key = path.relative(_this.options.uploadTarget, item);
            if (_this.successUploadFilesData[key]) {
              delete _this.successUploadFilesData[key];
            }
            _this.needUploadArray.push(item);

            if (_this.needUploadArray.length == _this.fileCount) {
              log(
                `Uploading ${chalk.red(_this.needUploadArray.length)} files...`
              );
              _this.uploadFilesByArr(_this.needUploadArray);
            }
          });
        });
      }
    );
  }

  getToken(bucket, key) {
    let options = {
      scope: bucket + ":" + key,
    };

    let putPolicy = new qiniu.rs.PutPolicy(options);

    return putPolicy.uploadToken(this.mac);
  }

  uploadFile(uptoken, key, localFile) {
    let formUploader = new qiniu.form_up.FormUploader(this.config),
      putExtra = new qiniu.form_up.PutExtra();

    formUploader.putFile(
      uptoken,
      key,
      localFile,
      putExtra,
      (err, respBody, respInfo) => {
        if (err) {
          this.allUploadIsSuccess = false;
          this.failedObj.uploadFiles[key] = dayjs().format(
            "YYYY-MM-DD HH:mm:ss"
          );
          console.error(` ${key}  Upload Failed!!`);
        }
        this.uploadCount++;

        if (this.uploadCount === this.needUploadArray.length) {
          this.delateFileInCloud();
        }
      }
    );
  }

  delateFileInCloud() {
    let _this = this;
    if (this.allUploadIsSuccess) {
      log(chalk.black.bgGreen.bold("\nSuccessful"));
      log(chalk.green("All File Is Upload Successful"));
    }

    let bucketManager = new qiniu.rs.BucketManager(this.mac, this.config),
      successDtaKeys = Object.keys(this.successUploadFilesData),
      successDtaKeysLength = successDtaKeys.length,
      allFileIsSuccess = true,
      deleteOperations = [];

    if (successDtaKeysLength !== 0) {
      successDtaKeys.forEach((key) => {
        deleteOperations.push(qiniu.rs.deleteOp(this.options.qiniuBucket, key));
      });

      log(`Deleting ${successDtaKeys.length} Files on CDN \r\n`);

      bucketManager.batch(deleteOperations, function (err, respBody, respInfo) {
        if (err) {
          console.error(`Deleting Files Error: ${err}`);
        } else {
          // 200 is success, 298 is part success
          if (parseInt(respInfo.statusCode / 100) == 2) {
            respBody.forEach(function (item) {
              if (item.code !== 200) {
                allFileIsSuccess = false;
                console.error(`${item}\r\n`);
              }
            });
            if (allFileIsSuccess) {
              log("All Extra File Is Deleted Form QiniuCloud Successful\r\n");
            } else {
              console.error("Some Deleted is Failed\r\n");
            }
          } else {
            log(respBody);
          }
        }
        if (_this.options.enabledRefresh) {
          _this.refreshInCloud(_this.needUploadArray || []);
        } else {
          _this.callback();
        }
      });
    } else {
      log("There Is Not Have Extra File Need To Delete\r\n");
      if (this.options.enabledRefresh) {
        this.refreshInCloud(this.needUploadArray || []);
      } else {
        this.callback();
      }
    }
  }

  refreshInCloud(needRefreshArr = []) {
    let cdnManager = new qiniu.cdn.CdnManager(this.mac);
    if (this.options.onlyRefreshHtml) {
      needRefreshArr = needRefreshArr.filter(
        (item) => path.extname(item) === ".html"
      );
      needRefreshArr = [
        ...needRefreshArr,
        ...needRefreshArr.map((item) => `${path.dirname(item)}/`),
      ];
    }
    const _this = this;
    //  Can refresh 100 one time
    let refreshQueue = _array.chunk(needRefreshArr, 100);
    log(`Refreshing ${needRefreshArr.length} files...`);

    refreshQueue.forEach((item, index) => {
      item = item.map((it) => {
        return (
          this.options.publicPath +
          it.replace(this.options.uploadTarget + "/", "")
        );
      });
      cdnManager.refreshUrls(item, function (err, respBody, respInfo) {
        if (err) {
          _this.allRefreshIsSuccess = false;
          _this.failedObj.refreshArr = _this.failedObj.refreshArr.concat(
            item.map((it) => it.replace(_this.options.uploadTarget + "/", ""))
          );
          console.error("Refresh Files Failed\r\n");

          if (_this.options.onlyRefreshHtml) {
            // throw new Error(err)
            process.exit(1); // 操作系统发送退出码（强制终止），返回零时才会继续，任何非零退出代码Jenkins将判定为部署失败。
          }
        }
        if (respInfo.statusCode == 200) {
          log(chalk.cyan("\nRefreshInCloud Files Successful \n"));
          log(chalk.green("Finish upload files to qiniu cloud \n"));
        }
        if (index === refreshQueue.length - 1) {
          _this.callback();
        }
      });
    });
  }

  uploadFilesByArr(arr) {
    arr.forEach((path) => {
      let filePath = path,
        key = path.replace(
          this.options.uploadTarget + "/",
          this.options.prefixPath
        ),
        token = this.getToken(this.options.qiniuBucket, key);

      this.uploadFile(token, key, filePath);
    });
  }

  readFilesFormDir(dir) {
    return fsStatPromise(dir).then((stats) => {
      let ret;
      if (hideFile.isHiddenSync(dir)) return [];

      if (stats.isDirectory()) {
        ret = fsReadDirPromise(dir)
          .then((files) => {
            return Promise.all(
              files.map((file) => this.readFilesFormDir(dir + "/" + file))
            );
          })
          .then((paths) => {
            return [].concat(...paths);
          });
        ret = ret || [];
      } else if (stats.isFile()) {
        if (!this.options.excludeHtml) {
          ret = dir;
        } else {
          !/\.html$/.test(dir) ? (ret = dir) : (ret = []);
        }
      } else {
        ret = [];
      }
      return ret;
    });
  }
}

module.exports = UploadQiNiuPlugin;
