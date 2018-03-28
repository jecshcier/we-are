const express = require('express')
const router = express.Router()
const md5 = require('./assets/lib/md5')
const sql = require('./assets/sql/sql')
const path = require('path')
const config = require('../config')
const skydiskApi = require('./assets/skydiskApi/useApi')
const fs = require('fs-extra')
const gm = require('gm')
const moment = require('moment');
const ejsUrl = config.projectName
const staticUrl = config.static
const txUrl = ejsUrl + '/' + config.sourceDir.userImg
const request = require('request')
const sourcePath = path.resolve(__dirname, '../' + config.sourceDir.sourceDir)
const userImg = path.resolve(__dirname, '../' + config.sourceDir.userImg)
const crypto = require('crypto')
const queryString = require('querystring')
const postReq = require('./assets/lib/request_fun').postReq


let system_key = crypto.createHash('sha1').update(config.system_key).digest('hex')

//创建文件缓存目录
fs.ensureDir(sourcePath, (err) => {
  if (err) {
    console.log(err)
    setInterval(() => {
      console.log('缓存目录创建失败，请确认文件创建权限，或在项目根目录手动创建sourceDir文件夹')
    }, 5000)
  }
})
//创建头像缓存目录
fs.ensureDir(userImg, (err) => {
  if (err) {
    console.log(err)
    setInterval(() => {
      console.log('头像目录创建失败，请确认文件创建权限，或在项目根目录手动创建sourceDir文件夹')
    }, 5000)
  }
})


router.use((req, res, next) => {
  console.log(system_key)
  //如果是登录请求，则不验证token或session
  if (req.url.indexOf('/login') !== -1) {
    next()
    return
  }
  //如果是正常请求，则session和token必须填一个，且请求资源的token必须正确
  if (req.session.user || (req.body.token && req.body.token === system_key)) {
    next()
  } else {
    res.render('index', {
      title: 'Hello! We\'re！',
      ejsUrl: ejsUrl,
      staticUrl: staticUrl,
      txUrl: txUrl,
      teslaVersion: config.teslaVersion
    })
  }
})

/*
web页面部分
 */

/*登录页面*/
router.get('/', function (req, res, next) {
  if (req.session.user) {
    res.redirect('/weare/chat')
  } else
    res.render('index', {
      title: 'Hello! We\'re！',
      ejsUrl: ejsUrl,
      staticUrl: staticUrl,
      txUrl: txUrl,
      teslaVersion: config.teslaVersion
    })
})

/*聊天界面*/
router.get('/chat', function (req, res, next) {
  if (req.session.user) {
    console.log(staticUrl)
    res.render('chat', {
      title: 'We\'re chatting~',
      userTx: txUrl + '/' + req.session.user['userID'] + '.jpg',
      userID: req.session.user['userID'],
      userName: req.session.user['nickName'],
      ejsUrl: ejsUrl,
      staticUrl: staticUrl,
      txUrl: txUrl,
      role_type: req.session.user['role_type'],
      teslaVersion: config.teslaVersion
    })
  } else
    res.redirect('/weare')
})

/*
接口部分
 */

/*登录页面*/
router.get('/login/:userId/:token/:systemCode', function (req, res, next) {
  console.log()
  console.log(req.params)
  let userId = req.params.userId
  let token = req.params.token
  let systemcode = req.params.systemCode
  let data = {
    systemCode: systemcode,
    userId: userId,
    token: token
  }
  console.log(queryString.stringify(req.params))
  request.post({
    url: config.Api.ums.url + '/token/validateToken?' + queryString.stringify(data)
  }, function optionalCallback(err, httpResponse, body) {
    if (err) {
      info.message = err
      console.log(err)
      res.send(err)
    } else {
      if (body) {
        try {
          body = JSON.parse(body)
        } catch (e) {
          console.log("服务器响应不正确")
          res.send(body)
          return
        }
        if (body.code === 0 && httpResponse.statusCode === 200) {
          request.post({
            url: config.Api.ums.url + '/user/getUserInfo?' + queryString.stringify(data)
          }, function optionalCallback(err, httpResponse, body) {
            if (err) {
              info.message = err
              console.log(err)
              res.send(err)
            } else {
              if (body && httpResponse.statusCode === 200) {
                try {
                  body = JSON.parse(body)
                } catch (e) {
                  console.log("服务器响应不正确")
                  res.send(body)
                  return
                }
                let userInfo = {
                  'userID': body.userInfo.userId,
                  'loginName': body.userInfo.loginName,
                  'nickName': body.userInfo.nickName,
                  'role_type': body.userInfo.powerId,
                  'identity': body.userInfo.roleType
                }
                req.session.user = userInfo
                req.session.user.sessionID = req.sessionID
                postReq(config.Api.tesla_api.host + '/weare/api/updateUser', {
                  userID: userInfo.userID,
                  loginName: userInfo.loginName,
                  nickName: userInfo.nickName,
                  identity: userInfo.identity,
                  powerID: userInfo.role_type
                }).then((result) => {
                  console.log(result)
                  res.redirect('/weare/chat')
                }).catch((info) => {
                  console.log(info)
                  res.redirect('/weare/chat')
                })
              } else {
                res.send("服务器错误！\n" + body)
              }
            }
          })
        } else {
          res.send(body)
        }
      } else {
        res.send("服务器错误！\n" + body)
      }
    }
  })
})

