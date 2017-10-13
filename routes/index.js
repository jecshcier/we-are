let express = require('express');
let router = express.Router();
let md5 = require('./assets/lib/md5');
let sql = require('./assets/sql/sql');
// var userSql = require('./assets/sql/userSql.js');
let skydiskApi = require('./assets/skydiskApi/useApi');
let config = require('../config');
let fs = require('fs-extra');
let ejsUrl = config.projectName;
let staticUrl = config.static;
let txUrl = config.Tx;
let imgUrl = config.img;
let request = require('request')
/*登录页面*/
router.get('/', function (req, res, next) {
        if (req.session.user) {
            res.redirect('/weare/chat');
        } else
            res.render('index', {
                title: 'Hello! We\'re！',
                ejsUrl: ejsUrl,
                staticUrl: staticUrl,
                txUrl: txUrl,
                teslaVersion: config.teslaVersion
            });
    }
);
/*聊天界面*/
router.get('/chat', function (req, res, next) {
        if (req.session.user) {
            console.log(staticUrl);
            res.render('chat', {
                title: 'We\'re chatting~',
                userTx: txUrl + '/' + req.session.user['userID'] + '.jpg',
                userName: req.session.user['nickName'],
                ejsUrl: ejsUrl,
                staticUrl: staticUrl,
                txUrl: txUrl,
                role_type: req.session.user['role_type'],
                teslaVersion: config.teslaVersion
            });
        } else
            res.redirect('/weare');
    }
);
/*以下为接口*/

