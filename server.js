var express = require('express');
var app = express();
var path = require('path');
var server = require('http').Server(app);
var io = require('socket.io')(server);
const port = process.env.PORT || 3000;
var jsonUsers = {
    "users": []
};

server.listen(port);

app.use(express.static(path.join(__dirname, 'Public')));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/Public/views/index.html');
});

io.on('connection', function (socket) {


    socket.on('new user', function (data, callback) {
        if ((jsonUsers.users.findIndex(x => x.name == data.userName) != -1)) {
            callback(false);
        } else if (!data.imageName) {
            callback(false);
        } else {
            callback(true);
            socket.userName = data.userName;
            socket.imageName = data.imageName;
            console.log(data.imageName);
            console.log(socket.imageName);
            var us = jsonUsers.users;
            us.push({
                "id": socket.id,
                "imageName": socket.imageName,
                "name": socket.userName,
                "notifications": 0
            });
            console.log(socket.id);
            socket.emit('jsonUsers', jsonUsers);
            socket.broadcast.emit('newSingleUser', {
                "id": socket.id,
                "name": socket.userName,
                "imageName": socket.imageName,
                "notifications": 0
            });

        }

    });



    socket.on('send message', function (data) {
        var sender = socket.id;
        var receiver = data.id;
        var message = data.message;

        socket.to(receiver).emit('new message', {
            "sender": sender,
            "message": message,

        });
    });

    socket.on('seen', function (data) {
        var receiver = data.id;

        socket.to(receiver).emit('saw', {
            "status": 1

        });

    });

    socket.on('disconnect', function (data) {

        var pos = (jsonUsers.users.findIndex(x => x.id == socket.id));
        if (pos < 0) {
            console.log(pos);
        } else {
            console.log(pos);
            jsonUsers.users.splice(pos, 1);

            io.emit('removeSingleUser', {
                "id": socket.id
            });
        }

    });
});