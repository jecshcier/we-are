let md5 = require('../lib/md5');
let http = require('http');
let request = require('request');
let querystring = require('querystring');
let config = require('../../../config');
let fs = require('fs-extra')

module.exports = {
    newDir: (userID, dirID, dirName, callback) => {
        console.log("开始新建文件夹...");
        var key = config.skydiskApiKey;
        var currentDate = getDate();
        var md5Key = md5.hex("" + key + currentDate).toUpperCase();
        console.log(md5Key);
        var data = {
            'd': md5Key,
            'parentId': 'A24C1C1353744AB17E8A271BDD1AC772',
            'fileId': dirID,
            'fileName': dirName,
            'pubFlag': '2',
            'userId': userID
        }
        var stringify = querystring.stringify(data);
        request.get({
            url: config.skydiskServer + config.newDirApi + '?' + stringify
        }, function optionalCallback(err, httpResponse, body) {
            if (err) {
                callback(false);
                return console.error('upload failed:', err);
            } else {
                var testJson = eval("(" + body + ")");
                try {
                    testJson = JSON.parse(body)
                } catch (e) {
                    console.log(e)
                    testJson = null
                }
                callback(testJson);
            }
        });
    },
    getFileList: (diskid, userID, page, order_name, order_type, callback) => {
        console.log("获取网盘文件夹内文件..");
        var key = config.skydiskApiKey;
        var currentDate = getDate();
        var md5Key = md5.hex("" + key + currentDate).toUpperCase();
        var data = {
            'd': md5Key,
            'id': diskid,
            'user_id': userID,
            'order_name': order_name,
            'order_type': order_type,
            'disk_type': '2',
            'no': page
        }
        var stringify = querystring.stringify(data);
        request.get({
            url: config.skydiskServer + config.getFileListApi + '?' + stringify
        }, function optionalCallback(err, httpResponse, body) {
            if (err) {
                callback(false);
                return console.error('upload failed:', err);
            } else {
                var testJson = null;
                try {
                    testJson = JSON.parse(body)
                } catch (e) {
                    console.log(e)
                    testJson = null
                }
                callback(testJson)
            }
        });
    },
    uploadFiles: (file, user) => {
        let key = config.skydiskApi.staticKey
        let md5Key = md5.hex("" + key +  getDate()).toUpperCase()
        console.log(md5Key)
        console.log(file)
        console.log(user)
        // rUpload = request.post({
        //     url: config.skydiskApi.url + config.skydiskApi.uploadUrl,
        //     formData: {
        //         d: md5Key,
        //         data: file,
        //         url: '/ebookV3',
        //         role_type: '3',
        //         createUser: 'B220F7C944ECD1DDD0BF063F4439E961'
        //     }
        // }, function optionalCallback(err, httpResponse, body) {
        //     if(err)
        //     {
        //
        //     }
        //     else {
        //         console.log(body)
        //     }
        // })
    }
}


function getDate() {
    var mydate = new Date();
    var year = "" + mydate.getFullYear();
    var month = mydate.getMonth() + 1;
    var day = mydate.getDate();
    var str = year + "-" + (month < 10
        ? "0" + month
        : month) + "-" + (day < 10
        ? "0" + day
        : day);
    return str;
}