//初始化用户数据（传出用户id、姓名、group等信息）
router.get('/init', function (req, res, next) {
        if (req.session.user) {
            console.log(req.session.user);
            var user = new Object();
            user['userInfo'] = req.session.user;
            sql.getProjectTeamByUser(user.userInfo.userID, function (result) {
                user['projectTeam'] = result;
                res.send(user);
            });
        } else
            res.redirect('/weare');
    }
);
//传出所有项目组list
router.get('/getWholeProjectTeam', function (req, res, next) {
        if (req.session.user) {
            sql.getWholeProjectTeam(function (result) {
                res.send(result);
            });
        } else
            res.redirect('/weare');
    }
);
//传出所给用户的所在项目组
router.get('/getUserGroups', function (req, res, next) {
        if (req.session.user) {
            sql.getProjectTeamByUser(req.session.user.userID, function (result) {
                res.send(result);
            });
        } else
            res.redirect('/weare');
    }
);
//传出项目组内所有用户
router.post('/getProjectUsers', function (req, res, next) {
        if (req.session.user) {
            sql.getProjectUsers(req.body.groupID, function (result) {
                console.log(result);
                res.send(result);
            });
        } else
            res.redirect('/weare');
    }
);
//将用户移除某个项目组
router.post('/deleteUserInGroup', function (req, res, next) {
        var group = new Object();
        var user = new Object();
        group['groupID'] = req.body['group[groupID]'];
        group['groupName'] = req.body['group[groupName]'];
        user['userID'] = req.body['user[userID]'];
        user['userName'] = req.body['user[userName]'];
        if (req.session.user) {
            sql.deleteProjectTeamWithUser(user.userID, group.groupID, function (result) {
                res.send(result);
            });
        } else
            res.redirect('/weare');
    }
);
//将用户加入某个项目组
router.post('/createGroupWithUser', function (req, res, next) {
        var group = new Object();
        var user = new Object();
        group['groupID'] = req.body['group[groupID]'];
        group['groupName'] = req.body['group[groupName]'];
        user['userID'] = req.body['user[userID]'];
        user['userName'] = req.body['user[userName]'];
        if (req.session.user) {
            sql.createProjectTeamWithUser(user, group, function (result) {
                res.send(result);
            });
        } else
            res.redirect('/weare');
    }
);
//创建某个项目组
router.post('/createGroup', function (req, res, next) {
        if (req.session.user) {
            var groupID = md5.hex(req.body.groupName + '' + getCurrentTime(0));
            skydiskApi.newDir(req.body.userID, groupID, req.body.groupName, function (data) {
                if (data.ok) {
                    sql.createProject(groupID, req.body.groupName, req.body.userID, function (result) {
                        if (result) {
                            result.ok = true;
                            res.send(result);
                        } else {
                            result.ok = false;
                            result.commont = 'sorry，项目组创建失败，请前往网盘删除文件夹';
                            res.send(result)
                        }
                    });
                } else {
                    data.ok = false;
                    data.comment += '\n*由于网盘文件夹创建失败，项目组创建失败！*'
                    res.send(data);
                }
            });
        } else
            res.redirect('/weare');
    }
);
/*更改用户头像*/
router.post('/saveUserTx', function (req, res, next) {
        if (req.session.user) {
            var userID = req.body.userID;
            var url = req.body.url;
            console.log(userID);
            console.log(url);
            url = url.replace(staticUrl, '');
            fs.copy('public/' + url, config.TxDir + userID + '.jpg', {
                replace: false
            }, function (err) {
                if (err) {
                    // i.e. file already exists or can't write to directory
                    throw err;
                    res.send(null);
                }
                console.log("复制头像成功");
                res.send(true);
            });
        } else
            res.redirect('/weare');
    }
);
//获取用户头像
// router.get('/getUserTx', function(req, res, next) {
// 	if (req.session.user) {
// 		var userID = req.query.userID;
// 		sql.getUserTx(userID, function(result) {
// 			res.send(result);
// 		});
// 	} else
// 		res.redirect('/weare');
// });
//删除某个项目组(暂不使用)
//获取某项目组聊天记录(50条)
router.post('/getGroupMessages', function (req, res, next) {
        if (req.session.user) {
            sql.getGroupMessages(req.body.groupID, req.body.page, function (result) {
                res.send(result);
            });
        } else
            res.redirect('/weare');
    }
);
//登录模块-skydisk
router.post('/login', function (req, res) {
    console.log("接收登录请求");
    let info = {
        flag: false,
        message: '',
        data: null
    }
    let _username = req.body.username;
    let _password = req.body.password;

    //旧版登录
    // sql.logincheck(user, function(result) {
    //     if (result) {
    //         console.log("登录成功");
    //         req.session.user = result;
    //         req.session.user.sessionID = req.sessionID
    //         sql.updateGroupUserName(result.userID, result.nickName, function(result) {
    //             res.send(req.session.user);
    //         });
    //     } else {
    //         console.log("登录失败");
    //         res.send(null);
    //     }
    // });
    console.log(config.umsUrl + '/user/login')
    let userdata = {
        mobile: "",
        passWord: _password,
        studentId: _username,
        systemCode: "ebook",
        verifyCode: ""
    }
    request.post({
        url: config.umsUrl + '/user/login',
        body: userdata,
        json: true
    }, function optionalCallback(err, httpResponse, body) {
        if (err) {
            info.message = err
            res.send(info)
        }
        else {
            console.log(body)
            if(!body.code){
                let userInfo = {
                    'userID': body.userInfo.userId,
                    'nickName': body.userInfo.nickName,
                    'role_type': body.userInfo.roleType
                }
                req.session.user = userInfo;
                req.session.user.sessionID = req.sessionID
                //更新本地项目组中的用户名数据
                //         sql.updateGroupUserName(result.userID, result.nickName, function(result) {
                //             res.send(req.session.user);
                //         });
                info.flag = true
                info.message = "登录成功"
                res.send(info)
            }
            else{
                info.message = body.description;
                res.send(info)
            }
        }
    });
});
/*注销模块*/
router.post('/logout', function (req, res) {
    console.log("接收注销请求");
    var _userID = req.session.destroy();
    res.send(true);
});
/*获取上传文件后的结果*/
router.get('/getUploadFile', function (req, res) {
    if (req.query.flag) {
        console.log(req.query);
        res.render('uploadtest', {
            title: '文件上传结果',
            result: req.query,
            uploadUrl: config.skydiskServer + config.uploadApi,
            uploadCallbackUrl: config.uploadCallbackUrl,
            ejsUrl: ejsUrl,
            staticUrl: staticUrl,
            txUrl: txUrl
        });
    } else {
        res.render('uploadtest', {
            title: '上传文件',
            result: null,
            uploadUrl: config.skydiskServer + config.uploadApi,
            uploadCallbackUrl: config.uploadCallbackUrl,
            ejsUrl: ejsUrl,
            staticUrl: staticUrl,
            txUrl: txUrl
        });
    }
});
/*获取所有用户*/
router.get('/getWholeUser', function (req, res) {
    sql.getWholeUser(function (result) {
        res.send(result);
    });
})
/*获取网盘文件夹内文件*/
router.post('/getYunFile', function (req, res) {
    var diskid = req.body.diskid;
    var userID = req.body.userID;
    var order_name = req.body.order_name;
    var order_type = req.body.order_type;
    var page = req.body.page;
    console.log(diskid);
    skydiskApi.getFileList(diskid, userID, page, order_name, order_type, function (data) {
        res.send(data);
    })
});
//登录模块-tesla 私有 暂不使用
// router.post('/login', function(req, res) {
// 	console.log("接收登录请求");
// 	var _username = req.body.username;
// 	var _password = md5.encry(req.body.password);
// 	var user = {
// 		username: _username,
// 		password: _password
// 	};
// 	sql.logincheck(user, function(result) {
// 		if (result) {
// 			console.log(result);
// 			if (result.password.match(_password)) {
// 				console.log("登录成功");
// 				delete result.password;
// 				console.log(result);
// 				req.session.user = result;
// 				res.send(result);
// 			} else {
// 				console.log("登录失败");
// 				res.send(null);
// 			}
// 		} else {
// 			console.log("登录失败");
// 			res.send(null);
// 		}
// 	});
// });
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

module.exports = router;
