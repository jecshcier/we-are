/***********************
 * tesla前端函数库          *
 * author: Shayne C    *
 * updateTime:2017.4.1 *
 ***********************/
//开启socket监听
var socket = io();
//本地用户数据
var userData = {};
var userTeam = {};
var localOnlineUsers = new Object();
var imgArr = ['jpg', 'jpeg', 'png', 'bmp', 'gif'];
var previewImgArr = ['jpg', 'jpeg', 'png']
var codeType = ['javascript', 'java', 'html', 'css'];
var codeMirrorMode = {
  "javascript": "javascript",
  "css": "text/css",
  "html": "text/html",
  "java": "text/x-java"
}
addLoader('界面加载中……');

// 初始化用户数据
function initUserData(result) {
  changeLoaderString('正在加载用户数据……');
  initUserDataApi(function (result) {
    // 获取用户id和用户名称以及当前所在的群组
    userData['userID'] = result.userInfo.userID;
    userData['userName'] = result.userInfo.nickName;
    userData['role_type'] = result.userInfo.role_type;
    userData['sessionID'] = result.userInfo.sessionID;
    // 此处为用户登录后默认进入第一个群组
    if (result.projectTeam) {
      userData['projectTeam'] = result.projectTeam[0];
    }
    var proNum = result.projectTeam.length;
    // 将用户的所有群组保存在本地
    userTeam = result.projectTeam;
    //加载socket监听器
    addSocketListener();
    //获取在线用户
    socket.emit("getOnlineUsers");
    //登陆后，获取用户名成功后，在html页面动态显示用户信息、头像
    //遍历用户群组，初始化界面（群组切换标签、聊天窗口）
    var checkNum = userTeam.length;
    var $showArea = $('.showArea');
    var $showClass = $(".showClass");
    var $leftMenu = $('.left ul');
    changeLoaderString('正在读取项目记录……');
    if (!userTeam.length) {
      removeLoader();
    }
    $(userTeam).each(function (index, el) {
      $leftMenu.append('<li projectID="' + el.groupID + '"><span>' + el.groupName + '</span></li>');
      $showArea.append('<div class="showMess" projectID="' + el.groupID + '" projectName="' + el.groupName + '">');
      getGroupMessages(el.groupID, 0, function () {
        checkNum--;
        if (!checkNum) {
          var userGourp = getCacheGroupID(userData.userID);
          var cacheDom = $("li[projectID=" + userGourp + "]");
          if (userGourp && cacheDom.length) {
            cacheDom[0].click()
          } else {
            $('.left ul>li:first')[0].click();
          }
          enablecodeMirrorMode();
          $showArea.scrollTop($showClass.height());
          removeLoader();
        }
      });
    });
  })
}

// 初始化项目组内的聊天记录
function getGroupMessages(groupID, page, callback) {
  getGroupMessagesApi(groupID, page, function (data) {
    if (data.length) {
      var _this = $('.showMess[projectID="' + groupID + '"]');
      _this.attr('currentPage', '0');
      $.each(data, function (index, val) {
        // 根据用户id判断聊天记录类型（己方发言或对方发言）
        if (val.userID === userData.userID) {
          sendMessages(0, val, val.updateTime, _this, 1);
        } else {
          sendMessages(1, val, val.updateTime, _this, 1);
        }
      });
    }
    if (callback) {
      callback(data.length);
    }
  })
}

// 成员配置-显示项目组成员情况
function showProUser(groupID) {
  getProjectUsersApi(groupID, function (result) {
    $(".groupuser > a > input").each(function (index, el) {
      $(this)[0].checked = false;
    });
    $.each(result, function (index, val) {
      if ($(".groupuser > a[userID=" + val.userID + "] > input").length) {
        $(".groupuser > a[userID=" + val.userID + "] > input")[0].checked = true;
      }
    });
  })
}

// 获取某用户所在的项目组
function getUserGroups() {
  getUserGroupsApi(function (result) {
  })
}

