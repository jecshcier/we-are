const express = require('express')
const router = express.Router()
const md5 = require('./assets/lib/md5')
const sql = require('./assets/sql/sql')
const path = require('path')
const config = require('../config')
const skydiskApi = require('./assets/skydiskApi/useApi')
const fs = require('fs-extra')
const ejsUrl = config.projectName
const staticUrl = config.static
const txUrl = ejsUrl + '/' + config.sourceDir.userImg
const request = require('request')
const sourcePath = path.resolve(__dirname, '../' + config.sourceDir.sourceDir)
const userImg = path.resolve(__dirname, '../' + config.sourceDir.userImg)
const crypto = require('crypto')
const queryString = require('querystring')


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
router.get('/', function(req, res, next) {
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
router.get('/chat', function(req, res, next) {
  if (req.session.user) {
    console.log(staticUrl)
    res.render('chat', {
      title: 'We\'re chatting~',
      userTx: txUrl + '/' + req.session.user['userID'] + '.jpg',
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
router.get('/login/:userId/:token/:systemCode', function(req, res, next) {
  console.log()
  console.log(req.params)
  let userId = req.params.userId
  let token = req.params.token
  let systemcode = req.params.systemCode
  let data = {
    systemCode:systemcode,
    userId:userId,
    token:token
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
        }catch(e){
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
                }catch(e){
                  console.log("服务器响应不正确")
                  res.send(body)
                  return
                }
                let userInfo = {
                  'userID': body.userInfo.userId,
                  'nickName': body.userInfo.nickName,
                  'role_type': body.userInfo.powerId
                }
                req.session.user = userInfo
                req.session.user.sessionID = req.sessionID
                res.redirect('/weare/chat')
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
router.get('/init', function(req, res, next) {
  if (req.session.user) {
    console.log(req.session.user)
    var user = {}
    user['userInfo'] = req.session.user
    sql.getProjectTeamByUser(user.userInfo.userID, function(result) {
      user['projectTeam'] = result
      res.send(user)
    })
  } else
    res.redirect('/weare')
})
//传出所有项目组list
router.get('/getWholeProjectTeam', function(req, res, next) {
  console.log(config.Api.tesla_api.host + '/weare/api/getWholeProjectTeam')
  postReq(config.Api.tesla_api.host + '/weare/api/getWholeProjectTeam', {}).then((result) => {
    res.send(result)
  }).catch((info) => {
    console.log(info)
    res.send(info)
  })
})

//传出所给用户的所在项目组
router.get('/getUserGroups', function(req, res, next) {
  if (req.session.user) {
    sql.getProjectTeamByUser(req.session.user.userID, function(result) {
      res.send(result)
    })
  } else
    res.redirect('/weare')
})
//传出项目组内所有用户
router.post('/getProjectUsers', function(req, res, next) {
  if (req.session.user) {
    sql.getProjectUsers(req.body.groupID, function(result) {
      console.log(result)
      res.send(result)
    })
  } else
    res.redirect('/weare')
})
//将用户移除某个项目组
router.post('/deleteUserInGroup', function(req, res, next) {
  var group = new Object()
  var user = new Object()
  group['groupID'] = req.body['group[groupID]']
  group['groupName'] = req.body['group[groupName]']
  user['userID'] = req.body['user[userID]']
  user['userName'] = req.body['user[userName]']
  if (req.session.user) {
    sql.deleteProjectTeamWithUser(user.userID, group.groupID, function(result) {
      res.send(result)
    })
  } else
    res.redirect('/weare')
})
//将用户加入某个项目组
router.post('/createGroupWithUser', function(req, res, next) {
  var group = new Object()
  var user = new Object()
  group['groupID'] = req.body['group[groupID]']
  group['groupName'] = req.body['group[groupName]']
  user['userID'] = req.body['user[userID]']
  user['userName'] = req.body['user[userName]']
  if (req.session.user) {
    sql.createProjectTeamWithUser(user, group, function(result) {
      res.send(result)
    })
  } else
    res.redirect('/weare')
})
//创建某个项目组
router.post('/createGroup', function(req, res, next) {
  if (req.session.user) {
    let user = req.session.user
    var groupID = md5.hex(req.body.groupName + '' + getCurrentTime(0))
    skydiskApi.newDir(user, req.body.groupName, function(data) {
      if (data.ok) {
        sql.createProject(groupID, req.body.groupName, req.body.userID, function(result) {
          if (result) {
            result.ok = true
            result.comment = '创建成功'
            res.send(result)
          } else {
            result.ok = false
            result.comment = 'sorry，项目组创建失败，请前往网盘删除文件夹'
            res.send(result)
          }
        })
      } else {
        data.ok = false
        data.comment += '\n*由于网盘文件夹创建失败，项目组创建失败！*'
        res.send(data)
      }
    })
  } else
    res.redirect('/weare')
})
/*更改用户头像*/
router.post('/saveUserTx', function(req, res, next) {
  if (req.session.user) {
    var userID = req.body.userID
    var url = req.body.url
    console.log(userID)
    console.log(url)
    url = url.replace(staticUrl, '')
    fs.copy('public/' + url, config.TxDir + userID + '.jpg', {
      replace: false
    }, function(err) {
      if (err) {
        // i.e. file already exists or can't write to directory
        throw err
        res.send(null)
      }
      console.log("复制头像成功")
      res.send(true)
    })
  } else
    res.redirect('/weare')
})

//获取某项目组聊天记录(50条)
router.post('/getGroupMessages', function(req, res, next) {
  if (req.session.user) {
    sql.getGroupMessages(req.body.groupID, req.body.page, function(result) {
      res.send(result)
    })
  } else
    res.redirect('/weare')
})
//用户管理系统登录模块
router.post('/login', function(req, res) {
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
            'nickName': body.userInfo.nickName,
            'role_type': body.userInfo.powerId
          }
          req.session.user = userInfo
          req.session.user.sessionID = req.sessionID
            //更新本地项目组中的用户名数据
            //         sql.updateGroupUserName(result.userID, result.nickName, function(result) {
            //             res.send(req.session.user)
            //         })
          info.flag = true
          info.message = "登录成功"
          res.send(info)
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
router.post('/logout', function(req, res) {
  console.log("接收注销请求")
  req.session.destroy()
  res.send(true)
})
/*上传文件*/
router.post('/uploadFile', function(req, res) {
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
router.get('/getWholeUser', function(req, res) {
    sql.getWholeUser(function(result) {
      res.send(result)
    })
  })
  /*获取网盘文件夹内文件*/
router.post('/getYunFile', function(req, res) {
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
  skydiskApi.getFileList(user, diskUrl, page, order_name, order_type, function(data) {
    res.send(data)
  })
})
/*获取用户日报*/
router.post('/getUserDaily', function(req, res) {
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


function postReq(url, data) {
  let info = {
    flag: false,
    message: '',
    data: null
  }
  data.token = system_key
  return new Promise((resolve, reject) => {
    request.post({
      url: url,
      body: data,
      json: true
    }, function optionalCallback(err, httpResponse, body) {
      if (err) {
        info.message = err
        console.log("错误")
        reject(info)
      } else {
        if (body) {
          if(typeof body !== 'object'){
            info.message = '404'
            reject(info)
            return
          }
          if (body.flag) {
            info.flag = true
            info.message = body.message
            info.data = body.data
            resolve(info)
          } else {
            info.message = body.message
            info.data = body.data
            reject(info)
          }
        } else {
          info.message = '500'
          reject(info)
        }
      }
    })
  })
}

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