const md5 = require('../lib/md5');
const path = require('path')
const http = require('http');
const request = require('request');
const querystring = require('querystring');
const config = require('../../../config');
const fs = require('fs-extra')
const crypto = require('crypto');
const Busboy = require('busboy');
const diskRoot = '/tesla'


module.exports = {
    newDir: (user, dirName, callback) => {
        console.log("开始新建文件夹...");
        let key = config.skydiskApiKey;
        let currentDate = getDate();
        let md5Key = md5.hex("" + key + currentDate).toUpperCase();
        console.log(md5Key);
        console.log(diskRoot + '/' + dirName)
        let data = new config.Api.skydisk.newDirModel()
        data.d = md5Key
        data.url = diskRoot
        data.diskName = dirName
        data.role_type = user.role_type
        data.createUser = user.userID
        data.pubFlag = '2'
        console.log(data)
        let stringify = querystring.stringify(data);
        console.log(config.Api.skydisk.url + config.Api.skydisk.newDirUrl + '?' + stringify)
        request.get({
            url: config.Api.skydisk.url + config.Api.skydisk.newDirUrl + '?' + stringify
        }, function optionalCallback(err, httpResponse, body) {
            if (err) {
                console.error('upload failed:', err);
                callback(false);
            } else {
                try {
                    testJson = JSON.parse(body)
                } catch (e) {
                    console.log(e)
                    testJson = null
                    console.log(testJson)
                    callback(false);
                    return false
                }
                console.log(testJson)
                callback(testJson);
            }
        });
    },
    getFileList: (user,diskUrl, page, order_name, order_type, callback) => {
        console.log("获取网盘文件夹内文件..");
        let key = config.skydiskApiKey;
        let currentDate = getDate();
        let md5Key = md5.hex("" + key + currentDate).toUpperCase();
        let data = new config.Api.skydisk.fileListModel()
        data.d = md5Key
        data.url = diskRoot + '/' + diskUrl
        data.role_type = user.role_type
        data.user_id = user.userID
        data.order_name = order_name
        data.order_type = order_type
        data.disk_type = 1
        data.singlePage_fileNum = 10
        data.no = page
        console.log(data)
        let stringify = querystring.stringify(data);
        request.get({
            url: config.Api.skydisk.url + config.Api.skydisk.fileListUrl + '?' + stringify
        }, function optionalCallback(err, httpResponse, body) {
            if (err) {
                console.error('upload failed:', err);
                callback(false);
            } else {
                // console.log(httpResponse)
                // console.log(body)
                // let testJson;
                try {
                    testJson = JSON.parse(body)
                } catch (e) {
                    console.log(e)
                    testJson = null
                    callback(false);
                    return false
                }
                callback(testJson)
            }
        });
    },
    uploadFiles: (res, req, sourcePath) => {
        return new Promise((resolve, reject) => {
            let info = {
                flag: false,
                message: '',
                data: null
            }
            resolve(info)
            io = req.app.get('socket')
            let busboy = new Busboy({headers: req.headers});
            let messData = null
            let dirUrl;
            busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
                console.log('Field [' + fieldname + ']: value: ');
                if (fieldname === 'userData') {
                    messData = val
                }
                if (fieldname === "dirUrl"){
                    dirUrl = val
                }
            });

            busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
                let fileSize = 0;
                let hash = crypto.createHash('md5');
                file.on('data', function (data) {
                    // console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
                    fileSize += data.length
                    hash.update(data)
                });
                file.on('end', function () {
                    console.log('File [' + fieldname + '] Finished');
                });

                file.on('close', function () {
                    console.log('File [' + fieldname + '] closed');
                });
                console.log(filename)
                console.log(mimetype)

                let fileNamePrefix = '/' + Date.now() + '-'
                let storeFileName = fileNamePrefix + filename
                let filepath = path.normalize(sourcePath + storeFileName)
                let writerStream = fs.createWriteStream(filepath)

                writerStream.on('error', (err) => {
                    info.message = err
                    writerStream.end(err);
                    res.send(info)
                })

                writerStream.on('finish', () => {
                    let key = config.Api.skydisk.staticKey
                    let md5Key = md5.hex("" + key + getCurrentTime(2)).toUpperCase()
                    let uploadData = new config.Api.skydisk.uploadModel()
                    uploadData.d = md5Key
                    uploadData.url = diskRoot + '/' + dirUrl
                    uploadData.role_type = req.session.user.role_type
                    uploadData.createUser = req.session.user.userID
                    let fileMD5 = hash.digest('hex')
                    console.log('fileMD5 --->', fileMD5)
                    let md5Path = ''
                    for (let i = 0; i < fileMD5.length; i++) {
                        md5Path += fileMD5[i]
                        console.log(i % 5)
                        if (!(i % 5) && i) {
                            md5Path += '/'
                        }
                    }
                    console.log('md5Path--->', md5Path)
                    md5Path = path.normalize(sourcePath + '/' + md5Path)
                    let newFilePath = path.normalize(md5Path + '/' + filename)
                    info.flag = true
                    info.message = "上传成功"
                    res.send(info)

                    fs.ensureDir(md5Path).then(() => {
                        return fs.rename(filepath, newFilePath)
                    }, (err) => {
                        console.log(err)
                        io.sockets.emit('end_store', {
                            flag: false,
                            message: "上传错误" + err,
                            data: null,
                            userData: null
                        })
                        return false
                    }).then(() => {
                        //此处开始向资源管理系统传文件
                        uploadData.data = fs.createReadStream(newFilePath)
                        let rUpload = request.post({
                            url: config.Api.skydisk.url + config.Api.skydisk.uploadUrl,
                            formData: uploadData
                        }, function optionalCallback(err, httpResponse, body) {
                            let result = {
                                flag: false,
                                message: '',
                                data: null,
                                userData: null
                            }
                            if (err) {
                                console.log(err)
                                result.message = err
                                io.sockets.emit('end_store', result)
                            }
                            else {
                                if (body) {
                                    let obj
                                    try {
                                        obj = JSON.parse(body)
                                    }
                                    catch (e) {
                                        console.log(err)
                                        result.message = "上传错误"
                                        result.userData = messData
                                        io.sockets.emit('end_store', result)
                                        return false
                                    }
                                    if (obj.ok) {
                                        result.flag = true
                                        result.message = obj.message
                                        result.data = obj.data
                                        result.userData = messData
                                        io.sockets.emit('end_store', result)
                                    }
                                    else {
                                        result.message = obj.message
                                        result.data = obj.data
                                        result.userData = messData
                                        io.sockets.emit('end_store', result)
                                    }
                                }
                                else {
                                    console.log(err)
                                    result.message = "上传错误" + err
                                    result.userData = messData
                                    io.sockets.emit('end_store', result)
                                }

                            }
                        }).on('drain', (data) => {
                            let progress = 100 * rUpload.req.connection._bytesDispatched / fileSize;
                            console.log(progress)
                        })
                    }, (err) => {

                    })
                });

                file.pipe(writerStream)

            });

            busboy.on('finish', function () {
                console.log('Done parsing form!');
            });
            req.pipe(busboy);
        })
    }
}


function getDate() {
    let mydate = new Date();
    let year = "" + mydate.getFullYear();
    let month = mydate.getMonth() + 1;
    let day = mydate.getDate();
    let str = year + "-" + (month < 10
        ? "0" + month
        : month) + "-" + (day < 10
        ? "0" + day
        : day);
    return str;
}

function getCurrentTime(type) {
    var myDate = new Date();
    var date = myDate.getFullYear() + "-" + sup(parseInt(myDate.getMonth() + 1)) + "-" + sup(myDate.getDate());
    var time = sup(myDate.getHours()) + ":" + sup(myDate.getMinutes()) + ":" + sup(myDate.getSeconds());
    switch (type) {
        case 0:
            return date + " " + time;
            break;
        case 1:
            return time;
            break;
        case 2:
            return date;
            break;
    }
}

function sup(n) {
    return (n < 10)
        ? '0' + n
        : n;
}