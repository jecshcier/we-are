var mysql = require('mysql');
var moment = require('moment');
var config = require('../../../config');
var md5 = require('../lib/md5');

// connection.connect();
var connection;

function handleDisconnect() {
	connection = mysql.createConnection(config.userdb_config); // Recreate the connection, since
	// the old one cannot be reused.

	connection.connect(function(err) { // The server is either down
		if (err) { // or restarting (takes a while sometimes).
			console.log('error when connecting to db:', err);
			setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
		} // to avoid a hot loop, and to allow our node script to
		else {
			console.log("mysql 连接成功");
		}
	}); // process asynchronous requests in the meantime.
	// If you're also serving http, display a 503 error.
	connection.on('error', function(err) {
		console.log('db error', err);
		if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
			handleDisconnect(); // lost due to either server restart, or a
		} else { // connnection idle timeout (the wait_timeout
			throw err; // server variable configures this)
		}
	});
}



handleDisconnect();


function logincheck(user, callback) {
	connection.query('select password_salt,password,id,real_name from yun_user where login_name = "' + user.username + '"', function(err, rows, fields) {
		if (err) {
			console.log(err);
			throw err;
			callback(null);
		} else {
			if (rows[0]) {
				var password_salt = rows[0].password_salt;
				var password = rows[0].password;
				var userPassword = md5.hex(user.password + password_salt);
				if (password.match(userPassword)) {
					var userInfo = {
						userID: rows[0].id,
						nickName: rows[0].real_name
					}
					callback(userInfo);
				} else {
					callback(null);
				}
			}
		}

	});
}

exports.logincheck = logincheck;
