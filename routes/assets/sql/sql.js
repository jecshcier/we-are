const mysql = require('mysql');
const moment = require('moment');
const config = require('../../../config');
const md5 = require('../lib/md5');
const Sequelize = require('sequelize');
const sequelize = new Sequelize(config['db_config'].databaseName, config['db_config'].username, config['db_config'].password, config['db_config'].options);
const USER = require('./dbModual/yun_user')(sequelize, Sequelize);
const USER_GROUP = require('./dbModual/tesla_user_group')(sequelize, Sequelize);
const USER_GROUP_CONTENT = require('./dbModual/tesla_group_content')(sequelize, Sequelize);
const GROUP = require('./dbModual/tesla_group')(sequelize, Sequelize);
const uuid = require('node-uuid');
moment.locale('zh-cn');
console.log(sequelize.fn('NOW'));
module.exports = {
  logincheck: function (user, callback) {
    USER.findOne({
      attributes: [
        'id', 'password_salt', 'password', 'real_name', 'role_type'
      ],
      where: {
        'login_name': user.username
      }
    }).then(function (result) {
      if (!result) {
        console.log("未注册");
        callback(null);
      } else {
        console.log("账号正确");
        var password_salt = result.get('password_salt');
        var password = result.get('password');
        var userPassword = md5.hex(user.password + password_salt);
        var role_type = result.get('role_type');
        if (password.match(userPassword)) {
          var userInfo = {
            'userID': result.get('id'),
            'nickName': result.get('real_name'),
            'role_type': role_type
          }
          console.log(userInfo)
          callback(userInfo);
        } else {
          callback(null);
        }
      }
    });
  },
  getWholeProjectTeam: function (callback) {
    GROUP.findAll().then(function (result) {
      if (result) {
        callback(JSON.parse(JSON.stringify(result)));
      } else {
        callback(null);
      }
    })
  },
  getProjectTeamByUser: function (userID, callback) {
    USER_GROUP.findAll({
      attributes: [
        'groupName', 'groupID'
      ],
      where: {
        'userID': userID
      }
    }).then(function (result) {
      if (result) {
        callback(JSON.parse(JSON.stringify(result)));
      } else {
        callback(null);
      }
    })
  },
  deleteProjectTeamWithUser: function (userID, groupID, callback) {
    USER_GROUP.destroy({
      where: {
        'userID': userID,
        'groupID': groupID
      }
    }).then(function (result) {
      if (result) {
        callback(true);
      } else {
        callback(null);
      }
    })
  },
  createProjectTeamWithUser: function (user, group, callback) {
    console.log(user);
    USER_GROUP.create({
      'userID': user.userID,
      'userName': user.userName,
      'groupID': group.groupID,
      'groupName': group.groupName
    }).then(function (result) {
      var flag = JSON.stringify(result)
      if (flag) {
        callback(flag);
      } else {
        callback(null);
      }
    });
  },
  createProject: function (groupID, groupName, userID, callback) {
    GROUP.create({'groupID': groupID, 'groupName': groupName, 'createUser': userID}).then(function (result) {
      console.log(JSON.stringify(result));
      if (result) {
        var flag = {
          ok: false,
          commont: '',
          data: JSON.parse(JSON.stringify(result))
        };
        callback(flag);
      } else {
        callback(null);
      }
    });
  },
  getProjectUsers: function (groupID, callback) {
    USER_GROUP.findAll({
      attributes: [
        'userID', 'userName'
      ],
      where: {
        'groupID': groupID
      }
    }).then(function (result) {
      if (result) {
        callback(JSON.parse(JSON.stringify(result)));
      } else {
        callback(null);
      }
    })
  },
  saveMessages: function (userData, callback) {
    USER_GROUP_CONTENT.create({
      'contentID': uuid.v1(),
      'groupID': userData.projectTeam["groupID"],
      'groupName': userData.projectTeam["groupName"],
      'userID': userData.userID,
      'userName': userData.userName,
      'message': userData.message,
      'updateTime': userData.updateTime
    }).then(function (result) {
      if (result) {
        callback(JSON.parse(JSON.stringify(result)));
      } else {
        callback(null);
      }
    });
  },
  saveUserUpdateTime: function (userID, callback) {
    USER.update({
      'update_time': sequelize.fn('NOW')
    }, {
      where: {
        'id': userID
      }
    }).then(function (result) {
      if (result) {
        callback(JSON.parse(JSON.stringify(result)));
      } else {
        callback(null);
      }
    });
  },
  updateGroupUserName: function (userID, userName, callback) {
    USER_GROUP.update({
      'userName': userName
    }, {
      where: {
        'userID': userID
      }
    }).then(function (result) {
      if (result) {
        callback(JSON.parse(JSON.stringify(result)));
      } else {
        callback(null);
      }
    });
  },
  getGroupMessages: function (groupID, page, callback) {
    console.log(page)
    page = parseInt(page) * 10;
    USER_GROUP_CONTENT.findAll({
      attributes: [
        'groupID', 'userID', 'userName', 'message', 'updateTime'
      ],
      order: 'updateTime DESC',
      where: {
        'groupID': groupID
      },
      offset: page,
      limit: 10
    }).then(function (result) {
      if (result) {
        var data = JSON.parse(JSON.stringify(result));
        console.log('长度:' + data.length);
        for (var i = data.length - 1; i >= 0; i--) {
          data[i].updateTime = moment(data[i].updateTime).format('YYYY-MM-DD HH:mm:ss');
        }
        callback(data);
      } else {
        callback(null);
      }
    })
  },
  getWholeUser: function (callback) {
    USER.findAll({
      attributes: ['id', 'real_name', 'login_name']
    }).then(function (result) {
      if (result) {
        callback(JSON.parse(JSON.stringify(result)));
      } else {
        callback(null);
      }
    })
  },
  getUserDaily: (flag) => {
    return new Promise(function (resolve, reject) {
      let info = new config.callbackModel()
      let latestTime = ''
      if (flag === 'latest') {
        USER_GROUP_CONTENT.findOne({
          attributes: [
            'updateTime'
          ],
          where: {
            'groupID': 'ca803f69b8f5b77586d9a0c9d81215a1'
          },
          order: 'updateTime DESC'
        }).then((result) => {
          if (result) {
            let dataArr = JSON.parse(JSON.stringify(result))
            let nowTime = dataArr.updateTime
            latestTime = dataArr.updateTime
            let lTime = moment(nowTime).subtract(1, 'w').format('YYYY-MM-DD HH:mm:ss')
            return USER_GROUP_CONTENT.findAll({
              attributes: [
                'groupID', 'userID', 'userName', 'message', 'updateTime'
              ],
              order: 'updateTime ASC,userName ASC',
              where: {
                'groupID': 'ca803f69b8f5b77586d9a0c9d81215a1',
                'updateTime': {
                  $lte: nowTime,
                  $gte: lTime
                }
              }
            })
          }
          else {
            info.message = "暂无数据"
            info.data = null
            resolve(info)
            return false
          }
        }, (err) => {
          info.message = "数据库查询失败" + err
          reject(info)
          return false
        }).then((result) => {
          if (result) {
            let dataArr = JSON.parse(JSON.stringify(result))
            let data = {}
            dataArr.forEach((el, index) => {
              let date = moment(el.updateTime).format('YYYY-MM-DD-dddd')
              if (!data.hasOwnProperty(date)) {
                data[date] = {}
              }
              if (!data[date].hasOwnProperty(el.userName)) {
                let obj = data[date]
                // 获取当天0点的秒数
                let atime = moment(el.updateTime).format('YYYY-MM-DD')
                atime = moment(atime).unix()
                // 获取当天的时间
                let btime = moment(el.updateTime).unix()
                // 计算差值，即获得了当天的时间换算成的秒数
                obj[el.userName] = {
                  time: btime - atime,
                  mess: el.message
                }
              }
            })
            console.log(data)
            info.latestTime = moment(latestTime).format('YYYY-MM-DD HH:mm:ss')
            info.flag = true
            info.message = "获取成功"
            info.data = data
            resolve(info)
          }
          else {
            info.flag = false
            info.message = "没有数据"
            info.data = null
            resolve(info)
          }
        }, (err) => {
          info.message = '数据库连接错误' + err
          reject(info)
        })
      }
      else {

      }
    })
  }
}
