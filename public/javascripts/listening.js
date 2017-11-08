/************************
 * socket.io前端监听部分      *
 * author: Shayne C     *
 * updateTime: 2017.5.9 *
 ************************/
function addSocketListener() {
    //监听用户加入
    socket.on('userIsLogin', function (user, onlineUsers) {
        console.log(user)
        localOnlineUsers = onlineUsers;
        globalNotification(user.userName + '加入了tesla', 'green');
        var _this = $("li[userID=" + user.userID + "]");
        if (_this.length) {
            _this.children('i').removeClass('online').removeClass('offline').addClass('online');
            var temp = _this[0].outerHTML;
            _this.remove();
            $(".right ul").prepend(temp)
        }
        socket.emit("getOnlineUsers");
        console.log("在线用户:");
        console.log(localOnlineUsers);
        if (user.sessionID !== userData.sessionID && user.userID === userData.userID) {
            // alert("登陆错误")
            helpMess({
                width: '300px',
                content: '您的账号在别处登陆，请留意您的密码是否泄漏！',
                okValue: '确 定',
                ok: function () {
                    // socket.emit("logOutError", userData);
                    window.location.href = "/weare"
                }
            })
            logout(userData.userID, function () {
                setTimeout(function () {
                    $(window).unbind('beforeunload');
                    window.location.href = "/weare";
                }, 3000)
            });
        }
    });
//监听用户发送消息
    socket.on('newMessage', function (result) {
        var user = result;
        var messageID = result.messageID;
        var groupID = result.projectTeam.groupID;
        var groupName = result.projectTeam.groupName;
        var userName = result.userName;
        var message = result.message;
        var userID = result.userID;
        var fileCheck = result.fileCheck;
        var _this = $('.showMess[projectID="' + groupID + '"]');
        if (userData.userID === userID) {
            $("#" + messageID + "> .messMyself > .textLoading").remove()
            autoScroll(_this);
        } else {
            if (_this.length) {
                if (fileCheck) {
                    notify(userName, '文件' + result.fileName, result.projectTeam, userID);
                } else {
                    notify(userName, message, result.projectTeam, userID);
                }
                sendMessages(1, user, 0, _this, 0);
                newMessNotification(_this, groupID, function () {
                    enablecodeMirrorMode();
                    autoScroll(_this);
                })
                console.log(result);
            }
        }
    });
    socket.on('sendImage', function (data) {
        var user = data.user;
        var userID = user['userID'];
        var userName = user['userName'];
        var messageID = data.user['messageID'];
        var groupID = user['projectTeam'].groupID;
        var groupName = user['projectTeam'].groupName;
        var tempClass = getRandomID(userID);
        var imgName = data.imgName;
        var textAreaVal = "<img class='messImg " + tempClass + "' src='" + data.imgUrl + "' onerror='imgOnfail(this)'><br><a href='" + data.imgUrl + "' target='_blank' download='" + imgName + "'>下载图片</a>";
        var _this = $('.showMess[projectID="' + groupID + '"]');
        console.log("有用户上传图片");
        if (data.isOK) {
            newMessNotification(_this, groupID, function () {
                if (userID == userData['userID']) {
                    $("." + data.data['userflag']).remove();
                    $("#" + messageID + "> .messMyself > .textLoading").remove();
                } else {
                    if (_this.length) {
                        notify(userName, '发送了一张图片', user['projectTeam'], userID);
                        user.message = textAreaVal;
                        console.log(_this);
                        sendMessages(1, user, 0, _this, 0);
                        autoScroll(_this, tempClass);
                    }
                }
            })
        }
    });
    socket.on('userIsLogout', function (data, onlineUsers) {
        var _this = $("li[userID=" + data.userID + "]");
        if (data.userID === 'unknow') {
            helpMess({
                width: '250px',
                content: '会话已过期，请重新登录',
                okValue: '确 定',
                ok: function () {
                    reloadPage()
                }
            })
        }
        localOnlineUsers = onlineUsers;
        globalNotification(data.userName + '离开了tesla', 'red');
        if ($("li[userID=" + data.userID + "]").length) {
            $("li[userID=" + data.userID + "] i").removeClass('online').removeClass('offline').addClass('offline');
            var temp = _this[0].outerHTML;
            _this.remove();
            $(".right ul").append(temp)
        }
        // var groupID = userData.projectTeam.groupID;
        // var _this = $('.showMess[projectID="' + groupID + '"]');
        // autoScroll(_this);
        console.log("在线用户:");
        console.log(localOnlineUsers);
    })
    socket.on('userBroadcast', function (data) {
        helpMess({
            width: '300px',
            content: '<p>通知：</p><p>' + data.username + '说:</p><p>' + data.broadcastContent + '</p>',
            okValue: '确 定',
            ok: function () {
            }
        })
    })
//    获取在线用户
    socket.on('getOnlineUsers', function (onlineUsers) {
        localOnlineUsers = onlineUsers
        console.log("在线用户:")
        console.log(localOnlineUsers)
    })

// 邀请用户进项目组
    socket.on('startInviteUser', function (user) {
        var currentGroupID = user.groupID;
        var currentGroupName = user.groupName;
        if (currentGroupID === userData.projectTeam.groupID) {
            getProjectUsers(currentGroupID);
        }
        if (user.userID === userData['userID']) {
            var $leftMenu = $('.left ul');
            $(".showArea").append('<div class="showMess" projectID="' + currentGroupID + '" currentpage="0" projectName="' + currentGroupName + '">');
            userTeam.push({'groupID': currentGroupID, 'groupName': currentGroupName});
            $leftMenu.append('<li projectID="' + currentGroupID + '"><span>' + currentGroupName + '</span></li>');
            getGroupMessages(currentGroupID, 0, function () {
                if ($(".leftActive").length < 1) {
                    $('.left ul li:first-child').trigger('click');
                }
                enablecodeMirrorMode()
            });
        }
    })

// 请用户离开项目组
    socket.on('startLeaveUser', function (user) {
        var currentGroupID = user.groupID;
        var currentGroupName = user.groupName;
        if (currentGroupID === userData.projectTeam.groupID) {
            getProjectUsers(currentGroupID);
        }
        if (user.userID === userData['userID']) {
            var $leftMenu = $('.left ul');
            $('.showMess[projectID="' + currentGroupID + '"]').remove();
            $.each(userTeam, function (index, val) {
                if (val.groupID === currentGroupID) {
                    $(".left > ul > li[projectID='" + userTeam[index].groupID + "']").remove();
                    if ($(".leftActive").length < 1) {
                        $('.left ul li:first-child').trigger('click');
                    }
                    userTeam.splice(index, 1);
                    return false;
                }
            });
        }
    })
    //上传结果监听
    socket.on('end_store', function (info) {
        var user = JSON.parse(info.userData)
        if(user.userID !== userData.userID){
            return false
        }
        if (info.flag) {
            var resData = JSON.parse(info.data)
            var downloadurl = resData.downloadurl
            user.message = user.message.replace(/{downloadUrl}/,downloadurl)
            $("[tar=" + user.messageID + "]").attr('href',downloadurl)
            $("div." + user.messageID).remove()
            $("#" + user.messageID).css('opacity', '1')
            socket.emit("sendMessage", user);
        }
        else {
            $("div." + user.messageID).css('color','blue')
            $("div." + user.messageID).html(info.message)

        }
    })

    socket.on('connect', function (data) {
        removeLoader();
    });
    socket.on('disconnect', function (data) {
        addLoader('您已断线')
    });
    socket.on('reconnecting', function (data) {
        changeLoaderString('断线重连中……小tesla要窒息');
    });
    socket.on('reconnect_failed', function (data) {
        changeLoaderString('重连失败，请检查网络');
    });
}