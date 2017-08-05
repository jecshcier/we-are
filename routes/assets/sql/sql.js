var mysql = require('mysql');
var moment = require('moment');
var config = require('../../../config');
var md5 = require('../lib/md5');
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config['db_config'].databaseName, config['db_config'].username, config['db_config'].password, config['db_config'].options);
var USER = require('./dbModual/yun_user')(sequelize, Sequelize);
var USER_GROUP = require('./dbModual/tesla_user_group')(sequelize, Sequelize);
var USER_GROUP_CONTENT = require('./dbModual/tesla_group_content')(sequelize, Sequelize);
var GROUP = require('./dbModual/tesla_group')(sequelize, Sequelize);
var uuid = require('node-uuid');
console.log(sequelize.fn('NOW'));
function logincheck(user, callback) {
    USER.findOne({
        attributes: [
            'id', 'password_salt', 'password', 'real_name', 'role_type'
        ],
        where: {
            'login_name': user.username
        }
    }).then(function(result) {
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
}
function getWholeProjectTeam(callback) {
    GROUP.findAll().then(function(result) {
        if (result) {
            callback(JSON.parse(JSON.stringify(result)));
        } else {
            callback(null);
        }
    })
}
function getProjectTeamByUser(userID, callback) {
    USER_GROUP.findAll({
        attributes: [
            'groupName', 'groupID'
        ],
        where: {
            'userID': userID
        }
    }).then(function(result) {
        if (result) {
            callback(JSON.parse(JSON.stringify(result)));
        } else {
            callback(null);
        }
    })
}
function deleteProjectTeamWithUser(userID, groupID, callback) {
    USER_GROUP.destroy({
        where: {
            'userID': userID,
            'groupID': groupID
        }
    }).then(function(result) {
        if (result) {
            callback(true);
        } else {
            callback(null);
        }
    })
}
function createProjectTeamWithUser(user, group, callback) {
    console.log(user);
    USER_GROUP.create({'userID': user.userID, 'userName': user.userName, 'groupID': group.groupID, 'groupName': group.groupName}).then(function(result) {
        var flag = JSON.stringify(result)
        if (flag) {
            callback(flag);
        } else {
            callback(null);
        }
    });
}
function createProject(groupID, groupName, userID, callback) {
    GROUP.create({'groupID': groupID, 'groupName': groupName, 'createUser': userID}).then(function(result) {
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
}
function getProjectUsers(groupID, callback) {
    USER_GROUP.findAll({
        attributes: [
            'userID', 'userName'
        ],
        where: {
            'groupID': groupID
        }
    }).then(function(result) {
        if (result) {
            callback(JSON.parse(JSON.stringify(result)));
        } else {
            callback(null);
        }
    })
}
function saveMessages(userData, callback) {
    USER_GROUP_CONTENT.create({
        'contentID':uuid.v1(),
        'groupID': userData.projectTeam["groupID"],
        'groupName': userData.projectTeam["groupName"],
        'userID': userData.userID,
        'userName': userData.userName,
        'message': userData.message,
        'updateTime': userData.updateTime
    }).then(function(result) {
        if (result) {
            callback(JSON.parse(JSON.stringify(result)));
        } else {
            callback(null);
        }
    });
}
function saveUserUpdateTime(userID, callback) {
    USER.update({
        'update_time': sequelize.fn('NOW')
    }, {
        where: {
            'id': userID
        }
    }).then(function(result) {
        if (result) {
            callback(JSON.parse(JSON.stringify(result)));
        } else {
            callback(null);
        }
    });
}
function updateGroupUserName(userID, userName, callback) {
    USER_GROUP.update({
        'userName': userName
    }, {
        where: {
            'userID': userID
        }
    }).then(function(result) {
        if (result) {
            callback(JSON.parse(JSON.stringify(result)));
        } else {
            callback(null);
        }
    });
}
function getGroupMessages(groupID, page, callback) {
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
    }).then(function(result) {
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
}
function getWholeUser(callback) {
    USER.findAll({
        attributes: ['id', 'real_name', 'login_name']
    }).then(function(result) {
        if (result) {
            callback(JSON.parse(JSON.stringify(result)));
        } else {
            callback(null);
        }
    })
}
exports.logincheck = logincheck;
exports.getWholeProjectTeam = getWholeProjectTeam;
exports.getProjectTeamByUser = getProjectTeamByUser;
exports.deleteProjectTeamWithUser = deleteProjectTeamWithUser;
exports.createProjectTeamWithUser = createProjectTeamWithUser;
exports.createProject = createProject;
exports.getProjectUsers = getProjectUsers;
exports.saveMessages = saveMessages;
exports.saveUserUpdateTime = saveUserUpdateTime;
exports.getGroupMessages = getGroupMessages;
exports.updateGroupUserName = updateGroupUserName;
exports.getWholeUser = getWholeUser;
