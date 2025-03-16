const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.get("/", (req, res) => {
    res.send("Anonymous Chat Server is Running!");
});

const waitingUsers = [];

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("find_match", (keyword) => {
        console.log(`User ${socket.id} is looking for match with keyword: ${keyword}`);

        const matchIndex = waitingUsers.findIndex(user => user.keyword === keyword);
        if (matchIndex !== -1) {
            const matchedUser = waitingUsers.splice(matchIndex, 1)[0];
            const room = `room-${matchedUser.id}-${socket.id}`;

            socket.join(room);
            matchedUser.socket.join(room);

            io.to(room).emit("match_found", { room, users: [matchedUser.id, socket.id] });

            console.log(`Matched ${matchedUser.id} with ${socket.id} in room ${room}`);
        } else {
            waitingUsers.push({ id: socket.id, keyword, socket });
        }
    });

    socket.on("send_message", ({ room, message }) => {
        io.to(room).emit("receive_message", { sender: socket.id, message });
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        const index = waitingUsers.findIndex(user => user.id === socket.id);
        if (index !== -1) waitingUsers.splice(index, 1);
    });
});

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});

