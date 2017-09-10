var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session')({
    // genid: function(req) {
    //   return genuuid() // use UUIDs for session IDs
    // },
    secret: 'tesla',
    resave: true,
    saveUninitialized: true
});

var config = require('./config')
var routes = require('./routes/index');
var users = require('./routes/users');
var app = express();

var message = require('./routes/assets/socket/message')
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
io.use(function (socket, next) {
    session(socket.request, socket.request.res, next);
});
message.socketlisten(io);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(session);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/weare/tesla', express.static('public'));
app.use('/weare/userTx', express.static('userTx'));
app.use('/weare/img', express.static('tmp'));
app.use('/weare', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


// module.exports = app;
exports.app = app;
exports.server = server;
