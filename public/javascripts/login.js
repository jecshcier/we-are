/************************
 * 登录模块js               *
 * author: Shayne C     *
 * updateTime: 2017.4.1 *
 ************************/

$(function () {
  
  setTimeout(function () {
    console.log('ok');
    // $(".activity").css('opacity', '0');
    $(".loginBg").css('opacity', '1');
  }, 0);
  
  $(".updateUserName").click(function (e) {
  
  })
  
  $('#loginBtn').hover(function () {
    $('#loginBtn').css('background-color', '#1ECD97');
    $(".loginBtn svg path").css('stroke', '#fff');
  }, function () {
    $('#loginBtn').css('background-color', '#202020');
    $(".loginBtn svg path").css('stroke', '#171717');
  }).click(function () {
    if (!$(this).is(':animated') && !$(".cross").is(':animated') && !$(".tick").is(':animated')) {
      if ($(".loginBg input").eq(0).val() && $(".loginBg input").eq(1).val().length > 5) {
        var username = $(".loginBg input").eq(0).val();
        var password = $(".loginBg input").eq(1).val();
        login(username, password);
      } else {
        event.preventDefault();
        shake($("#loginBtn"));
      }
    }
  });
})

$(document).keydown(function (event) {
  if (event.keyCode == 13) {
    $('#loginBtn').trigger('click');
  }
});

// 登录 skydisk
function login(username, password) {
  $.ajax({
    url: '/weare/login',
    type: 'post',
    dataType: 'json',
    data: {
      'username': username,
      'password': password
    },
  })
    .done(function (data) {
      if (data.flag) {
        if (data.flag === 1) {
          inputUserName(data.data)
          return
        }
        console.log("success");
        location.href = "/weare/chat";
      }
      else {
        alert(data.message)
        shake($("#loginBtn"));
      }
    })
    .fail(function () {
      alert('用户管理系统未响应 或 用户管理系统坏了！')
      shake($("#loginBtn"));
    });
}

function shake(_this) {
  $(".loginBtn svg path").css('stroke', '#fff');
  $('#loginBtn').css('background-color', '#FB797E');
  $(".tick").hide();
  $('.cross').show();
  $('#loginBtn').addClass('shake animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
    $(this).removeClass('shake animated');
    $('#loginBtn').css('background-color', '#202020');
    $(".loginBtn svg path").css('stroke', '#171717');
    $('.cross').fadeOut('500', function () {
      $(".tick").fadeIn(500, function () {
      });
    });
  });
  
  
}

function inputUserName(user) {
  var token = user.token;
  var userID = user.userID;
  var key = user.key
  $(".userName > button").attr('token', token)
  $(".userName > button").attr('userid', userID)
  $(".userName > button").attr('key', key)
  $(".loginBg").css('opacity', '0')
  $(".userName").show()
}

function updateUserName(_this) {
  console.log(_this)
  var token = $(_this).attr('token');
  var userID = $(_this).attr('userid')
  console.log(token)
  $.ajax({
    url: '/weare/login/updateUserInfo',
    type: 'post',
    dataType: 'json',
    data: {
      'userId': userID,
      'nickName': $(".userName > div").eq(0).children('input').val(),
      'realName': $(".userName > div").eq(1).children('input').val(),
      'token': token
    }
  }).done(function (data) {
    if (data.flag) {
      alert("更新成功")
      $(".loginBg").css('opacity', '1')
      $(".userName").hide()
    } else {
      alert(data.message)
    }
    
  }).fail(function () {
    alert('用户管理系统未响应 或 用户管理系统坏了！')
    shake($("#loginBtn"));
  });
}

// 登录 tesla私有暂不使用
// function login(username, password) {
// 	$.ajax({
// 			url: 'login',
// 			type: 'post',
// 			dataType: 'json',
// 			data: {
// 				'username': username,
// 				'password': $.md5(password)
// 			},
// 		})
// 		.done(function() {
// 			console.log("success");
// 			location.href = "chat";
// 		})
// 		.fail(function() {
// 			console.log("账号或密码错误");
// 			shake('loginBtn');
// 		});
// }
