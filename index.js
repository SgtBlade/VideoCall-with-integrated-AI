require('dotenv').config();
const isDevelopment = (process.env.NODE_ENV === 'development');
const express = require('express');
const app = express();
const fs = require('fs');

let options = {};
if (isDevelopment) {
  options = {
    key: fs.readFileSync('./localhost.key'),
    cert: fs.readFileSync('./localhost.crt')
  };
}

const server = require(isDevelopment ? 'https' : 'http').Server(options, app);
const port = process.env.PORT || 443;

app.use(express.static('public'));

server.listen(port, () => {
 console.log(`App listening on port ${port}!`);
});

const io = require('socket.io')(server);

const clients = {};
io.on('connection', socket => {
  clients[socket.id] = { id: socket.id };

  socket.on('disconnect', () => {
    delete clients[socket.id];
    io.emit('clients', clients);
    io.emit('cient-disconnect', socket.id);
  });

  socket.on('userName', data => {
    clients[data.id] = {id: data.id, username: data.username};
    io.emit('clients', clients);
  })


  socket.on('chatMessage', messageObj => {
    io.to(messageObj.user.id).emit('chatMessage', messageObj);
  });

  socket.on('userRequest', (requestID, requestor) => {
    io.to(requestID).emit('userRequest', requestor)
  })

  socket.on('wakeUp', (user) => {
    io.to(user.id).emit('wakeUp', true)
  })

  socket.on('signal', (peerId, signal) => {
    //console.log(`Received signal from ${socket.id} to ${peerId}`);
    io.to(peerId).emit('signal', peerId, signal, socket.id);
  });

  io.emit('clients', clients);

});