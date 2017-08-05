var sql = require('../sql/sql');
var fs = require('fs-extra');
var path = require('path');
var config = require('../../../config');
var md5 = require('../lib/md5');
//在线用户
var onlineUsers = {};
// var userContentList = new Array();
// var userContentListBuffers = new Array();
// var userContent = {
// 	userContentList,
// 	userContentListBuffers
// };
// var currentWritten = "userContentList";
//当前在线人数
var onlineCount = 0;
var reconnectUser = [];
var socketlisten = function(io) {
    io.on('connection', function(socket) {
        console.log('session测试');
        console.log(socket.handshake.address);
        // 服务器重启让所有人下线
        if (!socket.handshake.session.user) {
            var userTemp = {
                username: '',
                userID: ''
            }
            userTemp.userID = 'unknow';
            userTemp.userName = 'unknow';
            socket.emit('userIsLogout', userTemp, onlineUsers);
        } else {
            socket.userID = socket.handshake.session.user['userID'];
            socket.userName = socket.handshake.session.user['nickName'];
            // 定时器，用户无操作时间
            // socket = connectionTimer(socket, io);
            //检查在线列表，如果不在里面就加入
            if (!onlineUsers.hasOwnProperty(socket.userID)) {
                onlineUsers[socket.userID] = {
                    sessionID: socket.handshake.sessionID,
                    userName: socket.userName
                };
                //在线人数+1
                onlineCount++;
                console.log(onlineUsers);
                // console.log(socket.name)
                console.log("已有session用户");
                console.log(socket.handshake.session.user['nickName'] + "加入了tesla");
                var userTemp = {
                    username: '',
                    userID: '',
                    sessionID:socket.handshake.sessionID
                }
                userTemp.userName = socket.userName;
                userTemp.userID = socket.userID;
                io.sockets.emit('userIsLogin', userTemp, onlineUsers);
            } else {
                console.log(socket.handshake.sessionID)
                console.log(onlineUsers[socket.userID].sessionID)
                if (socket.handshake.sessionID !== onlineUsers[socket.userID].sessionID) {
                    console.log("用户登陆异常");
                    onlineUsers[socket.userID].errorFlag = 1;
                    io.sockets.emit(onlineUsers[socket.userID].sessionID, 'loginError',socket.userID);
                    onlineUsers[socket.userID].sessionID = socket.handshake.sessionID;
                    var userTemp = {
                        username: '',
                        userID: '',
                        sessionID:socket.handshake.sessionID
                    }
                    userTemp.userName = socket.userName;
                    userTemp.userID = socket.userID;
                    io.sockets.emit('userIsLogin', userTemp, onlineUsers);
                } else {
                    // reconnectUser.push({
                    //     ID: socket.userID
                    // })
                    // console.log(reconnectUser)
                }
                console.log(onlineUsers)
            }

        }
        // socket.on('userLogin', function(userData) {
        // 	console.log(userData.userName + "加入了tesla");
        // 	console.log(userData);
        // 	socket.userID = userData.userID;
        // 	socket.userName = userData.userName;
        // 	// 定时器，用户无操作时间
        // 	socket = connectionTimer(socket, io);
        // 	//检查在线列表，如果不在里面就加入
        // 	if (!onlineUsers.hasOwnProperty(userData.userID)) {
        // 		onlineUsers[userData.userID] = userData.userName;
        // 		//在线人数+1
        // 		onlineCount++;
        // 		console.log(onlineUsers);
        // 		// console.log(socket.name)
        // 	}
        // 	io.sockets.emit('userIsLogin', userData, onlineUsers);
        // });
        socket.on('broadcast', function(data) {
            io.sockets.emit('userBroadcast', data);
        });

        socket.on('inviteUser', function(user) {
            // 刷新用户操作时间
            console.log("ok");
            io.sockets.emit('startInviteUser', user);
        });

        socket.on('leaveUser', function(user) {
            // 刷新用户操作时间
            io.sockets.emit('startLeaveUser', user);
        });
        socket.on('sendMessage', function(userData) {
            console.log(userData);
            // 刷新用户操作时间
            // clearTimeout(socket.timer);
            // socket = connectionTimer(socket, io);
            io.sockets.emit('newMessage', userData);
            saveMessages(userData);
            console.log(userData);
        });
        socket.on('sendImage', function(data) {
            // clearTimeout(socket.timer);
            // socket = connectionTimer(socket, io);
            if (data.name) {
                var pos = "." + data.name.replace(/.+\./, "");
                var user = data.user;
                var groupID = user['projectTeam'].groupID;
                var userID = user['userID'];
                var time1 = md5.hex(getCurrentTime(1) + data.name);
                var time2 = getCurrentTime(2);
                var relaPath = '/' + userID + '/' + time2 + '/' + time1 + pos;
                var filePath = path.resolve(__dirname, config.imgDir + '/' + userID + '/' + time2 + '/' + time1 + pos);
                // 解码
                var base64Data = data.segment.replace(/^data:image\/\w+;base64,/, "");
                var dataBuffer = new Buffer(base64Data, 'base64');
                console.log(relaPath);
                // console.log(filePath);
                // 创建文件
                fs.ensureFile(filePath, function(err) {
                    if (err) {
                        console.log(err);
                        io.sockets.emit('sendImage', {
                            isOK: false
                        });
                    }
                    // 写入文件
                    fs.outputFile(filePath, dataBuffer, function(err) {
                        if (err) {
                            console.log(err);
                            io.sockets.emit('sendImage', {
                                isOK: false
                            });
                        } else {
                            var truePath = config.img + relaPath
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

        socket.on('disconnect', function() {
            console.log('用户失去连接');
            if (onlineUsers.hasOwnProperty(socket.userID) && onlineUsers[socket.userID].errorFlag == 1) {
                delete onlineUsers[socket.userID].errorFlag;
                return;
            }
            if (socket.userName) {
                logOut(socket, io);
            }
        });
    });
}

function connectionTimer(socket, io) {
    socket.timer = setTimeout(function() {
        logOut(socket, io);
    }, 18000000);
    return socket;
}

function logOut(socket, io) {
    // 处理异常登陆
    // if (reconnectUser.length) {
    //     for (var i = 0; i < reconnectUser.length; i++) {
    //         if (reconnectUser[i].ID = socket.ID) {
    //             reconnectUser.splice(i, 1);
    //             console.log(reconnectUser)
    //             return false;
    //         }
    //     }
    // }
    console.log(socket.userName + "离开了tesla");
    var userTemp = {
        username: '',
        userID: ''
    }
    userTemp.userName = socket.userName;
    userTemp.userID = socket.userID;
    saveUserUpdateTime(socket.userID);
    if (onlineUsers.hasOwnProperty(socket.userID)) {
        delete onlineUsers[socket.userID];
        //在线人数+1
        onlineCount--;
        console.log(onlineUsers);
        console.log(onlineCount);
    } else {
        console.log('注销用户出错，该用户已是下线状态！');
    }
    if (socket.handshake.session.user) {
        io.sockets.emit('userIsLogout', userTemp, onlineUsers);
    } else {
        userTemp.userID = 'unknow';
        userTemp.userName = 'unknow';
        socket.emit('userIsLogout', userTemp, onlineUsers);
    }
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
    return (n < 10) ?
        '0' + n :
        n;
}

function saveMessages(userdata) {
    var currentTime = getCurrentTime(0)
    userdata['updateTime'] = currentTime;
    sql.saveMessages(userdata, function() {});
}

function saveUserUpdateTime(userID) {
    sql.saveUserUpdateTime(userID, function() {});
}
exports.socketlisten = socketlisten;