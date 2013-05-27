var express = require("express"),
    app = express(),
    util = require("util"),
    debugMode = !debugMode,
    port = (process.env.PORT || 1337),
    io = require("socket.io").listen(app.listen(port));

app.set('views', __dirname + '/templates');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);

if(debugMode) app.use(logger);
app.use(express.static(__dirname +"/public"));

app.get('/', function(req,res) {
  res.render("chat", {layout: "layout"});
});

var Clients = function() {
  this.connected = {};
  this.length = 0;
};

Clients.prototype = {
  add: function(id,user) {
    this.connected[id] = user;
    ++this.length;
  },

  remove: function(id) {
    --this.length;
    delete this.connected[id];
  },

  getUser: function(id) {
    return this.connected[id];
  },

  getUsers: function() {
    var users = [], client;
    for(client in this.connected) {
      users.push(this.connected[client]);
    }
    return users;
  }
};

var clients = new Clients();

io.sockets.on('connection', function(socket) {
  if(clients.length !== 0) {
    io.sockets.emit("connected", {connected: true, users: clients.getUsers()});
  }

  socket.on("join", function(data) {
    if(data.message === "") {
     return socket.emit("error", {error: "Username can't be blank"});
    }
    
    if(clients.getUser(socket.id) === undefined) {
      clients.add(socket.id, data.message);
      io.sockets.emit('join', {
        message: "Welcome to chat!", 
        nickname: data.message, 
        users: clients.getUsers()
      });
    } else {
      socket.emit("error", {error: "Username already taken!"});
    }
  });

  socket.on('error', function(data) {
    //figure out what happens on error
  });

  socket.on("talk", function(data) {
    if(clients.getUser(socket.id) === undefined) {
      return socket.emit("error", {error: "Please enter a nickname to chat."});
    }

    io.sockets.emit("message", {message: clients.getUser(socket.id) + ": " + data.message});
  });

  socket.on("disconnect", function() {
    delete clients.remove(socket.id);

    if(clients.length !== 0) {
      io.sockets.emit("connected", {connected: true, users: clients.getUsers()});
    }
  });
});

console.log("App listening on port %d", port);

/* debug middleware */
function logger(req,res,next) {
  console.log("---------DEBUG INFORMATION---------");
  console.log("Request URL: %s", req.url);
  console.log("Request Method: %s", req.method);
  console.log("Request Query: " + util.inspect(req.query));
  console.log("Request Params: " + util.inspect(req.params));
  console.log("-------------END DEBUG------------");
  next();
}