//初始化用户数据（传出用户id、姓名、group等信息）
router.post('/init', function (req, res, next) {
  console.log(req.session.user)
  var user = {}
  user['userInfo'] = req.session.user
  postReq(config.Api.tesla_api.host + '/weare/api/getUserGroups', {
    userID: user.userInfo.userID
  }).then((result) => {
    user['projectTeam'] = result.data
    result.data = user
    res.send(result)
  }).catch((info) => {
    console.log(info)
    res.send(info)
  })
})
//传出所有项目组list
router.get('/getWholeProjectTeam', function (req, res, next) {
  console.log(config.Api.tesla_api.host + '/weare/api/getWholeProjectTeam')
  postReq(config.Api.tesla_api.host + '/weare/api/getWholeProjectTeam', {}).then((result) => {
    res.send(result)
  }).catch((info) => {
    console.log(info)
    res.send(info)
  })
})

//传出所给用户的所在项目组
router.post('/getUserGroups', function (req, res, next) {
  // sql.getProjectTeamByUser(req.session.user.userID, function (result) {
  //   res.send(result)
  // })
})
//传出项目组内所有用户
router.post('/getProjectUsers', function (req, res, next) {
  postReq(config.Api.tesla_api.host + '/weare/api/getUsersInGroup', {
    groupID: req.body.groupID
  }).then((result) => {
    res.send(result)
  }).catch((info) => {
    console.log(info)
    res.send(info)
  })
})
//将用户移除某个项目组
router.post('/deleteUserInGroup', function (req, res, next) {
  postReq(config.Api.tesla_api.host + '/weare/api/deleteUserInGroup', {
    userID: req.body['user[userID]'],
    groupID: req.body['group[groupID]']
  }).then((result) => {
    res.send(result)
  }).catch((info) => {
    console.log(info)
    res.send(info)
  })
})
//将用户加入某个项目组
router.post('/createGroupWithUser', function (req, res, next) {
  postReq(config.Api.tesla_api.host + '/weare/api/addUserInGroup', {
    data: JSON.stringify({
      userID: req.body['user[userID]'],
      userName: req.body['user[userName]'],
      groupID: req.body['group[groupID]'],
      groupName: req.body['group[groupName]']
    })
  }).then((result) => {
    res.send(result)
  }).catch((info) => {
    console.log(info)
    res.send(info)
  })
})
//创建某个项目组
router.post('/createGroup', function (req, res, next) {
  let user = req.session.user
  var groupID = md5.hex(req.body.groupName + '' + getCurrentTime(0))
  skydiskApi.newDir(user, req.body.groupName, function (data) {
    if (data.ok) {
      postReq(config.Api.tesla_api.host + '/weare/api/createGroup', {
        userID: req.body.userID,
        groupID: groupID,
        groupName: req.body.groupName
      }).then((result) => {
        res.send(result)
      }).catch((info) => {
        console.log(info)
        info.message = "sorry，项目组创建失败，请前往网盘删除文件夹"
        res.send(info)
      })
    } else {
      data.ok = false
      data.comment += '\n*由于网盘文件夹创建失败，项目组创建失败！*'
      res.send(data)
    }
  })
})
/*更改用户头像*/
router.post('/saveUserTx', function (req, res, next) {
  var userID = req.body.userID
  var url = req.body.url
  console.log(userID)
  console.log(url)
  url = url.replace(staticUrl, '')
  fs.copy('dist/' + url, config.TxDir + userID + '.jpg').then(() => {
    console.log("复制头像成功")
    res.send(true)
  }).catch((err) => {
    console.log(err)
    res.send(null)
  })
})

