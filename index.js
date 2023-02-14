"use strict";
const promisify = require("util.promisify");
const qiniu = require("qiniu");
const fs = require("fs");
const path = require("path");
const _array = require("lodash/array");
const _extend = require("lodash/extend");
const hideFile = require("hidefile");
const chalk = require("chalk");
const axios = require('axios');
const AWS = require("aws-sdk");
const mime = require('mime');
// Set the AWS Region.
const REGION = "us-east-1";

const fsStatPromise = promisify(fs.stat);
const fsReadDirPromise = promisify(fs.readdir);

const log = console.log;

class Upload {
	constructor(options) {
		this.options = _extend(
			{
				accessKey: "accessKey",
				secretKey: "secretKey",
				bucket: "bucket",
				uploadTarget: null, // targe to upload
				excludeHtml: true,
				publicPath: "",
				enabledRefresh: false,
				onlyRefreshHtml: false,
				prefixPath: "",
				appName: Date.now(),
				fileLogPath: 'log/',
				env: 'development',
				suffix: '', // cuttome suffix eg: '-v1', reset the old log file
				htmlPath: '',
			},
			options
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

		this.logJsonFileName = `${this.options.appName}-${this.options.env}`

		// 线上log json资源映射文件地址
		this.jsonFilePath = `${this.options.publicPath}${this.options?.fileLogPath || '/'}${this.logJsonFileName}${this.options.suffix}.json`
		// 本地资源映射文件目录地址
		this.logLocalDirPath = `${this.options.uploadTarget}/${this.options?.fileLogPath || '/'}`
		// 本地log文件存放地址
		this.logLocalPath = `${this.logLocalDirPath}${this.logJsonFileName}${this.options.suffix}.json`
		console.log('logLocalPath', this.logLocalPath)
		// 需要新上传的文件列表
		this.newFileList = []
		// 线上已存在的资源文件映射列表
		this.fileExistList = []
		// webpack自身回调，调用后通知webpack插件执行完毕
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

		// 如果没有传以上 默认赋值webpack内设置的值

		(compiler.hooks
			? compiler.hooks.afterEmit.tapAsync.bind(
				compiler.hooks.afterEmit,
				"UploadQiNiuPlugin "
			)
			: compiler.plugin.bind(compiler, "afterEmit"))(
				async (compilation, callback) => {
					// callback执行回调告知webpack插件调用完成
					_this.callback = callback.bind(this);
					log(chalk.black.bgBlue.bold("\nStarting upload"));
					const paths = await _this.readFilesFormDir(_this.options.uploadTarget)
					try {
						log('get data from url:', _this.jsonFilePath)
						// TODO:用过原生node https模块 序列化json数据的时候，数据量过大会出现 问题，没有解决到，所以换了axios来代替发送请求，如果可以舍弃axios用node模块减少依赖更好
						const res = await axios.get(_this.jsonFilePath, {
							params: {
								// 避免获取最新映射资源路劲被缓存
								_: Date.now()
							}
						});
						const resData = res.data

						_this.fileExistList = resData

						_this.newFileList = paths.filter(e => (!this.options.excludeHtml && e.endsWith('.html')) || !_this.fileExistList.map(i => i.path).includes(e.replace(
							_this.options.uploadTarget + "/",
							_this.options.prefixPath
						)))

					} catch (error) {
						log(
							`Error: ${chalk.red('not found file log')}`
						);

						_this.newFileList = paths
					}

					if (!_this.newFileList.length) {
						throw new Error('没有新的文件需要上传到云')
					}
					// TODO: 测试代码
					// _this.newFileList = paths

					_this.fileCount = _this.newFileList.length;
					_this.preUpload()
				}
			);
	}
	preUpload() {
		try {
			const _this = this;

			_this.newFileList.forEach((item) => {
				let key = path.relative(_this.options.uploadTarget, item);
				if (_this.successUploadFilesData[key]) {
					delete _this.successUploadFilesData[key];
				}
				_this.needUploadArray.push(item);

				if (_this.needUploadArray.length === _this.fileCount) {
					if (!fs.existsSync(_this.logLocalDirPath)) {
						fs.mkdirSync(_this.logLocalDirPath);
					}
					const fd = fs.openSync(`${_this.logLocalPath}`, 'w');

					fs.writeFileSync(fd,
						JSON.stringify(
							_this.fileExistList
								.concat(
									_this.needUploadArray.map(e => {
										return {
											path: e.replace(
												this.options.uploadTarget + "/",
												this.options.prefixPath
											),
											updateTime: new Date().toLocaleString()
										}
									}).filter(item => !item.path.endsWith('.html'))
								)
						)
					)
					_this.needUploadArray.push(`${_this.logLocalPath}`);
					log(`${chalk.green("Starting upload files to cloud")}`);
					log(
						`Uploading ${chalk.red(_this.needUploadArray.length)} files...`
					);
					_this.uploadFilesByArr(_this.needUploadArray);
				}
			});
		} catch (error) {
			console.log(error);
		}
	}
	uploadFilesByArr(arr) {
		arr.forEach((path) => {
			let filePath = path,
				key = path.replace(
					this.options.uploadTarget + "/",
					this.options.prefixPath
				)
			if (!this.options.excludeHtml && key.includes('.html')) {
				key = this.options.htmlPath ? this.options.htmlPath + "/" + key : key
			}
			this.uploadFile(key, filePath);
		});
		console.log('执行完毕');
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

class UploadQiNiuPlugin extends Upload {
	constructor(options) {
		super(options);
		this.options = _extend(
			{
				region: "",
			},
			this.options
		);
		console.log({options: this.options})

		this.config = new qiniu.conf.Config();
		this.config.zone = qiniu.zone[this.options.region];
		qiniu.conf.RPC_TIMEOUT = 600000;

		this.mac = new qiniu.auth.digest.Mac(
			this.options.accessKey,
			this.options.secretKey
		);
	}
	getToken(bucket, key) {
		let options = {
			scope: bucket + ":" + key,
		};

		let putPolicy = new qiniu.rs.PutPolicy(options);

		return putPolicy.uploadToken(this.mac);
	}

	async uploadFile(fileName, localFilePath) {
		const token = this.getToken(this.options.bucket, fileName);
		this.uploadFileToQiniu(token, fileName, localFilePath)
	}

	// 上传文件到七牛
	uploadFileToQiniu(token, fileName, localFilePath) {
		let formUploader = new qiniu.form_up.FormUploader(this.config),
			putExtra = new qiniu.form_up.PutExtra();

		formUploader.putFile(
			token,
			fileName,
			localFilePath,
			putExtra,
			(err, respBody, respInfo) => {
				if (err) {
					this.allUploadIsSuccess = false;
					this.failedObj.uploadFiles[fileName] = new Date().toLocaleString()
					console.error(`files ${fileName}  Upload Failed!!`);
				}
				this.uploadCount++;
				log(`${chalk.green(`\nupload files ${fileName} success\n`)}`);

				if (this.uploadCount === this.needUploadArray.length && this.options.enabledRefresh) {
					this.refreshInCloud(this.needUploadArray || []);
				}
			}
		);
	}


	refreshInCloud(needRefreshArr = []) {
		const _this = this;
		let cdnManager = new qiniu.cdn.CdnManager(_this.mac);
		if (_this.options.onlyRefreshHtml) {
			needRefreshArr = needRefreshArr.filter(
				(item) => path.extname(item) === ".html"
			);
			// 刷html文件以及它的父目录
			needRefreshArr = [
				...needRefreshArr,
				...needRefreshArr.map((item) => `${path.dirname(item)}/`),
			];
		}
		//  单次请求不能超过100个
		let refreshQueue = _array.chunk(needRefreshArr, 100);
		log(`Refreshing ${needRefreshArr.length} files...`);
		refreshQueue.forEach((item, index) => {
			const refreshUrlMap = item.map((e) => {
				return (
					this.options.publicPath +
					e.replace(this.options.uploadTarget + "/", "")
				);
			});
			cdnManager.refreshUrls(refreshUrlMap, function (err, respBody, respInfo) {
				if (err) {
					_this.allRefreshIsSuccess = false;
					_this.failedObj.refreshArr = _this.failedObj.refreshArr.concat(
						item.map((e) => e.replace(_this.options.uploadTarget + "/", ""))
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
					// 删除本地的log文件
					// fs.unlinkSync(`${_this.logLocalPath}`)
				}
				if (index === refreshQueue.length - 1) {
					_this.callback();
				}
			});
		});
	}


}
class UploadAwsPlugin extends Upload {
	constructor(options) {
		super(options);
		this.options = _extend(
			{
				awsDistributionId: ''
			},
			this.options
		);
		console.log({options: this.options})

		const credentials = {
			accessKeyId: this.options.accessKey,
			secretAccessKey: this.options.secretKey,
		}; //秘钥形式的登录上传
		AWS.config.update(credentials);
		AWS.config.region = this.options.region,
		this.bucket = new AWS.S3({params: {Bucket: this.options.bucket}})
	}

	async uploadFile(fileName, localFilePath) {
		this.uploadFileToAws(fileName, localFilePath)
	}

	// 上传文件到aws
	uploadFileToAws(fileName, localFilePath) {
		// console.log(fileName, localFilePath);
		const _this = this;
		const fileStream = fs.createReadStream(localFilePath);
		const fileType = mime.getType(localFilePath)
		try {
			var params = {Key: fileName, ContentType: fileType, Body: fileStream, 'Access-Control-Allow-Credentials': '*', 'ACL': 'public-read'};
			this.bucket.upload(params, function (err, data) {
				if (err) {
					console.log("error", err);
				}
				// console.log(data);
				log(`${chalk.green(`upload ${fileName} success\n`)}`);
				_this.uploadCount++;
				if (_this.uploadCount === _this.needUploadArray.length && _this.options.enabledRefresh) {
					log(`${chalk.green(`upload ${_this.needUploadArray.length} files success\n`)}`);
					_this.refreshAwsCloud(_this.needUploadArray || []);
				}
			});
		} catch (err) {
			console.log("Error", err);
		}
	}

	// aws 刷新cdn资源
	refreshAwsCloud(newFileList) {
		log(`${chalk.yellow("开始刷新...")}`);
		const _this = this
		const cloudfront = new AWS.CloudFront();
		const newfilePath = newFileList.map(item => {
			const key = "/" + item.replace(
				this.options.uploadTarget + "/",
				'')
			if (!this.options.excludeHtml && key.includes('.html')) {
				return ("/" + this.options.htmlPath + key).replaceAll('//', '/')
			} else {
				return key
			}
		})
		console.log(newfilePath);
		var params = {
			DistributionId: this.options.awsDistributionId, /* required */
			InvalidationBatch: { /* required */
				CallerReference: Date.now().toString(), /* required */
				Paths: { /* required */
					Quantity: newfilePath.length, /* required */
					Items: newfilePath,
				}
			}
		};
		cloudfront.createInvalidation(params, function (err, data) {
			if (err) console.log(err, err.stack);
			else console.log(data);
			log(`${chalk.green("刷新链接成功")}`);
			fs.unlinkSync(`${_this.logLocalPath}`)
			_this.callback();
		});
	}
}

function uploadPlugin(option) {
	try {
		switch (option.sdkName) {
			case 'qiniu':
				return new UploadQiNiuPlugin(option)
			case 'aws':
				return new UploadAwsPlugin(option)
			default:
				break;
		}
	} catch (error) {
		console.log(error);
	}
}
module.exports = uploadPlugin;