// 刷新设置项目组列表
function reflashPro() {
  console.log("管理员");
  getProjectTeamApi(function (result) {
    var proArr = [];
    var proArrID = [];
    $('.programmeUl ul').empty();
    $(".groupuser > a > input:checked").attr('checked', false);
    $(result).each(function (index, el) {
      proArr[index] = el.groupName;
      $('.programmeUl ul').append('<li projectID="' + el.groupID + '">' + el.groupName + '</li>');
      $(".editUser > div > select").append('<option value="' + el.groupID + '">' + el.groupName + '</option>');
    });
    $(userTeam).each(function (index, el) {
      var num = $.inArray(el.groupName, proArr);
      $('.programmeUl ul li:eq(' + num + ')').addClass('choose');
    });
  })
}

// 添加项目组
function addProject(newPro) {
  createGroupApi(newPro, function (data) {
    if (data.flag) {
      alert(data.message);
      reflashPro();
    } else {
      alert(data.message);
    }
  })
}

// 获取项目组内成员
function getProjectUsers(groupID) {
  getProjectUsersApi(groupID, function (result) {
    console.log(result);
    $(".right ul").empty();
    var userList = new String();
    $(result).each(function (index, el) {
      if (localOnlineUsers.hasOwnProperty(el.userID)) {
        userList += '<li userID="' + el.userID + '"><img class="userTx" userid=' + el.userID + ' onerror="imgOnfail(this);" src="' + txUrl + '/' + el.userID + '.jpg" width="40" height="40"><span>' + el.userName + '</span><i class="fa fa-circle-o online"></i></li>';
      } else {
        $(".right ul").append('<li userID="' + el.userID + '"><img class="userTx" userid=' + el.userID + ' onerror="imgOnfail(this);" src="' + txUrl + '/' + el.userID + '.jpg" width="40" height="40"><span>' + el.userName + '</span><i class="fa fa-circle-o offline"></i></li>');
      }
    });
    $(".right ul").prepend(userList);
  })
}

// 进入某项目组
function enterGroup(this_dom, group, user) {
  this_dom.addClass('preventClick')
  addUserToGroupApi(group, user, function () {
    this_dom.removeClass('preventClick')
    this_dom.addClass('choose');
    $(".showArea").append('<div class="showMess" projectID="' + group.groupID + '" currentpage="0" projectName="' + group.groupName + '">');
    userTeam.push({
      'groupID': group.groupID,
      'groupName': group.groupName
    });
    $('.left ul').append('<li projectID="' + group.groupID + '"><span>' + group.groupName + '</span></li>');
    getGroupMessages(this_dom.attr('projectID'), 0, function () {
      if ($(".leftActive").length < 1) {
        $('.left ul li:first-child').trigger('click');
      }
      enablecodeMirrorMode()
    });
  })
}

// 退出某项目组
function leaveGroup(this_dom, group, user) {
  this_dom.addClass('preventClick')
  deleteUserInGroupApi(group, user, function () {
    this_dom.removeClass('preventClick')
    this_dom.removeClass('choose');
    $('.showMess[projectID="' + group.groupID + '"]').remove();
    $.each(userTeam, function (index, val) {
      if (val.groupID === group.groupID) {
        $(".left > ul > li[projectID='" + userTeam[index].groupID + "']").remove();
        if ($(".leftActive").length < 1) {
          $('.left ul li:first-child').trigger('click');
        }
        userTeam.splice(index, 1);
        return false;
      }
    });
  })
}

// 获取所有用户成员
function getWholeUser(callback) {
  getWholeUserApi(function (result) {
    $(".groupuser").empty();
    $.each(result, function (index, val) {
      if (!val.nick_name) {
        val.nick_name = val.login_name;
      }
      $(".groupuser").append('<a userID=' + val.user_id + ' title=' + val.login_name + '>' + '<input type="checkbox" id="userID' + val.user_id + '">' + '<label for="userID' + val.user_id + '"><span></span></label>' + '<span>' + val.nick_name + '</span>' + '</div>' + '</a>');
    });
    if (callback) {
      callback();
    }
  })
}

