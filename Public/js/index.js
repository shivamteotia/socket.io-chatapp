var socket = io.connect('http://localhost:3000/');
var jsonUsersClient = {};
var imageName;

function getClass(event) {
    imageName = $(event.target).attr('class');
}

var jsonClient = {
    "id": "",
    "name": ""
};
var clientHistory = {
    histories: []
};

$(document).ready(function () {
  

    var helpers = {
        startChat: function (event, eventArgs) {

            $(document)
                .unbind('click')
                .on("keyup", ".searchBar", function () {
                    var searchedElement = $(".searchBar").val()
                    if (searchedElement.length > 0) {
                        $(".result")
                            .filter(function () {
                                var string = $(this).text();
                                var result = new RegExp(searchedElement, "i");
                                var bool = result.test(string);
                                if (bool) {
                                    return $(this);
                                }
                                if (!bool) {
                                    console.log("no found");
                                    $(".result").hide();
                                }
                            })
                            .show();
                    } else {
                        $(".result").show();
                    }
                });

            if (($(event.target).hasClass("submit")) || ($(event.target).hasClass("loginText"))) {

                if ($('.user').val() == '') {
                    alert("Enter Username");
                } else {
                    var username = $('.user').val();

                    socket.emit('new user', {
                        "userName": $('.user').val(),
                        "imageName": imageName
                    }, function (data) {
                        if (data) {
                            jsonClient.id = socket.id;
                            jsonClient.name = username;
                            jsonClient.imageName = imageName;
                            rb(".mainContainer", "chatScreen", jsonClient, helpers);

                        } else if(!imageName) {
                            alert('Please Select An Avatar');
                        } else {
                            alert('Username Already Taken');
                        }
                    });
                    socket.on('jsonUsers', function (jsonUsers) {
                        jsonUsersClient = jsonUsers;
                        rb(".searchResults", "mainView", jsonUsersClient, helpers);
                        $.each(jsonUsersClient.users, function (key, val) {
                            if (val.id == socket.id) {
                                $('.name').each(function (i, j) {
                                    if (val.name == $(j).text()) {
                                        ($(this).parent()).remove();
                                    }
                                });
                            }
                        });
                    });
                    socket.on('newSingleUser', function (jsonSingleUser) {
                        $
                            .observable(jsonUsersClient.users)
                            .insert(jsonSingleUser);
                    });
                }
            }
        },
        //this function opens a specific user to chat with
        openUserToChat: function (event, eventArgs) {
            var clickedUser = eventArgs.linkCtx.data.name;
            var clickedUserId = eventArgs.linkCtx.data.id;
            
            if (!jsonClient[clickedUserId]) {
                jsonClient[clickedUserId] = [];
            }
            var clientHistory = {
                histories: jsonClient[clickedUserId]
            }
            var pos = (jsonUsersClient.users.findIndex(x => x.id == clickedUserId));
            $
                .observable(jsonUsersClient.users[pos])
                .setProperty("notifications", 0)
            $.each(jsonUsersClient.users, function (key, val) {
                if (val.name == clickedUser) {
                    makeTemplates();
                    rb(".userDetailContainer", "userDetail", val, helpers);
                    rb(".messages", "messagesContainer", clientHistory, helpers);
                    $('.messages').scrollTop($('.messages')[0].scrollHeight);
                }
            });
            socket.emit('seen', {
                "id": clickedUserId
            });

        },
        sendMessage: function (event, eventArgs) {
            if (($(event.target).hasClass("sendButton"))) {

                var message = $('.message').val();
                $('.message').val('');
                var id = eventArgs.linkCtx.data.id;
                if (!jsonClient[id]) {
                    jsonClient[id] = [];
                }
                $
                    .observable(jsonClient[id])
                    .insert({
                        "msg": message,
                        "flag": true,
                        "time": getTime(),
                        "status": 0
                    });
                $('.messages').scrollTop($('.messages')[0].scrollHeight);
                socket.emit('send message', {
                    "id": id,
                    "message": message
                });
            }
            socket.on('saw', function (data) {

                $.each(jsonClient[id], function (key, val) {
                    $
                        .observable(jsonClient[id][key])
                        .setProperty('status', 1);
                });
            });
        }
    };

    makeTemplates();
    rb(".mainContainer", "loginScreen", jsonUsersClient, helpers);
    for (var i = 1; i <= 12; i++) {
        $('.avatarContainer').append("<img class=" + i + " onclick='getClass(event)' src='../images/" + i + ".png'/>");

    }
    $('img').on('click', function () {
            $('img').css({
                'background-color': '',
                'border-radius': '',
                'border': '0.05rem solid white'
            });
            $(this).css({
                'background-color': 'black',
                'border-radius': '50%',
                'border': '0.05rem solid transparent'
            });
        }
    );

    socket.on("new message", function (data) {
        sender = data.sender;
        message = data.message;
        var currentOpenedUserId;
        $.each(jsonUsersClient.users, function (key, val) {
            if (val.name == $('.currentOpenedUser').text()) {
                currentOpenedUserId = val.id;
            }
        });
        if (currentOpenedUserId != sender) {
            var pos = (jsonUsersClient.users.findIndex(x => x.id == sender));
            var newNotifications = jsonUsersClient.users[pos].notifications + 1;

            $
                .observable(jsonUsersClient.users[pos])
                .setProperty("notifications", newNotifications);
        } else {
            socket.emit('seen', {
                "id": sender
            });
        }

        if (!jsonClient[sender]) {
            jsonClient[sender] = [];
        }
        $
            .observable(jsonClient[sender])
            .insert({
                "msg": message,
                "flag": false,
                "time": getTime()
            });

        if ($('div').hasClass(".messages")) {
            $('.messages').scrollTop($('.messages')[0].scrollHeight);
        }
    });

    socket.on('removeSingleUser', function (data) {
        console.log(data.id);
        if (jsonUsersClient.users.findIndex(x => x.id == data.id)) {
            var pos = (jsonUsersClient.users.findIndex(x => x.id == data.id));
            $
                .observable(jsonUsersClient.users)
                .remove(pos);
        }
    });
});



function getTime() {
    var dateObj = new Date();
    var hours = dateObj.getHours() > 12 ? dateObj.getHours() - 12 : dateObj.getHours();
    var am_pm = dateObj.getHours() >= 12 ? "PM" : "AM";
    hours = hours < 10 ? "0" + hours : hours;
    var minutes = dateObj.getMinutes() < 10 ? "0" + dateObj.getMinutes() : dateObj.getMinutes();
    newTime = hours + ":" + minutes + " " + am_pm
    return newTime;
}

function invokeClick(event) {
    if (event.keyCode == 13) {
        $(".sendButton").click();
    }
}

function invokeSubmit(event) {
    if (event.keyCode == 13) {
        $(".submit").click();
    }
}
