const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/admin', (req, res) => {
  res.render('admin');
});

app.get('/about', (req, res) => {
  res.render('about');
});

let currentTask = '';
let estimatesHidden = true;
let adminSocketId = null;
const users = {};

io.on('connection', (socket) => {
  socket.on('post-task', (task) => {
    currentTask = task;
    socket.broadcast.emit('new-task', task);
  });

  socket.on('admin-identify', () => {
    adminSocketId = socket.id;
  });

  socket.on('user-identify', (username) => {
    users[socket.id] = { username, estimate: null };
  });

  socket.on('submit-estimate', (estimate) => {
    users[socket.id].estimate = estimate;
    io.emit('new-estimate', { username: users[socket.id].username, estimate });
  });

  socket.on('reveal-estimates', () => {
    if (socket.id === adminSocketId) {
      estimatesHidden = !estimatesHidden;
      io.emit('reveal-estimates', estimatesHidden);
    }
  });

  socket.on('disconnect', () => {
    if (socket.id === adminSocketId) {
      adminSocketId = null;
    } else {
      delete users[socket.id];
    }
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