//获取某项目组聊天记录
router.post('/getGroupMessages', function (req, res, next) {
  postReq(config.Api.tesla_api.host + '/weare/api/getGroupMessages', {
    groupID: req.body.groupID,
    page: req.body.page,
    messNum: req.body.messNum
  }).then((result) => {
    res.send(result)
  }).catch((info) => {
    console.log(info)
    info.message = "获取消息超时！"
    res.send(info)
  })
})
//用户管理系统登录模块
router.post('/login', function (req, res) {
  console.log("接收登录请求")
  let info = {
    flag: false,
    message: '',
    data: null
  }
  let _username = req.body.username
  let _password = req.body.password
  let userdata = {
    mobile: "",
    passWord: _password,
    loginName: _username,
    systemCode: "tesla",
    verifyCode: ""
  }
  request.post({
    url: config.Api.ums.url + '/user/login',
    body: userdata,
    json: true
  }, function optionalCallback(err, httpResponse, body) {
    if (err) {
      info.message = err
      res.send(info)
    } else {
      console.log(body)
      if (body) {
        if (!body.code) {
          let userInfo = {
            'userID': body.userInfo.userId,
            'loginName': body.userInfo.loginName,
            'nickName': body.userInfo.nickName,
            'role_type': body.userInfo.powerId,
            'identity': body.userInfo.roleType
          }
          req.session.user = userInfo
          req.session.user.sessionID = req.sessionID
          postReq(config.Api.tesla_api.host + '/weare/api/updateUser', {
            userID: userInfo.userID,
            loginName: userInfo.loginName,
            nickName: userInfo.nickName,
            identity: userInfo.identity,
            powerID: userInfo.role_type
          }).then((result) => {
            console.log(result)
            result.message = "登录成功"
            res.send(result)
          }).catch((info) => {
            console.log(info)
            res.send(info)
          })
        } else {
          info.message = "来自用户管理系统的消息：\n --->" + body.description
          res.send(info)
        }
      } else {
        info.message = "用户管理系统出错！"
        res.send(info)
      }
    }
  })
})
/*注销模块*/
router.post('/logout', function (req, res) {
  console.log("接收注销请求")
  req.session.destroy()
  res.send(true)
})
/*上传文件*/
router.post('/uploadFile', function (req, res) {
  if (!req.session.user) {
    res.redirect('/weare')
    return false
  }
  console.log('ok')
  skydiskApi.uploadFiles(res, req, sourcePath).then((data) => {
    console.log(data)
  }, (err) => {
    console.log(err)
  })
})
/*获取所有用户*/
router.get('/getWholeUser', function (req, res) {
  postReq(config.Api.tesla_api.host + '/weare/api/getWholeUser', {}).then((result) => {
    res.send(result)
  }).catch((info) => {
    console.log(info)
    res.send(info)
  })
  // sql.getWholeUser(function (result) {
  //   res.send(result)
  // })
})
/*获取网盘文件夹内文件*/
router.post('/getYunFile', function (req, res) {
  if (!req.session.user) {
    res.redirect('/weare')
    return false
  }
  let user = req.session.user
  let diskUrl = req.body.diskUrl
  let page = req.body.page
  let order_name = req.body.order_name
  let order_type = req.body.order_type
  console.log(diskUrl)
  skydiskApi.getFileList(user, diskUrl, page, order_name, order_type, function (data) {
    res.send(data)
  })
})
/*获取用户日报*/
router.post('/getUserDaily', function (req, res) {
  if (!req.session.user) {
    res.redirect('/weare')
    return false
  }
  let type = req.body.type
  console.log(type)
  let info = new config.callbackModel()
  // sql.getUserDaily(type).then(() => {
  // })
  sql.getUserDaily(type).then((data) => {
    info.flag = true
    info.message = data.message
    info.data = data.data
    info.latestTime = data.latestTime
    res.send(info)
  }, (info) => {
    res.send(info)
  })
})
/*
上传头像功能
 */
router.post('/uploadTx', function (req, res) {
  let info = new config.callbackModel()
  let userID = req.body.userID
  let base64data = req.body.data
  let content = new Buffer(base64data, 'base64')
  let txPath = path.normalize(userImg + '/' + userID + '.jpg')
  let txTempPath = path.normalize(sourcePath + '/imageTemp/' + userID + moment().format('x') +  '.jpg')
  fs.outputFile(txTempPath, content).then(() => {
    gm(txTempPath)
      .resize(null, 240, '!')
      .write(txPath, function (err) {
        if (!err) {
          console.log('done')
          info.flag = true
          info.message = "头像储存并生成缩略图成功"
          res.send(info)
        }
        else {
          console.log(err)
          info.message = "头像储存似乎出现了问题2。。"
          res.send(info)
        }
      })
  }).catch((e) => {
    console.log(e)
    info.message = "头像储存似乎出现了问题。。"
    res.send(info)
  })
})


function getCurrentTime(type) {
  var myDate = new Date()
  var date = myDate.getFullYear() + "-" + sup(parseInt(myDate.getMonth() + 1)) + "-" + sup(myDate.getDate())
  var time = sup(myDate.getHours()) + ":" + sup(myDate.getMinutes()) + ":" + sup(myDate.getSeconds())
  switch (type) {
    case 0:
      return date + " " + time
      break
    case 1:
      return time
      break
    case 2:
      return date
      break
  }
}

function sup(n) {
  return (n < 10) ? '0' + n : n
}

module.exports = router