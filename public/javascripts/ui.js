/************************
 * 前端dom监听器部分               *
 * author: Shayne C     *
 * updateTime: 2017.4.1 *
 ************************/
//隐藏标题栏
// window.onload = function() {
// 	setTimeout(function() {
// 		window.scrollTo(0, 1);
// 	}, 100);
// }
$(function () {
  if (typeof app !== "undefined") {
    $(".topBar").prepend('<div class="set bookShelf">'
      + '<i class="fa fa-book" aria-hidden="true" title="返回书架"></i>'
      + '</div>')
  }
  //上传头像
  $("#addPhotoBtn").click(function (event) {
    if (typeof FileReader === 'undefined') {
      alert("你的浏览器不支持FileReader接口！");
      return;
    }
    $("input.addTx").trigger('click');
  })
  //头像文件检测
  $("input.addTx").change(function (event) {
    var posArr = this.files[0].name.split('.')
    var pos = posArr[posArr.length - 1]
    if (pos !== 'png' && pos !== 'PNG' && pos !== 'jpg' && pos !== 'JPG') {
      alert(pos + "不是正确的图片文件！")
      return;
    }
    var reader = new FileReader();
    //将文件以Data URL形式读入页面
    reader.readAsDataURL(this.files[0]);
    reader.onload = function (e) {
      //显示文件
      if (e.total / 1000000 > 5) {
        alert("请不要上传大于5mb的图片")
        return;
      }
      $(".myTxDiv > img")[0].src = e.target.result
    }

  })
  //头像
  $(".defaultTx").click(function (event) {
    var url = $(this).attr('src');
    $(".myTxDiv>img").attr('src', url);
  });
  // 保存头像
  $("#saveTx").click(function (event) {
    var reg = new RegExp(/data:image/);
    var url = $(".myTxDiv > img").attr('src');
    if (!reg.test(url)){
      changeTx(url);
    }
    else{
      var base64Buffer = $(".myTxDiv > img")[0].src.replace(/^data:image\/\w+;base64,/, "");
      uploadTx(base64Buffer)
    }
  });
  // emoji表情按钮
  $(".fa.fa-smile-o").click(function (event) {
    event.stopPropagation();
    if ($(".emojiDiv").is(':visible')) {
      $(".emojiDiv").hide(500);
    } else {
      $(".emojiDiv").show(500);
    }
  });
  $(".emojiDiv > span").click(function (event) {
    event.stopPropagation();
    editor.replaceSelection($(this).html())
  });
  // 图片上传按钮
  $("#sendImg").click(function (event) {
    $(this).children('input')[0].click();
  });
  // 文件上传按钮
  $("#sendFileIcon").click(function (event) {
    $(this).children('input')[0].click();
  });
  $(".fa.fa-code").click(function (event) {
    if (!$(".codeView").is(':visible')) {
      $(".codeView").show(300);
    } else {
      {
        $(".codeView").hide(300);
      }
    }
  });
  $(".codeView > a").click(function (event) {
    editor.replaceSelection("##" + $(this).html() + "#\n\n" + "#" + $(this).html() + "##");
  });
  //左侧项目名称切换
  $('.left>ul').on('click', 'li', function (event) {
    if ($(this).hasClass('leftActive')) {
      return false;
    }
    $(this).addClass('leftActive').siblings().removeClass('leftActive');
    if ($(this).children('b').length) {
      $(this).children('b').remove();
    }
    // $(this).children('b').addClass('bActive');
    // $(this).siblings().children('b').removeClass('bActive');
    var pID = $(this).attr('projectID');
    var _this = $(".showMess[projectID=" + pID + "]");
    _this.addClass('showClass').siblings('.showMess').removeClass('showClass');
    var projectTeam = {};
    projectTeam['groupID'] = pID;
    projectTeam['groupName'] = $(this).children('span').html();
    userData.projectTeam = projectTeam;
    saveCurrentGroup(userData.userID, userData.projectTeam['groupID'])
    getProjectUsers(pID);
    var $fileListView = $(".fileListView")
    if ($(".showClass").attr('projectid') !== $fileListView.attr('currentPro') && !$fileListView.is(':hidden')) {
      getYunFile(projectTeam['groupName'], 1, 'create_time', 'desc');
    }
    var imgArr = $(".showMess[projectID=" + pID + "] .messContent img");
    var imgArrlength = imgArr.length;
    imgArr.each(function (index, el) {
      imgArrlength--;
      $(this)[0].onload = function () {
        this.onload = null;
        if (!imgArrlength) {
          $('.showArea').scrollTop(_this.height());
        }
      };
    });
    $('.showArea').scrollTop(_this.height());
  })
  // 人员配置-项目组切换
  $(".editUser > div > select").change(function (event) {
    var pID = $(this).children('option:selected').val();
    showProUser(pID);
  });
  // 刷新所有成员
  $(".reUser").click(function (event) {
    var currentPID = $(".editUser > div > select").val();
    getWholeUser(function () {
      $(".editUser > div > select").val(currentPID);
      showProUser(currentPID);
    });
    $(".editUser > div > select").get(0).selectedIndex = 0;
  });
  // 增删项目组成员
  $(".editUser").delegate('.groupuser > a > label', 'click', function (event) {
    if ($(this).attr('loading') === 'true') {
      return false;
    }
    var currentGroupID = userData.projectTeam.groupID;
    var _this = $(this).siblings('input')[0];
    var userID = $(this).parent().attr('userID');
    var userName = $(this).siblings('span').text();
    var groupID = $(".editUser > div > select > option:selected").val();
    var groupName = $(".editUser > div > select > option:selected").text();
    console.log(groupID);
    console.log(groupName);
    if (groupID === 'layer') {
      alert("请先选择项目组");
      return false;
    }
    var group = {
      'groupID': groupID,
      'groupName': groupName
    };
    var user = {
      'userID': userID,
      'userName': userName
    };
    var _dom = $(this);
    _dom.attr('loading', 'true');
    var socketUser = {
      userID: userID,
      groupID: groupID,
      groupName: groupName
    }
    if (_this.checked) {
      deleteUserInGroupApi(group, user, function () {
        _dom.removeAttr('loading');
        // if (groupID === currentGroupID) {
        //     getProjectUsers(currentGroupID);
        // }
        socket.emit("leaveUser", socketUser)
      });
    } else {
      addUserToGroupApi(group, user, function () {
        _dom.removeAttr('loading');
        // if (groupID === currentGroupID) {
        //     getProjectUsers(currentGroupID);
        // }
        socket.emit("inviteUser", socketUser)
      });
    }
  });
  //底部tab切换
  $('.tabArea>ul>li').click(function () {
    if ($(this).hasClass("tabActive")) {
      return false;
    }
    var taskName = $(this).attr('rel');
    $(this).addClass('tabActive').siblings().removeClass('tabActive');
    $('.' + taskName).show().css('display', 'flex').siblings('.userView').hide();
    if (taskName === "fileListView") {
      var folderName = $(".showClass").attr('projectid');
      getYunFile(userData.projectTeam['groupName'], 1, 'create_time', 'desc');
    }
    // else if (taskName === "statistics") {
    //   var $statistics = $(".statistics")
    //   if ($statistics.attr('loaded')) {
    //     return false
    //   }
    //   getUserDailyApi('latest', function (result) {
    //     if (result.flag == false) {
    //       helpMess({
    //         content: "<span style='color:red'>" + result.message + "</span>",
    //         okValue: '确 定',
    //         ok: function () {
    //         }
    //       })
    //       return false
    //     }
    //     console.log(result)
    //     var resultData = result.data
    //     var latestTime = result.latestTime
    //     var weekCharts = $("#week-charts")[0]
    //     var userNameArr = []
    //     var timeArr = {}
    //     var dateArr = []
    //     $.each(resultData, function (index, el) {
    //       //获取日期数组
    //       dateArr.push(index)
    //       $.each(el, function (index, el) {
    //         //获取用户名数组（含重复数据）
    //         userNameArr.push(index)
    //       })
    //     })
    //     //用户名数组去重
    //     userNameArr = Array.from(new Set(userNameArr))
    //     for (var i = 0; i < userNameArr.length; i++) {
    //       //初始化用户的日报时间数组
    //       timeArr[userNameArr[i]] = []
    //     }
    //     console.log(userNameArr)
    //     console.log(dateArr)
    //     $.each(resultData, function (index, el) {
    //       //这里重新进行一次遍历，为的是补上那些忘记发日报的人的日报时间
    //       for (var i = 0; i < userNameArr.length; i++) {
    //         //如果用户没有发日报，在该日期队列里加上该用户，且日报时间为'-'
    //         if (!el.hasOwnProperty(userNameArr[i])) {
    //           el[userNameArr[i]] = {
    //             time: null,
    //             message: ''
    //           }
    //         }
    //         //如果用户发了日报，就将它的日报时间加入到日报队列中
    //         timeArr[userNameArr[i]].push([el[userNameArr[i]].time, el[userNameArr[i]].mess])
    //       }
    //     })
    //     console.log(timeArr)
    //     console.log(resultData)
    //     var config_series = []
    //     $.each(timeArr, function (index, el) {
    //       var userTimeDataArr = []
    //       var userMessArr = []
    //       $.each(el, function (index2, el2) {
    //         userTimeDataArr.push({y: el2[0], description: el2[1]})
    //       })
    //       console.log(index + ':')
    //       console.log(userTimeDataArr)
    //       config_series.push({
    //         name: index,                        // 数据列名
    //         data: userTimeDataArr
    //       })
    //     })
    //     var options = {
    //       chart: {
    //         type: 'line'                          //指定图表的类型，默认是折线图（line）
    //       },
    //       title: {
    //         text: '周日报统计'                 // 标题
    //       },
    //       subtitle: {
    //         text: '数据截止于 - ' + latestTime,
    //         align: 'right',
    //         style: {"color": "#4e00ff"}
    //       },
    //       credits: {
    //         text: 'tesla',
    //         href: 'http://es.tes-sys.com/weare'
    //       },
    //       tooltip: {
    //         pointFormatter: function () {
    //           var vdata = this.y
    //           var hours = parseInt(vdata / 3600)
    //           var minutes = parseInt((vdata - hours * 3600) / 60)
    //           var seconds = vdata - hours * 3600 - minutes * 60
    //           hours = hours < 10 ? '0' + hours : hours + ''
    //           minutes = minutes < 10 ? '0' + minutes : minutes + ''
    //           seconds = seconds < 10 ? '0' + seconds : seconds + ''
    //           console.log(this)
    //           var val = hours + ':' + minutes + ':' + seconds + '<br>-' + this.series.name + '<br>' + this.description
    //           return val
    //         }
    //       },
    //       xAxis: {
    //         categories: dateArr   // x 轴分类
    //       },
    //       yAxis: {
    //         title: {
    //           text: '日报时间'                // y 轴标题
    //         },
    //         // min: 61200,
    //         type: 'datetime',
    //         labels: {
    //           formatter: function () {
    //             if (this.value === '-') {
    //               return this.value
    //             }
    //             var hours = parseInt(this.value / 3600)
    //             var minutes = parseInt((this.value - hours * 3600) / 60)
    //             var seconds = this.value - hours * 3600 - minutes * 60
    //             hours = hours < 10 ? '0' + hours : hours + ''
    //             minutes = minutes < 10 ? '0' + minutes : minutes + ''
    //             seconds = seconds < 10 ? '0' + seconds : seconds + ''
    //             var val = hours + ':' + minutes + ':' + seconds
    //             return val
    //           }
    //         },
    //       },
    //       colors: ['#7cb5ec',
    //         '#434348',
    //         '#90ed7d',
    //         '#f7a35c',
    //         '#8085e9',
    //         '#f15c80',
    //         '#e4d354',
    //         '#2b908f',
    //         '#f45b5b',
    //         '#91e8e1',
    //         '#663366',
    //         '#CCFF00',
    //         '#FFCCFF',
    //         '#99CC33',
    //         '#CCCC33',
    //         '#CC9900',
    //         '#FFCC33',
    //         '#FF66CC',
    //         '#330066',
    //         '#00CCFF',
    //         '#33FF66',
    //         '#CC3300'
    //       ],
    //       series: config_series
    //     };
    //     // 图表初始化函数
    //     var chart = Highcharts.chart('week-charts', options);
    //     console.log(chart)
    //     $statistics.attr('loaded', true)
    //   });
    // }
  })
  //设置窗口tab切换
  $('.setTitle ul li').click(function () {
    if ($(this).hasClass('setMenuActive')) {
      return;
    }
    $(this).addClass('setMenuActive').siblings().removeClass('setMenuActive');
    $('.setContent>div:eq(' + $(this).index() + ')').show().siblings().hide();
    if ($(this).attr('rel') === "userConfig") {
      if (!$(this).hasClass('userLoaded')) {
        getWholeUser(function () {
          var currentPID = userData.projectTeam.groupID;
          $(".editUser > div > select").val(currentPID);
          showProUser(currentPID);
        });
        $(this).addClass('userLoaded');
      }
    }
  })
  // 关闭设置窗口
  $('.setWinClose').click(function () {
    $('.setWin').hide();
    $('.mask').hide();
  })
  //项目组选择
  $('.programmeUl ul').on('click', 'li', function (event) {
    if ($(this).hasClass('preventClick')) {
      return false;
    }
    var this_dom = $(this);
    var user = new Object();
    var group = new Object();
    user['userID'] = userData.userID;
    user['userName'] = userData.userName;
    group['groupID'] = this_dom.attr('projectID');
    group['groupName'] = this_dom.html();
    if (this_dom.hasClass('choose')) {
      leaveGroup(this_dom, group, user);
    } else {
      enterGroup(this_dom, group, user);
    }
  });
  //添加项目组
  $('.addPro').click(function () {
    var newPro = prompt('请输入新项目组名');
    if (newPro) {
      addProject(newPro);
    } else {
      alert('请输入正确的项目组名称');
    }
  })
  $(".proReflash").click(function (event) {
    reflashPro();
    $(".groupuser > a > input:checked").attr('checked', false);
  });
  //弹出设置对话框
  $('.set.config').click(function () {
    $('.setWin').show();
    $('.mask').show();
    if (!parseInt(userData['role_type'])) {
      console.log("非管理员")
      return false;
    }
    if ($(".setMenuActive").attr('rel') === "userConfig") {
      var pID = userData.projectTeam.groupID
      $(".editUser > div > select").val(pID);
      showProUser(pID);
    }
    if (!$(this).hasClass('configLoaded')) {
      reflashPro();
      $(this).addClass('configLoaded');
    }
  })
  // 注销
  $(".signout").click(function (event) {
    helpMess({
      width: '200px',
      content: '您确定要注销吗？',
      okValue: '确 定',
      ok: function () {
        logout(userData.userID, function () {
          $(window).unbind('beforeunload');
          window.location.href = "/weare";
        })
      },
      cancelValue: '取消',
      cancel: function () {
      }
    })
  });
  // @成员
  $(".right > ul").delegate('li', 'click', function (event) {
    editor.replaceSelection('@' + $(this).children('span').html() + ' ')
    editor.focus();
  });
  // 对话列表的滚动监听
  $(".showArea").scroll(function (event) {
    var $showArea = $(this)
    if (!$(this).scrollTop()) {
      var $showClass = $(".showClass");
      var currentPage = parseInt($showClass.attr('currentPage'));
      currentPage++;
      var groupID = $showClass.attr('projectid');
      var preH = $showClass.height()
      getGroupMessages(groupID, currentPage, function (len) {
        if (len) {
          enablecodeMirrorMode();
          $showClass.attr('currentPage', currentPage);
          var h = parseInt(parseInt($showClass.height()) - preH)
          $showArea.scrollTop(h)
        }
      });
    }
  });
  // 图片点击放大
  $(".showArea").on('click', '.messContent > img', function (e) {
    e.preventDefault();

    gatherAllImageFormChat(e.target);
  });

  // 获取当前窗口中的所有聊天图片
  function gatherAllImageFormChat(target) {
    var imgArr = [];
    var index = 0;
    $(target).closest('.showClass').find('.messContent').find('img').each(function(i, item) {
      // 记录当前图片所在的序号
      (item === target) && (index = i);

      imgArr.push({
        title: '图片：' + i,
        src: item.currentSrc,
        w: item.naturalWidth || 1024,
        h: item.naturalHeight || 768
      });
    });
    showPhotoSwipeImgsArr(imgArr, index);
  }

  /***************
   *  上传图片按钮监听事件 *
   ***************/
  $('#addImg').change(function (event) {
    var images = this.files;
    console.log(images);
    var fileCheck = true;
    $.each(images, function (index, val) {
      var pos = val.name.replace(/.+\./, "").toLowerCase();
      if ($.inArray(pos, imgArr) == -1) {
        fileCheck = false;
        helpMess({
          content: "<span style='color:red'>" + val.name + "</span><br>不正确的后缀名！请选择正确的图片文件！",
          okValue: '确 定',
          ok: function () {
          }
        })
        return false;
      }
    });
    if (fileCheck) {
      $.each(images, function (index, val) {
        var objUrl = getObjectURL(val);
        var tempClass = getRandomID(userData.userID);
        var textAreaVal = '<img class="' + tempClass + '" src="' + objUrl + '"><article class="' + tempClass + 'imgLoading loading" style="width:100%;height:100%;position:absolute;top:0;left:0;background-color:#fff;"></article>';
        var _this = $('.showMess[projectID="' + userData.projectTeam.groupID + '"]');
        userData['messageType'] = 'img'
        userData['message'] = textAreaVal;
        sendMessages(0, userData, 0, _this, 0);
        $('.' + tempClass + 'imgLoading').mLoading(1);
        $("." + tempClass)[0].onload = function () {
          $(this).removeClass(tempClass);
          $('.showArea').scrollTop(_this.height());
        }
        var reader = new FileReader();
        userData['message'] = '<img src="{imgUrl}" class="messImg" onerror="imgOnfail(this)">';
        reader.onload = function (evt) {
          socket.emit('sendImage', {
            'name': val.name,
            'segment': evt.target.result,
            'size': val.size,
            'user': userData,
            'userflag': tempClass + 'imgLoading'
          });
        };
        reader.readAsDataURL(val);
        if (index === images.length - 1) {
          console.log("ok");
          $('#addImg').val('');
        }
      });
    }
  });

  //上传文件事件监听
  $("#addFiles").change(function (event) {
    var files = this.files;
    if (files.length > 1) {
      helpMess({
        content: "<span style='color:red'>暂不支持多文件上传。。</span>",
        okValue: '确 定',
        ok: function () {
        }
      })
      return false
    }
    var pos = files[0].name.split('.')
    var fileextname = pos[pos.length - 1]
    var filename = files[0].name
    var filesize = getFileSize(files[0].size)
    var messageID = userData.userID + new Date().getTime();
    var text = '<i class="ico ico-' + fileextname + '">' + fileextname + '</i><div class="fileinfo"><p>' + filename + '</p><p>' + filesize + '<a tar="' + messageID + '" href="{downloadUrl}"  target="_blank">下载</a></p></div>'
    var _this = $('.showMess[projectID="' + userData.projectTeam.groupID + '"]');
    userData['messageType'] = 'file';
    userData['message'] = text;
    userData['fileCheck'] = true;
    userData['fileName'] = filename;
    userData['messageID'] = messageID
    sendMessages(0, userData, 0, _this, 0);

    var $contentDiv = $("#" + messageID)
    $("#" + messageID + " .messContent").append('<div class="' + messageID + '" style="position:absolute;width:100%;height:100%;justify-content: center;align-items: center;left: 0;top:0;font-size: 25px;" ><div style="position:absolute;width:100%;height:100%;background-color: rgba(251, 126, 116,.5);left: 0;top: 0;"></div><span style="position: absolute;">0%</span></div>')
    var $mask = $("div." + messageID)
    var $span = $("div." + messageID + ">span")
    var $div = $("div." + messageID + ">div")
    autoScroll($(".showClass"));

    var form = new FormData(); // FormData 对象
    $.each(files, function (index, el) {
      console.log(el)
      form.append("files" + index, el);
    })
    form.append("userData", JSON.stringify(userData));
    form.append("dirUrl", userData.projectTeam.groupName)
    delete userData['fileCheck'];
    delete userData['fileName'];
    // 文件对象
    console.log(form)


    var url = "/weare/uploadFile"; // 接收上传文件的后台地址
    var xhr = new XMLHttpRequest();
    xhr.open("post", url, true); //post方式，url为服务器请求地址，true 该参数规定请求是否异步处理。
    //请求完成
    xhr.onload = function (evt) {
      $mask.empty()
      $mask.css({
        'color': '#fb7e74',
        'font-size': '18px'
      })
      $contentDiv.find('.textLoading').remove()
      var result;
      try {
        result = JSON.parse(evt.target.responseText)
      }
      catch (e) {
        $mask.html('上传失败!')
        return false
      }
      if (result) {
        if (result.flag) {
          $mask.html('<i class="fa fa-refresh fa-spin fa-3x fa-fw"></i>')
          $contentDiv.css('opacity', '.5')
          console.log("请求完成")
        }
        else {
          $mask.html(result.message)
          return false
        }
      } else {
        $mask.html('上传失败!')
        return false
      }
    };
    //请求失败
    xhr.onerror = function () {
      console.log("请求失败")
    };
    //检测上传进度
    xhr.upload.onprogress = function (evt) {
      var progress = parseInt(evt.loaded / evt.total * 100)
      $span.html(progress + '%')
      $div.css('height', (100 - progress) + '%')
    };
    //监听上传开始事件
    xhr.upload.onloadstart = function () {
      console.log("开始上传")
    };
    console.log("上传")
    xhr.send(form);
  })


  // 文件页码切换
  $(".filePage").delegate('.pageNum', 'click', function (event) {
    $(this).addClass('pageHit').siblings().removeClass('pageHit');
    var page = parseInt($(this).attr('pagenum'));
    var pID = $(".fileListView").attr('currentpro');
    getYunFile(userData.projectTeam['groupName'], page, 'create_time', 'desc', 1);
  });
  $(".fileTableDiv").delegate('.sendFileMessage', 'click', function (event) {
    $(".chatMenu")[0].click();
    var _this = $('.showMess[projectID="' + userData.projectTeam.groupID + '"]');
    var pDom = $(this).parent().parent();
    var fileextname = pDom.children('.tabFileExtName').html();
    var filename = pDom.children('.tabFileName').html();
    var filesize = pDom.children('.tabFileSize').html();
    var fileurl = pDom.children('.TabFileUrl').children('a').attr('href');
    var text = '<i class="ico ico-' + fileextname + '">' + fileextname + '</i><div class="fileinfo"><p>' + filename + '</p><p>' + filesize + '<a href="' + fileurl + '"  target="_blank">下载</a></p></div>'
    userData['message'] = text;
    userData['fileCheck'] = true;
    userData['fileName'] = filename;
    userData['messageID'] = userData.userID + new Date().getTime();
    sendMessages(0, userData, 0, _this, 0);
    socket.emit("sendMessage", userData);
    delete userData['fileCheck'];
    delete userData['fileName'];
    autoScroll($(".showClass"));
  });
  // 日报
  $("i.daily").click(function (event) {
    editor.replaceSelection("【项目名称】\n1、进度汇报\n\n2、任务问题讨论\n\n3、明天重点工作安排\n\n4、工作资源需求，或请假需求\n");
  });
  // 更改对话框高度
  var heightResizeCheck = false;
  $(".move-bar").mousedown(function (event) {
    heightResizeCheck = true;
    var currentY = event.pageY;
    var pH = parseInt($(".postArea").css('height'));
    $(document).mousemove(function (evt) {
      var realY = currentY - evt.pageY;
      pH += realY;
      $(".postArea").css('height', pH + 'px');
      currentY = evt.pageY;
    });
  });
  $(document).mouseup(function (event) {
    if (heightResizeCheck) {
      $(document).unbind('mousemove');
      heightResizeCheck = false;
    }
  });

  $("#textArea").click(function (event) {
    editor.focus();
  });


  var canPreviewType = ["png", "jpg", "gif", "bmp", "jpeg", "pdf", "mp4", "webm", "ogg"];
  var previewByPhotoSwipe = ["png", "jpg", "gif", "bmp", "jpeg"];
  var previewByVideo = ["mp4", "webm", "ogg"];
  // 双击对话框中文件的图标，预览资源
  $(".showArea").on("dblclick", ".messageBlock .ico", function (e) {
    var $this = $(e.currentTarget);
    var type = $this.text();
    // 判断文件类型是否存在
    if (!type) {
      return false;
    }
    if ($.inArray(type, canPreviewType) < 0) {
      console.log("该文件不支持预览...");
      return false;
    }
    console.log(type);
    var dldUrl = $this.next(".fileinfo").find("a").attr("href");
    console.log(dldUrl);
    // 预览图片
    if ($.inArray(type, previewByPhotoSwipe) >= 0) {
      preloadImageForPhotoSwipe($this, dldUrl);
    }

    // 预览视频
    if ($.inArray(type, previewByVideo) >= 0) {
      showVideoReader(dldUrl);
    }

    // 预览PDF
    if (type === "pdf") {
      showPdfReader(dldUrl + "." + type);
    }
  });

  // 全局广播消息提示
  // $('.set.broadcast').click(function(event) {
  // 	helpMess(false,
  // 		'请输入你要广播的信息：<textarea autofocus maxlength="80" class="broadcastContent" style="margin-top:15px;resize:none;width:100%;height:50px;">',
  // 		'300px', null,
  // 		function() {
  // 			var content = $(".broadcastContent").val();
  // 			socket.emit('broadcast', {
  // 				'username': userData.userName,
  // 				'broadcastContent': content
  // 			});
  // 			$(".broadcastContent").val('');
  // 		});
  // });
  $(".set.bookShelf").click(function (e) {
    app.send('webviewEvent', {
      event: "toggleView",
      showView: webview.shelfView,
      hideView: webview.bookView
    })
  })
})
