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
$(function() {
    //头像
    $(".defaultTx").click(function(event) {
        var url = $(this).attr('src');
        $(".myTxDiv>img").attr('src', url);
    });
    // 保存头像
    $("#saveTx").click(function(event) {
        var url = $(".myTxDiv > img").attr('src');
        changeTx(url);
    });
    // emoji表情按钮
    $(".fa.fa-smile-o").click(function(event) {
        event.stopPropagation();
        if ($(".emojiDiv").is(':visible')) {
            $(".emojiDiv").hide(500);
        } else {
            $(".emojiDiv").show(500);
        }
    });
    $(".emojiDiv > span").click(function(event) {
        event.stopPropagation();
        editor.replaceSelection($(this).html())
    });
    // 图片上传按钮
    $("#sendImg").click(function(event) {
        $(this).children('input')[0].click();
    });
    // 文件上传按钮
    $("#sendFileIcon").click(function(event) {
        $(document.getElementById('uploadIframe').contentWindow.document.body).find('[name=dir_id]').attr('value', userData.projectTeam['groupID']);
        $(document.getElementById('uploadIframe').contentWindow.document.body).find('[name=user_id]').attr('value', userData.userID);
        $(document.getElementById('uploadIframe').contentWindow.document.body).find('[name=upload_file]')[0].click();
    });
    $(".fa.fa-code").click(function(event) {
        if (!$(".codeView").is(':visible')) {
            $(".codeView").show(300);
        } else {
            {
                $(".codeView").hide(300);
            }
        }
    });
    $(".codeView > a").click(function(event) {
        editor.replaceSelection("##" + $(this).html() + "#\n\n" + "#" + $(this).html() + "##");
    });
    //左侧项目名称切换
    $('.left>ul').on('click', 'li', function(event) {
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
        var projectTeam = new Object();
        projectTeam['groupID'] = pID;
        projectTeam['groupName'] = $(this).children('span').html();
        userData.projectTeam = projectTeam;
        saveCurrentGroup(userData.userID, userData.projectTeam['groupID'])
        getProjectUsers(pID);
        var $fileListView = $(".fileListView")
        if ($(".showClass").attr('projectid') !== $fileListView.attr('currentPro') && !$fileListView.is(':hidden')) {
            getYunFile(pID, userData.userID, 1, 'create_time', 'desc');
        }
        var imgArr = $(".showMess[projectID=" + pID + "] .messContent img");
        var imgArrlength = imgArr.length;
        imgArr.each(function(index, el) {
            imgArrlength--;
            $(this)[0].onload = function() {
                this.onload = null;
                if (!imgArrlength) {
                    $('.showArea').scrollTop(_this.height());
                }
            };
        });
        $('.showArea').scrollTop(_this.height());
    })
    // 人员配置-项目组切换
    $(".editUser > div > select").change(function(event) {
        var pID = $(this).children('option:selected').val();
        showProUser(pID);
    });
    // 刷新所有成员
    $(".reUser").click(function(event) {
        var currentPID = $(".editUser > div > select").val();
        getWholeUser(function() {
            $(".editUser > div > select").val(currentPID);
            showProUser(currentPID);
        });
        $(".editUser > div > select").get(0).selectedIndex = 0;
    });
    // 增删项目组成员
    $(".editUser").delegate('.groupuser > a > label', 'click', function(event) {
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
            deleteUserInGroupApi(group, user, function() {
                _dom.removeAttr('loading');
                // if (groupID === currentGroupID) {
                //     getProjectUsers(currentGroupID);
                // }

                socket.emit("leaveUser", socketUser)
            });
        } else {
            addUserToGroupApi(group, user, function() {
                _dom.removeAttr('loading');
                // if (groupID === currentGroupID) {
                //     getProjectUsers(currentGroupID);
                // }
                socket.emit("inviteUser", socketUser)
            });
        }
    });
    //底部tab切换
    $('.tabArea>ul>li').click(function() {
        if ($(this).hasClass("tabActive")) {
            return false;
        }
        var taskName = $(this).attr('rel');
        $(this).addClass('tabActive').siblings().removeClass('tabActive');
        $('.' + taskName).show().css('display', 'inline-flex').siblings('.userView').hide();
        if (taskName === "fileListView") {
            var folderName = $(".showClass").attr('projectid');
            getYunFile(folderName, userData.userID, 1, 'create_time', 'desc');
        }
    })
    //设置窗口tab切换
    $('.setTitle ul li').click(function() {
        if ($(this).hasClass('setMenuActive')) {
            return;
        }
        $(this).addClass('setMenuActive').siblings().removeClass('setMenuActive');
        $('.setContent>div:eq(' + $(this).index() + ')').show().siblings().hide();
        if ($(this).attr('rel') === "userConfig") {
            if (!$(this).hasClass('userLoaded')) {
                getWholeUser(function() {
                    var currentPID = userData.projectTeam.groupID;
                    $(".editUser > div > select").val(currentPID);
                    showProUser(currentPID);
                });
                $(this).addClass('userLoaded');
            }
        }
    })
    // 关闭设置窗口
    $('.setWinClose').click(function() {
        $('.setWin').hide();
        $('.mask').hide();
    })
    //项目组选择
    $('.programmeUl ul').on('click', 'li', function(event) {
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
    $('.addPro').click(function() {
        var newPro = prompt('请输入新项目组名');
        if (newPro) {
            addProject(newPro);
        } else {
            alert('请输入正确的项目组名称');
        }
    })
    $(".proReflash").click(function(event) {
        reflashPro();
        $(".groupuser > a > input:checked").attr('checked', false);
    });
    //弹出设置对话框
    $('.set.config').click(function() {
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
    $(".signout").click(function(event) {
        helpMess({
            width: '200px',
            content: '您确定要注销吗？',
            okValue: '确 定',
            ok: function() {
                logout(userData.userID, function() {
                    $(window).unbind('beforeunload');
                    window.location.href = "/weare";
                })
            },
            cancelValue: '取消',
            cancel: function() {}
        })
    });
    // @成员
    $(".right > ul").delegate('li', 'click', function(event) {
        editor.replaceSelection('@' + $(this).children('span').html() + ' ')
        editor.focus();
    });
    // 对话列表的滚动监听
    $(".showArea").scroll(function(event) {
        var $showArea = $(this)
        if (!$(this).scrollTop()) {
            var $showClass = $(".showClass");
            var currentPage = parseInt($showClass.attr('currentPage'));
            currentPage++;
            var groupID = $showClass.attr('projectid');
            var preH = $showClass.height()
            getGroupMessages(groupID, currentPage, function(len) {
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
    $(".showArea").on('click', '.messContent > img', function(e) {
        e.preventDefault();

        var target = e.target;
        var imgSrc = target.currentSrc;
        var w = target.naturalWidth;
        var h = target.naturalHeight;
        showPhotoSwipeImgs(imgSrc, w, h);
    });

    /***************
     *  上传图片按钮监听事件 *
     ***************/
    $('#addImg').change(function(event) {
        var images = this.files;
        console.log(images);
        var fileCheck = true;
        $.each(images, function(index, val) {
            var pos = val.name.replace(/.+\./, "").toLowerCase();
            if ($.inArray(pos, imgArr) == -1) {
                fileCheck = false;
                helpMess({
                    content: "<span style='color:red'>" + val.name + "</span><br>不正确的后缀名！请选择正确的图片文件！",
                    okValue: '确 定',
                    ok: function() {}
                })
                return false;
            }
        });
        if (fileCheck) {
            $.each(images, function(index, val) {
                var objUrl = getObjectURL(val);
                var tempClass = getRandomID(userData.userID);
                var textAreaVal = '<img class="' + tempClass + '" src="' + objUrl + '"><article class="' + tempClass + 'imgLoading loading" style="width:100%;height:100%;position:absolute;top:0;left:0;background-color:#fff;"></article>';
                var _this = $('.showMess[projectID="' + userData.projectTeam.groupID + '"]');
                userData['messageType'] = 'img'
                userData['message'] = textAreaVal;
                sendMessages(0, userData, 0, _this, 0);
                $('.' + tempClass + 'imgLoading').mLoading(1);
                $("." + tempClass)[0].onload = function() {
                    $(this).removeClass(tempClass);
                    $('.showArea').scrollTop(_this.height());
                }
                var reader = new FileReader();
                userData['message'] = '<img src="{imgUrl}" class="messImg" onerror="imgOnfail(this)">';
                reader.onload = function(evt) {
                    socket.emit('sendImage', {
                        'name': val.name,
                        'segment': evt.target.result,
                        'size': val.size,
                        'user': userData,
                        'userflag': tempClass + 'imgLoading'
                    });
                };
                reader.readAsDataURL(val);
                if (index == images.length - 1) {
                    console.log("ok");
                    $('#addImg').val('');
                }
            });
        }
    });
    // 文件页码切换
    $(".filePage").delegate('.pageNum', 'click', function(event) {
        $(this).addClass('pageHit').siblings().removeClass('pageHit');
        var page = parseInt($(this).attr('pagenum'));
        var pID = $(".fileListView").attr('currentpro');
        getYunFile(pID, userData.userID, page, 'create_time', 'desc', 1);
    });
    $(".fileTableDiv").delegate('.sendFileMessage', 'click', function(event) {
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
    $("i.daily").click(function(event) {
        editor.replaceSelection("【项目名称】\n1、进度汇报\n\n2、任务问题讨论\n\n3、明天重点工作安排\n\n4、工作资源需求，或请假需求\n");
    });
    // 更改对话框高度
    var heightResizeCheck = false;
    $(".move-bar").mousedown(function(event) {
        heightResizeCheck = true;
        var currentY = event.pageY;
        var pH = parseInt($(".postArea").css('height'));
        $(document).mousemove(function(evt) {
            var realY = currentY - evt.pageY;
            pH += realY;
            $(".postArea").css('height', pH + 'px');
            currentY = evt.pageY;
        });
    });
    $(document).mouseup(function(event) {
        if (heightResizeCheck) {
            $(document).unbind('mousemove');
            heightResizeCheck = false;
        }
    });

    $("#textArea").click(function(event) {
        editor.focus();
    });




    var canPreviewType = ["png", "jpg", "gif", "bmp", "jpeg", "pdf", "mp4", "webm", "ogg"];
    var previewByPhotoSwipe = ["png", "jpg", "gif", "bmp", "jpeg"];
    var previewByVideo = ["mp4", "webm", "ogg"];
    // 双击对话框中文件的图标，预览资源
    $(".showArea").on("dblclick",".messageBlock .ico",function(e) {
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

    // 打开图片前预加载图片，获取图片尺寸
    function preloadImageForPhotoSwipe($this, imgPath) {
        console.log("preloadImg:" + imgPath);
        // 加载状态
        $this.before('<i class="img-loading fa fa-spinner fa-spin"></i>');

        var img = new Image();

        img.addEventListener("load", function() {
            // 显示图片
            showPhotoSwipeImgs(imgPath, this.width, this.height);

            $this.siblings(".img-loading").remove();
        }, false);
        // 图片加载失败
        img.addEventListener("error", function() {
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
        $modal.fadeIn(function() {
            $modal.css("display", "flex");
        });

        // 绑定关闭事件
        $modal.find(".modal-close").off("click").on("click", function() {
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
        $modal.fadeIn(function() {
            $modal.css("display", "flex");
        });

        // 绑定关闭事件
        $modal.find(".modal-close").off("click").on("click", function() {
            $modal.fadeOut();
        });
    }



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
})