// 获取网盘文件
function getYunFile(diskUrl, page, order_name, order_type, flag) {
  var $fileListView = $(".fileListView");
  var pID = $(".showClass").attr('projectid');
  if (!flag) {
    if ($fileListView.attr('currentPage') && pID === $fileListView.attr('currentPro')) {
      return false;
    }
  }
  getYunFileApi(diskUrl, page, order_name, order_type, function (result) {
    if (!flag) {
      $(".filePage > span").remove();
      for (var i = 0; i < result.totalPage; i++) {
        var pageNum = i + 1;
        $(".filePage").append('<span class="pageNum" pageNum="' + pageNum + '"></span>');
        $(".pageNum:first-of-type").addClass('pageHit');
      }
      $fileListView.attr('currentPro', pID);
    }
    $(".fileTableDiv > table > tbody").empty();
    $.each(result.data, function (index, el) {
      var fileSize = getFileSize(el.size);
      $(".fileTableDiv > table > tbody").append('<tr><td class="tabFileName" style="text-indent:2em;">' + el.name + '</td><td class="tabFileExtName" style="text-align:center">' + el.fileExtName + '</td><td class="tabFileSize" style="text-align:center">' + fileSize + '</td><td class="tabFileUploadUserName" style="text-align:center">' + el.uploadUserName + '</td><td class="tabFileUploadTime" style="text-align:center">' + el.uploadTime + '</td><td style="text-align:center"><a class="sendFileMessage" style="color:rgb(51, 139, 173);cursor:pointer;">发送</a></td><td class="TabFileUrl" style="text-align:center"><a href="' + el.downloadurl + '" target="_blank" style="color:rgb(51, 139, 173);cursor:pointer;">下载</a></td></tr>')
    });
    $fileListView.attr('currentPage', page);
  })
}

/*发送消息函数封装*/
// type-发送类型，0为自己，1为别人
// addFlag - 加载状态，判断是从1后台获取聊天记录or0当前正在发送的消息。
// 若是正在发送的消息，则会append加载，若是获取的消息，则prepend加载（时间倒序）
function sendMessages(type, user, updateTime, dom, addFlag) {
  var userImgUrl = txUrl + '/' + user.userID + '.jpg';
  var upTime = getCurrentTime();
  if (updateTime) {
    upTime = user.updateTime;
  }
  if (type) {
    var othMess = '<div class="messageBlock" messID="{messID}"><div class="faceImgBlock">' +
      '<img userid=' + user.userID + ' class="userTx" src="' + userImgUrl + '" onerror="imgOnfail(this);"><span class="messName">' + user.userName + '</span></div>' + '<div class="mess">' + '<div class="messArrow messArrowOth"></div>' + '<div class="nameTime"><span class="messTime">' + upTime + '</span></div>' + '<pre class="messContent">' + user.message + '</pre>' + '</div>' + '</div>';
    if (addFlag) {
      dom.prepend(othMess);
    } else {
      dom.append(othMess);
    }
  } else {
    var myMess = '<div class="messageBlock myMess" id="{messageID}">' +
      '<div class="mess messMyself">{loading}' +
      '<div class="messArrow messArrowMyself"></div>' +
      '<div class="nameTime"><span class="messTime">' + upTime + '</span></div>' + '<pre class="messContent">' + user.message + '</pre>' + '</div>' + '<div class="faceImgBlockMyself"><img class="userTx" userid=' + user.userID + ' src="' + userImgUrl + '" onerror="imgOnfail(this);"></div>' + '</div>';
    if (addFlag) {
      myMess = myMess.replace(/{loading}/g, '').replace(/{messageID}/g, '');
      dom.prepend(myMess);
    } else {
      myMess = myMess.replace(/{loading}/g, '<div class="textLoading"><i class="fa fa-spinner fa-pulse fa-fw"></i></div>').replace(/{messageID}/g, user['messageID']);
      dom.append(myMess);
    }
  }
  
}

