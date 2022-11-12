const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require("cors");
const io = new Server(server);
const { json } = require("body-parser");

app.use(json());
app.use(cors());
app.use(express.static("public"))

// {id: '23', socketId: '', text: '', users: ['name1', 'name2']}
const rooms = [];

app.get("/", (req, res) => {
  res.send({ msg: "hello world" });
});

io.on("connection", (socket) => {
  socket.on("CODE_CHANGED", async ({ value: code, roomId }) => {
    const room = rooms.find((room) => room.id === roomId);
    if (!room) return;
    room.text = code;
    const roomName = `ROOM:${roomId}`
    // io.emit('CODE_CHANGED', code)
    socket.to(roomName).emit('CODE_CHANGED', {code})
  });

  socket.on("CONNECTED_TO_ROOM", async ({ roomId, userName }) => {
    let room = rooms.find((room) => room.id === roomId);
    if (!room) {
      room = {
        id: roomId,
        socketId: socket.id,
        users: [userName],
        text: "",
      };
      rooms.push(room);
    } else {
      room.users.push(userName);
    }
    const roomName = `ROOM:${room.id}`;
    socket.join(roomName);
    io.in(roomName).emit("ROOM:CONNECTION", room.users);
    socket.emit("START", { code: room.text, users: room.users });
  });

  socket.on("DISSCONNECT_FROM_ROOM", async ({ roomId, username }) => {
    let room = rooms.find((room) => room.id === roomId);
    if (!room || !room.users) return;
    const index = room.users.findIndex((user) => user === username);
    room.users.splice(index, 1);
    const roomName = `ROOM:${room.id}`;
    io.in(roomName).emit("DISSCONNECT_FROM_ROOM", room.users);
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
