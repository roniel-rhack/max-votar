const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index', {users: users});
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
        estimatesHidden = true;
        currentTask = task;
        socket.broadcast.emit('new-task', task);
    });

    socket.on('admin-identify', () => {
        currentTask = '';
        adminSocketId = socket.id;
    });

    socket.on('user-identify', (user) => {
        users[socket.id] = user;
        io.emit('load-cards', users);
        if(currentTask !== ''){
            socket.broadcast.emit('new-task', currentTask);
        }
    });

    socket.on('submit-estimate', (estimate) => {
        if (users[socket.id]) {
            users[socket.id].estimate = estimate;
            io.emit('new-estimate', users[socket.id]);
        }
    });

    socket.on('reveal-estimates', () => {
        if (socket.id === adminSocketId) {
            estimatesHidden = false;
            io.emit('reveal-estimates', users);
            currentTask = '';
        }
    });

    socket.on('clear-estimates', () => {
        for (let user in users) {
            users[user].estimate = null;
        }
        io.emit('load-cards', users);
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