// 群组气泡
function newMessNotification(_this, groupID, callback) {
  var MessPubble = $('.left ul li[projectID="' + groupID + '"]');
  // 若收到的消息不在当前聊天页，则接收气泡
  if (!_this.hasClass('showClass')) {
    $(".bActive").removeClass('bActive');
    if (MessPubble.children('b').length) {
      var messNum = parseInt(MessPubble.children('b').html());
      messNum++;
      MessPubble.children('b').addClass('bActive');
      MessPubble.children('b').html(messNum);
    } else {
      MessPubble.append('<b class="bActive">1</b>')
    }
    if (callback) {
      callback();
    }
  } else {
    // 若收到的消息在当前聊天页，则没有气泡，并执行callback
    if (callback) {
      callback();
    }
  }
}

// 判定滚动条是否应该滚到底部
function autoScroll(_this, imgID) {
  if (!_this.hasClass('showClass')) {
    return;
  }
  var scrollCheck = true;
  var scrollCheckNum = _this.height() - $('.showArea').height() - $('.showArea').scrollTop();
  if (!(scrollCheckNum <= 200)) {
    scrollCheck = false;
  }
  if (scrollCheck) {
    // 若有图片，需等图片加载完成后再进行滚动
    if (imgID) {
      console.log('有图片');
      $("." + imgID)[0].onload = function () {
        $(this).removeClass(imgID);
        $('.showArea').scrollTop(_this.height());
      }
    } else {
      $('.showArea').scrollTop(_this.height());
    }
  }
}

// 全局通知（聊天窗口）
function globalNotification(message, color) {
  $('.showClass').append('<div class="notifyView" style="color:' + color + ';">' + message + '</div>');
}

// 更改头像
function changeTx(url) {
  $.ajax({
    url: 'saveUserTx',
    type: 'POST',
    dataType: 'json',
    data: {
      userID: userData.userID,
      url: url
    }
  }).done(function () {
    socket.emit("reloadTx", userData);
    alert("头像修改成功");
  }).fail(function () {
    alert("头像更改错误！");
  }).always(function () {
    console.log("complete");
  });
}

// -webkit-桌面通知
function notify(userName, message, group, userID) {
  if (window.Notification) {
    var popNotice = function () {
      var effectAudio = document.createElement("audio");
      effectAudio.src = staticUrl + '/media/notify.wav';
      effectAudio.setAttribute("autoplay", "autoplay");
      if (Notification.permission == "granted") {
        var notification = new Notification('来自 ' + group.groupName + ' 的消息', {
          tag: group.groupName,
          data: null,
          renotify: true,
          body: userName + '说：' + message,
          icon: txUrl + '/' + userID + '.jpg',
          silent: true
        });
        notification.onclick = function () {
          window.focus();
          $(".left > ul > li[projectID=" + group.groupID + "]").trigger('click');
          notification.close();
        };
        notification.onshow = function () {
          setTimeout(function () {
            notification.close();
          }, 3000);
        };
      }
    };
    if (Notification.permission == "granted") {
      popNotice();
    } else if (Notification.permission != "denied") {
      Notification.requestPermission(function (permission) {
        popNotice();
      });
    }
  } else {
    console.log('浏览器不支持Notification');
  }
}

// 图片加载失败函数
function imgOnfail(_this) {
  if ($(_this).hasClass('userTx')) {
    $(_this).attr('src', staticUrl + '/images/tx/0000.jpg');
  } else if ($(_this).hasClass('messImg')) {
    $(_this).parent().html('该用户上传了图片，但图片加载失败');
  }
}

// 文件上传
function uploading() {
  globalNotification("文件上传中……请耐心等候", "#ccc");
  autoScroll($(".showClass"));
}

//建立一個可存取到該file的url
function getObjectURL(file) {
  var url = null;
  if (window.createObjectURL != undefined) { // basic
    url = window.createObjectURL(file);
  } else if (window.URL != undefined) { // mozilla(firefox)
    url = window.URL.createObjectURL(file);
  } else if (window.webkitURL != undefined) { // webkit or chrome
    url = window.webkitURL.createObjectURL(file);
  }
  return url;
}

// 随机生成id
function getRandomID(userID) {
  var myDate = new Date();
  var newId = '' + userID + parseInt(Math.random() * 90000 + 10000) + '' + myDate.getTime();
  return newId;
}

