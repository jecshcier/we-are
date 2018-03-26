const sql = require('../sql/sql');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../../config');
const md5 = require('../lib/md5');
const postReq = require('../lib/request_fun').postReq
const ejsUrl = config.projectName
const txUrl = ejsUrl + '/' + config.sourceDir.userImg

//在线用户
let onlineUsers = {};

//当前在线人数
let onlineCount = 0;
let reconnectUser = [];
let unreadMessage = {}
let socketlisten = function (io) {
  io.on('connection', function (socket) {
    console.log('onlineCount:' + onlineCount)
    console.log(socket.request.session)
    console.log('session测试');
    // 服务器重启让所有人下线
    if (!socket.request.session.user) {
      let userTemp = {
        username: '',
        userID: ''
      }
      userTemp.userID = 'unknow';
      userTemp.userName = 'unknow';
      socket.emit('userIsLogout', userTemp, onlineUsers);
    } else {
      socket.userID = socket.request.session.user['userID'];
      socket.userName = socket.request.session.user['nickName'];
      // 定时器，用户无操作时间
      // socket = connectionTimer(socket, io);
      //检查在线列表，如果不在里面就加入
      if (!onlineUsers.hasOwnProperty(socket.userID)) {
        onlineUsers[socket.userID] = {
          sessionID: socket.request.sessionID,
          userName: socket.userName,
          count: 0
        };
        //在线人数+1
        onlineCount++;
        console.log(onlineUsers);
        // console.log(socket.name)
        console.log("已有session用户");
        console.log(socket.request.session.user['nickName'] + "加入了tesla");
        let userTemp = {
          username: '',
          userID: '',
          sessionID: socket.request.sessionID
        }
        userTemp.userName = socket.userName;
        userTemp.userID = socket.userID;
        io.sockets.emit('userIsLogin', userTemp, onlineUsers);
      } else {
        delete unreadMessage[socket.userID]
        console.log(socket.request.sessionID)
        console.log(onlineUsers[socket.userID].sessionID)
        //若登录的客户端与当前客户端的sessionID不一致
        if (socket.request.sessionID !== onlineUsers[socket.userID].sessionID) {
          console.log("用户登陆异常");
          onlineUsers[socket.userID].errorFlag = 1;
          onlineUsers[socket.userID].sessionID = socket.request.sessionID;
        }
        let userTemp = {
          username: '',
          userID: '',
          sessionID: socket.request.sessionID
        }
        userTemp.userName = socket.userName;
        userTemp.userID = socket.userID;
        console.log('userTemp:')
        console.log(userTemp)
        onlineUsers[socket.userID].count++;
        io.sockets.emit('userIsLogin', userTemp, onlineUsers);
        console.log(onlineUsers)
      }

    }
    socket.on('getOnlineUsers', function () {
      io.sockets.emit('getOnlineUsers', onlineUsers);
    })
    socket.on('broadcast', function (data) {
      io.sockets.emit('userBroadcast', data);
    });

    socket.on('inviteUser', function (user) {
      // 刷新用户操作时间
      console.log("ok");
      io.sockets.emit('startInviteUser', user);
    });
  
    socket.on('reloadTx', function (user) {
      user.TxUrl = txUrl + '/' + user.userID + '.jpg'
      // 刷新用户操作时间
      console.log("ok");
      io.sockets.emit('reloadTx', user);
    });

    socket.on('leaveUser', function (user) {
      // 刷新用户操作时间
      io.sockets.emit('startLeaveUser', user);
    });
    socket.on('sendMessage', function (userData) {
      console.log(userData);
      // 刷新用户操作时间
      // clearTimeout(socket.timer);
      // socket = connectionTimer(socket, io);
      io.sockets.emit('newMessage', userData);
      saveMessages(userData);
      console.log(userData);
    });
    socket.on('sendImage', function (data) {
      // clearTimeout(socket.timer);
      // socket = connectionTimer(socket, io);
      if (data.name) {
        let pos = "." + data.name.replace(/.+\./, "");
        let user = data.user;
        let groupID = user['projectTeam'].groupID;
        let userID = user['userID'];
        let time1 = md5.hex(getCurrentTime(1) + data.name);
        let time2 = getCurrentTime(2);
        let relaPath = '/' + userID + '/' + time2 + '/' + time1 + pos;
        let filePath = path.resolve(__dirname, config.imgDir + '/' + userID + '/' + time2 + '/' + time1 + pos);
        // 解码
        let base64Data = data.segment.replace(/^data:image\/\w+;base64,/, "");
        let dataBuffer = new Buffer(base64Data, 'base64');
        console.log(relaPath);
        // console.log(filePath);
        // 创建文件
        fs.ensureFile(filePath, function (err) {
          if (err) {
            console.log(err);
            io.sockets.emit('sendImage', {
              isOK: false
            });
          }
          // 写入文件
          fs.outputFile(filePath, dataBuffer, function (err) {
            if (err) {
              console.log(err);
              io.sockets.emit('sendImage', {
                isOK: false
              });
            } else {
              let truePath = config.img + relaPath
              user['message'] = user['message'].replace(/{imgUrl}/, truePath).replace(/"/g, "'");
              user['message'] += '<br><a href="' + truePath + '" target="_blank" download="' + time1 + pos + '">下载图片</a>'
              saveMessages(user);
              io.sockets.emit('sendImage', {
                data: data,
                imgUrl: truePath,
                isOK: true,
                user: user,
                imgName: time1 + pos
              });
            }
          })
        });
      }
    });

    socket.on('disconnect', function () {
      console.log('用户失去连接');
      if (socket.userName) {
        logOut(socket, io);
      }
      unreadMessage[socket.userID] = []
    });
  });
}

function connectionTimer(socket, io) {
  socket.timer = setTimeout(function () {
    logOut(socket, io);
  }, 18000000);
  return socket;
}

function logOut(socket, io) {
  // 处理异常登陆
  // if (reconnectUser.length) {
  //     for (let i = 0; i < reconnectUser.length; i++) {
  //         if (reconnectUser[i].ID = socket.ID) {
  //             reconnectUser.splice(i, 1);
  //             console.log(reconnectUser)
  //             return false;
  //         }
  //     }
  // }
  let userTemp = {
    username: '',
    userID: ''
  }
  userTemp.userName = socket.userName;
  userTemp.userID = socket.userID;
  saveUserUpdateTime(socket.userID);
  if (onlineUsers.hasOwnProperty(socket.userID)) {
    if (onlineUsers[socket.userID].count) {
      onlineUsers[socket.userID].count--;
      if (onlineUsers[socket.userID].errorFlag && !onlineUsers[socket.userID].count) {
        delete onlineUsers[socket.userID].errorFlag;
      }
      userTemp.userName = socket.userName + '的分身'
      io.sockets.emit('getOnlineUsers', onlineUsers);
      return;
    }
    else {
      delete onlineUsers[socket.userID];
      //在线人数-1
      onlineCount--;
      io.sockets.emit('userIsLogout', userTemp, onlineUsers);
      console.log(onlineUsers);
      console.log(onlineCount);
    }
  } else {
    console.log('注销用户出错，该用户已是下线状态！');
  }
}

function getCurrentTime(type) {
  let myDate = new Date();
  let date = myDate.getFullYear() + "-" + sup(parseInt(myDate.getMonth() + 1)) + "-" + sup(myDate.getDate());
  let time = sup(myDate.getHours()) + ":" + sup(myDate.getMinutes()) + ":" + sup(myDate.getSeconds());
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
  return (n < 10) ?
    '0' + n :
    n;
}

function saveMessages(userdata) {
  let currentTime = getCurrentTime(0)
  postReq(config.Api.tesla_api.host + '/weare/api/saveMessages', {
    userData:JSON.stringify(userdata)
  }).then((result) => {
    // res.send(result)
  }).catch((info) => {
    console.log(info)
    // res.send(info)
  })
}

function saveUserUpdateTime(userID) {
  postReq(config.Api.tesla_api.host + '/weare/api/saveUserUpdateTime', {
    userID:userID
  }).then((result) => {
    // res.send(result)
  }).catch((info) => {
    console.log(info)
    // res.send(info)
  })
}

exports.socketlisten = socketlisten;
