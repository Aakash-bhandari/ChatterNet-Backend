import express from 'express';
import { Server as SocketIOServer } from "socket.io";
import Connection from './db/db.js';
import cors from 'cors';
import dotenv from 'dotenv'
dotenv.config();
import { router as userRoutes } from './routes/userRoutes.js';
import { router as chatRoutes } from './routes/chatRoutes.js';
import { router as messageRoutes } from './routes/messageRoutes.js';
import upload from './utils/upload.js';
import { UploadImage, getImage } from './controllers/imageControllers.js';
const app = express();
app.use(cors());
app.use(express.json()); // to accept json data



app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

app.post("/file/upload", upload.single("file"), UploadImage);
app.get("/file/:filename", getImage);

///591
const PORT = process.env.PORT;
const server = app.listen(PORT , (req, res) => {
    console.log("Server is Listening on port 8000");
})

const io = new SocketIOServer(server, {
    pingTimeout: 6000,
    cors: {
        origin: "http://localhost:3000",
    }

});
const GuestUsersInRooms = {}
io.on("connection", (socket) => {
    // console.log("Connected to socket.io");
    socket.on("setup", (userData) => {
        socket.join(userData._id);
        socket.emit("connected");
    });

    socket.on("join chat", (roomID) => {
        socket.join(roomID);
        io.to(roomID).emit("user:joined", { id: socket.id });
        console.log(`user joined ${roomID}`);
    })


    socket.on("typing", (roomId) => {
        socket.in(roomId).emit("typing")
    })

    socket.on("stop typing", (roomId) => {
        socket.in(roomId).emit("stop typing")
    })
    socket.on("new message", (newMessageReceived) => {
        var chat = newMessageReceived.chat;
        if (!chat.users) return;

        chat.users.forEach(user => {
            if (user._id == newMessageReceived.sender._id) return;
            socket.in(user._id).emit("message received", newMessageReceived);
        });
    })

    socket.off("setup", () => {
        console.log("USER DISCONNECTED");
        socket.leave(userData._id);
    });

    
    ///////Guest Mode Task///////////////
    socket.on("join as guest", (room, name) => {
        socket.join(room);
        if (!GuestUsersInRooms[room]) {
            GuestUsersInRooms[room] = [];
        }
        GuestUsersInRooms[room].push({ id: socket.id, name: name });
        io.to(room).emit('update users', GuestUsersInRooms[room]);
        io.to(room).emit('latest user', name);
    })

    socket.on("send_message", (data) => {
        socket.to(data.room).emit("receive_message", data);
    });

    //////

    socket.on("user:call", ({ to, offer }) => {
        socket.to(to).emit('incoming:call', { from: socket.id, offer });
    })

    socket.on("call:accepted", ({ to, ans }) => {
        socket.to(to).emit('call:accepted', { from: socket.id, ans });

    })
    socket.on("call:declined",({to})=>{
        socket.to(to).emit('call:declined', { from: socket.id, msg:"Call declined by the user" });
    })
    socket.on("peer:nego:needed", ({ offer, to }) => {
        socket.to(to).emit("peer:nego:needed", { from: socket.id, offer });
    })
    socket.on("peer:nego:done",({to,ans})=>{
        socket.to(to).emit("peer:nego:final", { from: socket.id, ans });
    })
    ////






    socket.on("leave group", ({ name, roomID }) => {
        try {
            if (GuestUsersInRooms != {}) {
                GuestUsersInRooms[roomID] = GuestUsersInRooms[roomID].filter(user => user.name !== name);
            }
            io.to(roomID).emit('update users', GuestUsersInRooms[roomID]);
            io.to(roomID).emit('user leaved', name);
        } catch (error) {
            console.error("Error handling leave group event:", error);
        }
    });

    socket.on("disconnect", () => {
        for (const room in GuestUsersInRooms) {
            const userIndex = GuestUsersInRooms[room].findIndex(user => user.id === socket.id);
            if (userIndex != -1) {
                var name = GuestUsersInRooms[room][userIndex].name;
                io.to(room).emit('user leaved', name);
            }
            GuestUsersInRooms[room] = GuestUsersInRooms[room].filter(user => user.id !== socket.id);
            io.to(room).emit('update users', GuestUsersInRooms[room]);
        }
        console.log("User Disconnected", socket.id);
    });
})
Connection();