// 获取当前时间
function getCurrentTime() {
  var date = new Date();
  return sup(date.getHours()) + ":" + sup(date.getMinutes()) + ":" + sup(date.getSeconds());
}

function sup(n) {
  return (n < 10) ?
    '0' + n :
    n;
}

function reloadPage() {
  $(window).unbind('beforeunload');
  window.location.href = "/weare";
}

function helpMess(option, dom) {
  var d = dialog(option);
  if (!dom) {
    d.showModal();
  } else {
    d.showModal(dom);
  }
}

// 代码高亮替换
function replaceCode(type, string) {
  var str = string.split("#" + type + "##")
  if (str.length > 1) {
    var arr = str.map(function (value, index) {
      var reg = new RegExp("##" + type + "#([\\s\\S]*)+\\s*$")
      var val = value.match(reg)
      if (val) {
        string = string.replace(val[0] + "#" + type + "##", type + "Code" + index)
        val[1] = val[1].replace(/^\s*|\s*$/g, '')
        return val[1]
      }
    });
    arr.splice(arr.length - 1)
    return [string, arr]
  } else {
    return [string, null]
  }
}

// textarea代码处理
function initCode(string) {
  var codeString = {};
  codeType.forEach(function (el, index) {
    var str = replaceCode(el, string)
    string = str[0]
    if (str[1]) {
      codeString[el] = str[1]
    }
  })
  string = string.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  $.each(codeString, function (type, el) {
    el.forEach(function (val, index) {
      string = string.replace(type + 'Code' + index, '<textarea class="' + type + 'Code">' + val + "</textarea>")
    })
  });
  return string
}

// 代码高亮显示
function enablecodeMirrorMode() {
  $.each(codeMirrorMode, function (type, val) {
    $("." + type + "Code").each(function (index, el) {
      CodeMirror.fromTextArea($(this)[0], {
        mode: val,
        // matchBrackets: true,
        lineWrapping: true,
        theme: 'monokai'
      });
      $(this).removeClass(type + "Code")
    });
  })
}

// 文件大小计算
function getFileSize(size) {
  var filesize = size;
  filesize = filesize / 1024;
  if (filesize > 1024) {
    filesize = filesize / 1024;
    if (filesize > 1024) {
      filesize = filesize / 1024;
      filesize = filesize.toFixed(2) + 'GB';
    } else {
      filesize = filesize.toFixed(2) + 'MB';
    }
  } else {
    filesize = filesize.toFixed(2) + 'KB';
  }
  return filesize;
}

// 比较tesla版本
function checkTeslaVersion() {
  var currentVersion = localStorage.getItem('teslaVersion');
  if (currentVersion !== teslaVersion) {
    helpMess({
      title: 'tesla又更新啦！',
      content: '<p>可以在统计-更新日志中查看</p>',
      okValue: '确定',
      ok: function () {
      }
    })
    localStorage.setItem('teslaVersion', teslaVersion)
  }
}

function saveCurrentGroup(userID, groupID) {
  $.cookie(userID + '-groupID', groupID);
}

function getCacheGroupID(userID) {
  return $.cookie(userID + '-groupID')
}

function addLoader(string) {
  $(".container").css('opacity', '.5');
  var str = '<div class="loaderB"><div class="loader-inner"><div class="loader-line-wrap"><div class="loader-line"></div></div><div class="loader-line-wrap"><div class="loader-line"></div></div><div class="loader-line-wrap"><div class="loader-line"></div></div><div class="loader-line-wrap"><div class="loader-line"></div></div><div class="loader-line-wrap"><div class="loader-line"></div></div><span>' + string + '</span></div></div>'
  $("body").prepend(str)
}

function changeLoaderString(string) {
  $(".loaderB > .loader-inner > span").html(string);
}

function removeLoader() {
  $(".loaderB").remove();
  $(".container").css('opacity', '1');
}


