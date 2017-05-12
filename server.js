//服务器及页面部分
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    users=[];//保存所有在线用户的昵称
app.use('/', express.static(__dirname + '/www'));
server.listen(8888);
//socket部分
io.on('connection', function(socket){
    socket.on('foo', function(data){
        console.log(data);
    });
    
    socket.on('login', function(nickname){
        if(users.indexOf(nickname) > -1){
            socket.emit('nickExisted');
        } else{
            socket.userIndex = users.length;
            socket.nickname = nickname;
            users.push(nickname);
            socket.emit('loginSuccess');
            io.sockets.emit('system', nickname, users.length, 'login'); //send this user's nickname to all client
        };
    });

    //disconnect event
    socket.on('disconnect', function(){
        //delete user from users
        users.splice(socket.userIndex, 1);
        socket.broadcast.emit('system', socket.nickname, users.length, 'logout');
    });

    socket.on('postMsg', function(msg, color){
        socket.broadcast.emit('newMsg', socket.nickname, msg, color);
    });

    socket.on('img', function(imgData){
        //send img data to other men by newImg
        socket.broadcast.emit('newImg', socket.nickname, imgData);
    });
});