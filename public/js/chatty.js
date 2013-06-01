(function(window) {
  var root = window;

  var Chat = root.Chatty = {
    start: function(opts) {
      return new Chatty(opts).connect();
    }
  }

  function Chatty(opts) {
    this.server = (opts && opts.server || "http://192.168.5.243:1337");
    this.socket = null;
    this.nickname = null;
    this.users = [];

    var chatty = this;

    var field = document.querySelector(".field");
    var send = document.querySelector(".send");
    var nick = document.getElementById("nickname");
    var join = document.getElementById("submit");

    send.onclick = function() {
      chatty.request("talk", field.value);
      field.value = "";
    };

    field.onkeypress = function(e) {
      if (event.which == 13 || event.keyCode == 13) {
        chatty.request("talk", field.value);
        field.value = "";
        return false;
      }
      return true;
    }

    join.onclick = function() {
      chatty.request("join", nick.value);
      nick.value = "";
    };

    return this;
  }

  function handleMessage(data) {
    if(data.message) {
      var chats = document.getElementById('chats');
      var chat = document.createElement("p");
      chat.innerHTML = data.message;
      chats.appendChild(chat);
    }
  }

  function handleError(data) {
    alert(data.error)
  }

  Chatty.prototype = {
    connect: function() {
      var self = this;

      this.socket = io.connect(this.server);
      this.socket.on('join', function(data) { self.handleJoin(data) });
      this.socket.on('connected', function(data) { self.handleConnect(data) });
      this.socket.on('message',function(data) { handleMessage(data) });
      this.socket.on('error',function(data) { handleError(data) });
    },

    request: function(evt, message) {
      this.socket.emit(evt, {message: message});
    },

    handleJoin: function(data) {
      if(data.message) {
       if(data.users.length !== this.users.length) {
         this.updateUsers(data.users);
       }
      }
      document.getElementById("join").remove();
    },

    handleConnect: function(data) {
      console.log(data)
      if(data.users.length !== this.users.length) {
        this.updateUsers(data.users);
      }
    },

    updateUsers: function(users) {
      this.users = users;
      var fragment = document.createDocumentFragment();
      var ul = document.createElement("ul");
      for(var i = 0;i<this.users.length;i++) {
        var li = document.createElement("li");
        li.innerHTML = this.users[i];
        ul.appendChild(li);
      }

      document.querySelector(".connected").innerHTML = "";
      document.querySelector(".connected").appendChild(fragment.appendChild(ul));
    }
  };

  return Chat.start();
}(window));