// 打开图片前预加载图片，获取图片尺寸
function preloadImageForPhotoSwipe($this, imgPath) {
  console.log("preloadImg:" + imgPath);
  // 加载状态
  $this.before('<i class="img-loading fa fa-spinner fa-spin"></i>');
  
  var img = new Image();
  
  img.addEventListener("load", function () {
    // 显示图片
    showPhotoSwipeImg(imgPath, this.width, this.height);
    
    $this.siblings(".img-loading").remove();
  }, false);
  // 图片加载失败
  img.addEventListener("error", function () {
    alert("图片加载失败！");
    $this.siblings(".img-loading").remove();
  }, false);
  
  img.src = imgPath;
}

/**
 * 打开视频播放器
 * @param  {String} videoSrc 视频路径
 */
function showVideoReader(videoSrc) {
  var $modal = $("#videoModal");
  var videoPlayer = document.getElementById("videoPlayer");
  videoPlayer.src = videoSrc;
  
  // var videoPlayer = videojs('videoPlayer');
  
  // videoPlayer.ready(function() {
  //     videoPlayer.src(videoSrc);
  //     videoPlayer.play();
  // });
  
  // 显示播放器
  $modal.fadeIn(function () {
    $modal.css("display", "flex");
  });
  
  // 绑定关闭事件
  $modal.find(".modal-close").off("click").on("click", function () {
    videoPlayer.pause();
    $modal.fadeOut();
  });
}

/**
 * 打开PDF阅读器
 * @param  {String} pdfSrc PDF路径
 */
function showPdfReader(pdfSrc) {
  var $modal = $("#pdfReaderModal");
  var $reader = $("#pdfReader");
  
  // 仅当文件未加载时，执行加载
  if ($reader.attr("data") !== pdfSrc) {
    $reader.attr("data", pdfSrc);
  }
  
  // 显示阅读器
  $modal.fadeIn(function () {
    $modal.css("display", "flex");
  });
  
  // 绑定关闭事件
  $modal.find(".modal-close").off("click").on("click", function () {
    $modal.fadeOut();
  });
}


/*api接口部分 --start*/

// 获取所有项目组
function getProjectTeamApi(callback) {
  $.ajax({
    url: 'getWholeProjectTeam',
    type: 'GET',
    dataType: 'json'
  }).done(function (result) {
    if (result.flag) {
      if (callback) {
        callback(result.data);
      }
    } else {
      alert(result.message)
    }
  }).fail(function () {
    alert('获取项目组失败')
  })
}

// 创建项目组
function createGroupApi(newPro, callback) {
  $.ajax({
    url: 'createGroup',
    type: 'POST',
    dataType: 'json',
    data: {
      'groupName': newPro,
      'userID': userData.userID
    }
  }).done(function (result) {
    if (callback) {
      callback(result);
    }
    console.log("success");
  }).fail(function () {
    console.log("error");
  })
}

// 将某用户加入至某项目组
function addUserToGroupApi(group, user, callback) {
  $.ajax({
    url: 'createGroupWithUser',
    type: 'POST',
    dataType: 'json',
    data: {
      'group': group,
      'user': user
    }
  }).done(function (result) {
    if (result.flag) {
      if (callback) {
        callback();
      }
    }
    else {
      alert(result.message)
    }
    
  }).fail(function () {
    console.log("error");
  })
}

// 获取某用户所在项目组
function getUserGroupsApi(callback) {
  $.ajax({
    url: 'getUserGroups',
    type: 'POST',
    dataType: 'json'
  }).done(function (result) {
    if (callback) {
      if (result.flag) {
        callback(result.data);
      }
      else {
        alert(result.message);
      }
    }
  }).fail(function () {
    console.log("error");
  })
}

// 初始化用户数据
function initUserDataApi(callback) {
  $.ajax({
    url: 'init',
    type: 'post',
    dataType: 'json'
  }).done(function (result) {
    if (callback) {
      if (result.flag) {
        callback(result.data);
      }
      else {
        alert(result.message)
      }
    }
  }).fail(function () {
    alert("链接超时，请重新登录");
    location.href = "/";
  });
}

