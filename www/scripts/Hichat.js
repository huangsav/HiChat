window.onload = function(){
    //init hichat
    var hichat = new HiChat();
    hichat.init();
};


//declare hichat class
var HiChat = function(){
    this.socket = null;
}

//add Business method
HiChat.prototype = {
    init: function(){//init program
        var that = this;
        //create socket to connect server
        this.socket = io.connect();
        //listen socket connect event, show us the connect event is successful.
        this.socket.on('connect', function(){
            //after connected service, show nickname input
            document.getElementById('info').textContent = 'get yourself a nickname :)';
            document.getElementById('nickWrapper').style.display = 'block';
            document.getElementById('nicknameInput').focus();
        });

        //setting nickname confirm button
        document.getElementById('loginBtn').addEventListener('click', function(){
            var nickName = document.getElementById("nicknameInput").value;
            //check nickname input is empty or not
            if(nickName.trim().length !=0){
                //not null and then send a login event to take the nickname to server
                that.socket.emit('login', nickName);
            } else {
                //or get the input wedget again
                document.getElementById('nicknameInput').focus();
            };
        }, false);
        
        this.socket.on('nickExisted', function(){
            document.getElementById('info').textContent = 'nickname is taken, choose another please.';
        });

        this.socket.on('loginSuccess', function(){
            document.title = 'hichat |' + document.getElementById('nicknameInput').value;
            document.getElementById('loginWrapper').style.display = 'none'; //hide login dialog
            document.getElementById('messageInput').focus();
        });

        this.socket.on('system', function(nickname, userCount, type){
            //judge the user connect or disconnect to show different information
            var msg = nickname + (type == 'login'?' joined':' left.');
            that._displayNewMsg('system', msg, 'red');
            document.getElementById('status').textContent = userCount + (userCount>1? ' users': ' user' + ' online.');
        });

        document.getElementById('sendBtn').addEventListener('click', function(){
            var messageInput = document.getElementById("messageInput"),
                msg = messageInput.value,
                color = document.getElementById('colorStyle').value;
            messageInput.value = '';
            messageInput.focus();
            if(msg.trim().length !=0){
                that.socket.emit('postMsg', msg, color); // post the message to service
                that._displayNewMsg('me', msg, color);//show the message on your window 
            };
        }, false);

        this.socket.on('newMsg', function(user, msg, color){
            that._displayNewMsg(user, msg, color);
        });

        document.getElementById('sendImage').addEventListener('change', function(){
            //check if there is a file was choosed.
            if(this.files.length != 0){
                //get files and read by FileReader
                var file = this.files[0],
                    reader = new FileReader();
                if(!reader){
                    that._displayNewMsg('system', 'your browser doesn\'t support fileReader!','red');
                    this.value = '';
                    return;
                }
                reader.onload = function(e){
                    //read successfully, show to the window and send to service
                    this.value = '';
                    that.socket.emit('img', e.target.result);
                    that._displayImage('me', e.target.result);
                };
                reader.readAsDataURL(file);
            }
        }, false);

        this.socket.on('newImg', function(user, img){
            that._displayImage(user, img);
        });

        this._initialEmoji();

        document.getElementById('emoji').addEventListener('click', function(e){
            var emojiwrapper = document.getElementById('emojiWrapper');
            emojiwrapper.style.display = 'block';
            e.stopPropagation();
        }, false);

        document.body.addEventListener('click', function(e){
            var emojiwrapper = document.getElementById('emojiWrapper');
            if(e.target != emojiwrapper){
                emojiwrapper.style.display = 'none';
            }
        });

        document.getElementById('emojiWrapper').addEventListener('click', function(e){
            //get the selected emoji
            var target = e.target;
            if(target.nodeName.toLowerCase() == 'img'){
                var messageInput = document.getElementById('messageInput');
                messageInput.focus();
                messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
            }
        }, false);

        document.getElementById('nicknameInput').addEventListener('keyup', function(e){
            if(e.keyCode == 13){
                var nickName = document.getElementById('nicknameInput').value;
                if(nickName.trim().length != 0){
                    that.socket.emit('login', nickName);
                }
            }
        }, false);

        document.getElementById('messageInput').addEventListener('keyup', function(e){
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value,
                color = document.getElementById('colorStyle').value;
            if(e.keyCode == 13 && msg.trim().length != 0){
                messageInput.value = '';
                that.socket.emit('postMsg', msg, color);
                that._displayNewMsg('me', msg, color);
            }
        }, false);
    },
    _displayNewMsg: function(user, msg, color){
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p');
            date = new Date().toTimeString().substr(0,8);
            msg = this._showEmoji(msg);
        msgToDisplay.style.color = color || '#000';
        msgToDisplay.innerHTML = '<span class="userspan">' + user + '</span>' + '<span class="timespan">(' + date + '): </span>' + msg;
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
    _displayImage: function(user, imgData, color){
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p');
            date = new Date().toTimeString().substr(0,8);
        msgToDisplay.style.color = color || '#000';
        msgToDisplay.innerHTML = '<span class="userspan">' + user + '</span>' + '<span class="timespan">(' + date + '): </span> <br/>' + '<a href="' + imgData + '" target="blank">'+
            '<img src="' + imgData + '"/></a>';
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
    _initialEmoji: function(){
        var emojiContainer = document.getElementById('emojiWrapper'),
            docFragment = document.createDocumentFragment();
        for(let i=69; i>0; i--){
            var emojiItem = document.createElement('img');
            emojiItem.src = '../content/emoji/' + i + '.gif';
            emojiItem.title = i;
            docFragment.appendChild(emojiItem);
        }
        emojiContainer.appendChild(docFragment);
    },
    _showEmoji: function(msg){
        var match, result = msg,
            reg = /\[emoji:\d+\]/g,
            emojiIndex,
            totalEmojiNum = document.getElementById('emojiWrapper').children.length;
        while (match = reg.exec(msg)){
            emojiIndex = match[0].slice(7,-1);
            if(emojiIndex > totalEmojiNum){
                result = result.replace(match[0], '[X]');
            } else{
                result = result.replace(match[0], '<img class="emoji" src="../content/emoji/' + emojiIndex + '.gif" />');
            }
        }
        return result;
    }
}
