/************************
 * tesla聊天界面初始化         *
 * author：Shayne C      *
 * createTime: 2017.4.1 *
 ************************/
$(function () {
  /***********
   * 用户数据初始化 *
   ***********/
  if (typeof app !== 'undefined') {
    app.send('webviewEvent', {
      shelfView: webview.shelfView,
      bookView: webview.bookView,
      event: "bookLoaded"
    });
  }
  changeLoaderString('界面加载完成……');
  checkTeslaVersion();
  initUserData();
  /********************
   * CodeMirror编辑器初始化 *
   ********************/
  editor = CodeMirror(document.getElementById("textArea"), {
    mode: "",
    extraKeys: {
      Enter: function (cm) {
        if (!userData.projectTeam) {
          alert("你没有项目组，不能发消息，请联系管理员！")
          return false;
        }
        $(".emojiDiv").hide(500)
        var textAreaVal = editor.getValue();
        editor.setValue('')
        if (textAreaVal === '') {
          return false;
        }
        var textAreaVal = initCode(textAreaVal)
        var _this = $('.showMess[projectID="' + userData.projectTeam.groupID + '"]');
        userData['messageType'] = 'text';
        var re = new RegExp(/(https?|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g);
        var re1 = new RegExp('(https?|ftp|file)://[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]');
        var domainUrl = textAreaVal.match(re);
        var urlArr = [];
        console.log(domainUrl);
        if (domainUrl) {
          for (var i = 0; i < domainUrl.length; i++) {
            urlArr.push('<a target="_blank" href="' + domainUrl[i] + '">' + domainUrl[i] + '</a>');
            textAreaVal = textAreaVal.replace(re1, '####')
          }
        }
        for (var i = 0; i < urlArr.length; i++) {
          textAreaVal = textAreaVal.replace('####', urlArr[i])
        }
        userData['message'] = textAreaVal;
        userData['messageID'] = userData.userID + new Date().getTime();
        sendMessages(0, userData, 0, _this, 0);
        enablecodeMirrorMode()
        $('.showArea').scrollTop($('.showClass').height());
        socket.emit("sendMessage", userData);
      },
      'Ctrl-Enter': function (cm) {
        editor.replaceSelection("\n");
        return;
      },
      'Cmd-Enter': function (cm) {
        editor.replaceSelection("\n");
        return;
      }
    },
    'lineWrapping': true,
    'autofocus': true
  });
  changeLoaderString('编辑器加载完成……');
  /*********************
   * 设置CodeMirror宽度和高度 *
   *********************/
  editor.setSize('100%', '100%');
  //取消ipad垂直滑动的默认操作
  // document.addEventListener("touchmove", function(event) {
  //     event.preventDefault();
  // }, false);
  $(document).click(function (event) {
    $(".emojiDiv").hide(500);
  });
  // 输入框监听粘贴事件
  document.addEventListener("paste", function (e) {
    e.preventDefault();
    var cbd = e.clipboardData;
    var ua = window.navigator.userAgent;
    // 如果是 Safari 直接 return
    if (!(e.clipboardData && e.clipboardData.items)) {
      return;
    }
    // Mac平台下Chrome49版本以下 复制Finder中的文件的Bug Hack掉
    if (cbd.items && cbd.items.length === 2 && cbd.items[0].kind === "string" && cbd.items[1].kind === "file" && cbd.types && cbd.types.length === 2 && cbd.types[0] === "text/plain" && cbd.types[1] === "Files" && ua.match(/Macintosh/i) && Number(ua.match(/Chrome\/(\d{2})/i)[1]) < 49) {
      return;
    }
    for (var i = 0; i < cbd.items.length; i++) {
      var item = cbd.items[i];
      console.log(item);
      if (item.kind == "file") {
        var blob = item.getAsFile();
        console.log(blob);
        if (!blob) {
          return;
        }
        window.URL = window.URL || window.webkitURL;
        var blobUrl = window.URL.createObjectURL(blob);
        console.log(blobUrl)
        var reader = new FileReader();
        helpMess({
          content: '<div style="width:300px;height:200px;overflow:hidden;position:relative;"><img src="' + blobUrl + '" style="width:100%;position:absolute;top:0;left:0;right:0;bottom:0;margin:auto;"></div>',
          okValue: '确 定',
          ok: function () {
            var tempClass = getRandomID(userData.userID);
            var textAreaVal = '<img class="' + tempClass + '" src="' + blobUrl + '"><article class="' + tempClass + 'imgLoading loading" style="width:100%;height:100%;position:absolute;top:0;left:0;background-color:#fff;"></article>';
            var _this = $('.showMess[projectID="' + userData.projectTeam.groupID + '"]');
            userData['messageType'] = 'img';
            userData['message'] = textAreaVal;
            sendMessages(0, userData, 0, _this, 0);
            $('.' + tempClass + 'imgLoading').mLoading(1);
            $("." + tempClass)[0].onload = function () {
              $(this).removeClass(tempClass);
              $('.showArea').scrollTop(_this.height());
            }
            userData['message'] = '<img src="{imgUrl}" class="messImg" onerror="imgOnfail(this)">';
            reader.onload = function (evt) {
              uploadFiles_base64(evt.target.result, function (result) {
                var userDataTemp = JSON.parse(JSON.stringify(userData));
                var textAreaVal = '<img src="' + result.fileUrl + '" url="' + result.fileUrl + '" onerror="imgOnError(this)">';
                userDataTemp['messageType'] = 'img'
                userDataTemp['message'] = textAreaVal;
                socket.emit("sendMessage", userDataTemp);
                $("." + tempClass + 'imgLoading').remove()
              })
            };
            reader.readAsDataURL(blob);
          },
          cancelValue: '取消',
          cancel: function () {
          }
        })
      }
    }
  }, false);
  // 监听拖拽事件
  $(document).on({
    dragleave: function (e) { //拖离
      e.preventDefault();
    },
    drop: function (e) { //拖后放
      e.preventDefault();
    },
    dragenter: function (e) { //拖进
      e.preventDefault();
    },
    dragover: function (e) { //拖来拖去
      e.preventDefault();
    }
  });
  box = $('body')[0]; //拖拽区域
  box.addEventListener("drop", function (e) {
    var files = e.dataTransfer.files;
    var fileCheck = true;
    $.each(files, function (index, el) {
      var pos = el.name.replace(/.+\./, "").toLowerCase();
      if ($.inArray(pos, imgArr) == -1) {
        fileCheck = false;
        helpMess({
          content: "<span style='color:red'>" + el.name + "</span><br>暂不支持拖拽发送文件，仅支持图片，谢谢合作",
          okValue: '确 定',
          ok: function () {
          }
        })
        return false;
      }
    });
    if (fileCheck) {
      // $('#addImg').val('');
      var tempClass = getRandomID(userData.userID);
      $.each(files, function (index, val) {
        var objUrl = getObjectURL(val);
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
        
      });
      uploadFiles(files, function (result) {
        var userDataTemp = JSON.parse(JSON.stringify(userData));
        console.log(result);
        var uploadImgArr = result.files;
        for (var i = 0; i < uploadImgArr.length; i++) {
          var pos = uploadImgArr[i].name.replace(/.+\./, "").toLowerCase();
          console.log("ok")
          console.log(uploadImgArr[i])
          var imgDownloadUrl = uploadImgArr[i].fileUrl;
          var imgPreviewUrl = uploadImgArr[i].filePreviewUrl;
          var textAreaVal;
          if (previewImgArr.indexOf(pos) !== -1) {
            console.log("有缩略图")
            textAreaVal = '<img src="' + imgPreviewUrl + '" url="' + imgPreviewUrl + '" onerror="imgOnError(this)"><a href="' + imgDownloadUrl + '">下载原图</a>';
          }
          else {
            console.log("无缩略图")
            textAreaVal = '<img src="' + imgPreviewUrl + '" url="' + imgDownloadUrl + '" onerror="imgOnError(this)"><a href="' + imgDownloadUrl + '">下载原图</a>';
          }
          userDataTemp['messageType'] = 'img'
          userDataTemp['message'] = textAreaVal;
          socket.emit("sendMessage", userDataTemp);
        }
        $("." + tempClass + 'imgLoading').remove()
      })
      
    }
  })
  changeLoaderString('主界面监听器加载完成……');
  
  /*****************
   * 以下是暂时被废弃的监听事件 *
   *****************/
  // $(window).bind('beforeunload', function() {
  // 	return '您输入的内容尚未保存，确定离开此页面吗？';
  // });
  // $(window).resize(function() {
  // 	init(0.8);
  // })
  //星标toggle效果
  // $('.starFlag').toggle(function() {
  //     $(this).children('i').removeClass('fa fa-star-empty').addClass(
  //         'fa fa-star');
  //     $(this).children('i').css('color', '#f3a93f');
  // }, function() {
  //     $(this).children('i').removeClass('fa fa-star').addClass(
  //         'fa fa-star-empty');
  //     $(this).children('i').css('color', '#999');
  // })
  //发送至对话框 文件
  // $('.sendDialog').click(function() {
  //     var messHtml = '';
  //     messHtml += '<div class="faceImgBlockMyself">';
  //     messHtml += '<img src="images/tx/23.jpg">';
  //     messHtml += '</div>';
  //     messHtml += '<div class="messFileBlock messMyself">';
  //     messHtml += '<div class="messArrow messArrowMyself"></div>';
  //     messHtml +=
  //         '<div class="nameTime"><span class="messName messNameMyself">小亮亮</span> <span class="messTime">15：15：15</span></div>';
  //     messHtml +=
  //         '<div class="saveBookmark" style="margin-top: 0;"><i class="fa fa-star-empty" title="标星"></i></div>';
  //     messHtml += '<div class="clear"></div>';
  //     messHtml += '<div class="messFile">';
  //     messHtml +=
  //         '<table width="100%" height="100%" border="0" cellspacing="0" cellpadding="0">';
  //     messHtml +=
  //         '<tr height="20"><td rowspan="4" width="28%" valign="top"><img src="images/Attachment_icon/doc.png"></td><td valign="top">文件名：wulala.doc</td></tr>';
  //     messHtml += '<tr height="20"><td valign="top">上传者：小亮亮</td></tr>';
  //     messHtml += '<tr height="20"><td valign="top">上传时间：2013-7-22</td></tr>';
  //     messHtml +=
  //         '<tr height="20"><td valign="top" class="downfile"><i class="fa fa-download" title="点击下载该文件"></i></td></tr>';
  //     messHtml += '</table>';
  //     messHtml += '</div>';
  //     messHtml += '</div>';
  //     messHtml += '<div class="clear"></div>';
  //     $('.showMess').append(messHtml);
  // })
  //会话处 代码 收起/展开
  // $('.saveBookmark i.fa fa-sort-up').on("click", function() {
  //     $(this).toggle(function() {
  //         $(this).addClass('fa fa-sort-down savemarkstar').removeClass(
  //             'fa fa-sort-up savebookmarkEnd');
  //         $(this).parent().css('margin-top', '-6px');
  //         $(this).parent().parent().children('.messContentCode').animate({
  //             height: "20px"
  //         });
  //     }, function() {
  //         $(this).addClass('fa fa-sort-up').removeClass(
  //             'fa fa-sort-down savemarkstar savebookmarkEnd');
  //         $(this).parent().css('margin-top', '3px');
  //         $(this).parent().parent().children('.messContentCode').animate({
  //             height: "100%"
  //         });
  //     })
  //     $(this).trigger('click');
  // })
  //会话框处 文件标星
  // $('.downfile i.fa fa-star-empty').on("click", function() {
  //     if ($(this).children('i').hasClass('downfilestar')) {
  //         $(this).children('i').removeClass('downfilestar fa fa-star').addClass(
  //             'fa fa-star-empty');
  //     }
  //     else {
  //         $(this).children('i').addClass('downfilestar fa fa-star').removeClass(
  //             'fa fa-star-empty');
  //     }
  // })
  //会话框处 保存为便签
  // $('.saveBookmark').on('click', function() {
  //     if ($(this).children('i').hasClass('savebookmarkEnd')) {
  //         $(this).children('i').removeClass('savebookmarkEnd fa fa-bookmark').addClass(
  //             'fa fa-bookmark-empty');
  //     }
  //     else {
  //         $(this).children('i').addClass('savebookmarkEnd fa fa-bookmark').removeClass(
  //             'fa fa-bookmark-empty');
  //     }
  // })
})