// 获取某项目组内聊天记录
function getGroupMessagesApi(groupID, page, callback) {
  $.ajax({
    url: 'getGroupMessages',
    type: 'POST',
    dataType: 'json',
    data: {
      'groupID': groupID,
      'page': page,
      'messNum': 20
    }
  }).done(function (result) {
    if (result.flag) {
      if (callback) {
        callback(result.data);
      }
    }
    else {
      alert(result.message)
    }
  }).fail(function () {
    alert("服务器连接失败")
  })
}

// 将某用户从项目组中删除
function deleteUserInGroupApi(group, user, callback) {
  $.ajax({
    url: 'deleteUserInGroup',
    type: 'POST',
    dataType: 'json',
    data: {
      'group': group,
      'user': user
    }
  }).done(function (result) {
    if (result.flag) {
      if (callback) {
        callback();
      }
    }
    else {
      alert(result.message)
    }
  }).fail(function () {
    alert("服务器连接失败")
  })
}

// 获取某项目组下的所有用户
function getProjectUsersApi(groupID, callback) {
  $.ajax({
    url: 'getProjectUsers',
    type: 'POST',
    dataType: 'json',
    data: {
      'groupID': groupID
    }
  }).done(function (result) {
    if (result.flag) {
      if (callback) {
        callback(result.data);
      }
    }
    else {
      alert(result.message)
    }
  }).fail(function () {
    alert("服务器连接失败")
    
  }).always(function () {
  });
}

// 注销
function logout(userID, callback) {
  $.ajax({
    url: 'logout',
    type: 'POST',
    dataType: 'json',
    data: {
      userID: userID
    }
  }).done(function () {
    if (callback) {
      callback();
    }
  }).fail(function () {
    alert("服务器连接失败")
  }).always(function () {
    console.log("complete");
  });
}

function getWholeUserApi(callback) {
  $.ajax({
    url: 'getWholeUser',
    type: 'get',
    dataType: 'json'
  }).done(function (result) {
    if (result.flag) {
      if (callback) {
        callback(result.data);
      }
    }
    else {
      alert(result.message)
    }
  }).fail(function () {
    alert("链接超时");
  }).always(function () {
    console.log("complete");
  });
}

function getUserDailyApi(type, callback) {
  $.ajax({
    url: 'getUserDaily',
    type: 'post',
    dataType: 'json',
    data: {
      type: type
    }
  }).done(function (result) {
    if (callback) {
      callback(result);
    }
  }).fail(function () {
    alert("服务器连接失败")
  }).always(function () {
    console.log("complete");
  });
}

/*api接口部分 --end*/

/*yunDisk接口部分 --start*/
function getYunFileApi(diskUrl, page, order_name, order_type, callback) {
  $.ajax({
    url: 'getYunFile',
    type: 'POST',
    dataType: 'json',
    data: {
      'diskUrl': diskUrl,
      'page': page,
      'order_name': order_name,
      'order_type': order_type
    }
  }).done(function (data) {
    if (data.ok) {
      if (callback) {
        callback(data);
      }
    } else {
      helpMess({
        title: '提示',
        width: '200px',
        content: '文件列表获取失败！',
        okValue: '重 试',
        ok: function () {
          console.log('test');
        }
      })
    }
  }).fail(function () {
    console.log("error");
    helpMess({
      title: '提示',
      width: '200px',
      content: '文件列表获取超时，请检查网络',
      okValue: '重 试',
      ok: function () {
        console.log('test');
      }
    })
  }).always(function () {
    console.log("complete");
  });
}

function uploadTx(base64) {
  $.ajax({
    url: 'uploadTx',
    type: 'post',
    dataType: 'json',
    data: {
      userID: userData.userID,
      data: base64
    }
  }).done(function (result) {
    if (result.flag) {
      socket.emit("reloadTx", userData);
      alert('头像上传成功！')
    }
    else {
      alert("头像上传失败 ---->" + result.message)
    }
  }).fail(function () {
    alert("服务器连接失败")
  }).always(function () {
    console.log("complete");
  });
}

function uploadFiles_base64(data, callback) {
  var dataArr = data.split(',');
  var type = dataArr[0].replace(/data:image\//, '').replace(/;base64/, '');
  var base64 = dataArr[1];
  $.ajax({
    url: 'uploadFiles_rm_base64',
    type: 'post',
    dataType: 'json',
    data: {
      extName: type,
      data: base64
    }
  }).done(function (result) {
    callback(result)
  }).fail(function () {
    alert("服务器连接失败")
  })
}

function uploadFiles(files, callback) {
  var form = new FormData();
  var xhr = new XMLHttpRequest();
  $.each(files, function (index, el) {
    console.log(el)
    form.append("files", el);
  })
  // 文件对象
  // XMLHttpRequest 对象
  xhr.open("post", '/weare/uploadFiles_rm', true); //post方式，url为服务器请求地址，true 该参数规定请求是否异步处理。
  xhr.onload = function (e) {
    var result = e.target.responseText
    try {
      result = JSON.parse(result)
    } catch (e) {
      result = {
        err: e
      }
    }
    callback(result)
  }; //请求完成
  xhr.onerror = function (e) {
    var result = {
      err: e
    }
    callback(result)
  }; //请求失败
  xhr.upload.onprogress = function (evt) {
    // uploading = true;
    var progress = Math.round(evt.loaded / evt.total * 100);
    // $(".uploadBtn>i").css('width', progress + 'px');
    // $(".uploadBtn>span").html(progress + '%')
    console.log(progress + '%')
  }; //【上传进度调用方法实现】
  xhr.upload.onloadstart = function () { //上传开始执行方法
    console.log("开始上传")
  };
  xhr.send(form); //开始上传，发送form数据
}

function imgOnError(_this) {
  console.log("图片加载失败！");
  _this.src = staticUrl + '/images/img_err.png';
  var count = parseInt($(_this).attr('count'));
  console.log(count)
  if (!count) {
    count = 1
    $(_this).attr('count', count);
    setTimeout(function () {
      _this.src = $(_this).attr("url") + '?' + parseInt(Math.random() * 100000000)
    }, 1500);
  }
  else if (count < 3) {
    count++;
    $(_this).attr('count', count);
    setTimeout(function () {
      _this.src = $(_this).attr("url") + '?' + parseInt(Math.random() * 100000000)
    }, 1500);
  }
  else {
    _this.src = staticUrl + '/images/img_err.png';
    return
  }
}

function randMessageID(userID){
  return userData.userID + new Date().getTime();
}


/*yunDisk接口部分 --end*/
/************************
 * 用了CodeMirror，该功能暂时废弃 *
 ************************/
// $(function() {
// 	/*  在textarea处插入文本--Start */
// 	(function($) {
// 		$.fn.extend({
// 			insertContent: function(myValue, t) {
// 				var $t = $(this)[0];
// 				if (document.selection) { // ie
// 					this.focus();
// 					var sel = document.selection.createRange();
// 					sel.text = myValue;
// 					this.focus();
// 					sel.moveStart('character', -l);
// 					var wee = sel.text.length;
// 					if (arguments.length == 2) {
// 						var l = $t.value.length;
// 						sel.moveEnd("character", wee + t);
// 						t <= 0 ? sel.moveStart("character", wee - 2 * t - myValue.length) :
// 							sel.moveStart(
// 								"character", wee - t - myValue.length);
// 						sel.select();
// 					}
// 				} else if ($t.selectionStart || $t.selectionStart == '0') {
// 					var startPos = $t.selectionStart;
// 					var endPos = $t.selectionEnd;
// 					var scrollTop = $t.scrollTop;
// 					$t.value = $t.value.substring(0, startPos) + myValue + $t.value.substring(
// 						endPos,
// 						$t.value.length);
// 					this.focus();
// 					$t.selectionStart = startPos + myValue.length;
// 					$t.selectionEnd = startPos + myValue.length;
// 					$t.scrollTop = scrollTop;
// 					if (arguments.length == 2) {
// 						$t.setSelectionRange(startPos - t,
// 							$t.selectionEnd + t);
// 						this.focus();
// 					}
// 				} else {
// 					this.value += myValue;
// 					this.focus();
// 				}
// 			}
// 		})
// 	})(jQuery);
// 	/* 在textarea处插入文本--Ending */
// });
