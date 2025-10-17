// signaling-server/server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Use a port from environment variables for deployment, fallback to 4000 for local dev
const PORT = process.env.PORT || 4000;

// In-memory storage for rooms and participants.
// In a production app, you might use Redis for this.
const rooms = {};

// Configure CORS to allow connections from your Next.js app
const io = new Server(server, {
  cors: {
    origin: '*', // For development. In production, change to your Vercel URL: "https://your-portfolio.vercel.app"
    methods: ['GET', 'POST'],
  },
});

app.get('/', (req, res) => {
  res.send('Signaling Server is running.');
});

io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // Event: A user wants to join a room
  socket.on('join-room', (roomId, participantId) => {
    console.log(`[${roomId}] 🚪 Client ${participantId} (${socket.id}) is joining.`);

    // Add the user to the room
    socket.join(roomId);

    // Initialize room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = {};
    }

    // Map participantId to socket.id for direct messaging
    rooms[roomId][participantId] = socket.id;

    // Get all other participants in the room
    const otherParticipants = Object.keys(rooms[roomId]).filter((id) => id !== participantId);
    console.log(`[${roomId}] 👥 Other participants:`, otherParticipants);

    // Announce the new user to everyone else in the room
    socket.to(roomId).emit('user-joined', participantId);

    // Send the list of existing participants to the new user
    socket.emit('existing-participants', otherParticipants);
  });

  // Event: Relay signals (offer, answer, candidate) to a specific user
  socket.on('relay-signal', (payload) => {
    const { receiverId, senderId, type, data, roomId } = payload;
    const receiverSocketId = rooms[roomId]?.[receiverId];

    if (receiverSocketId) {
      console.log(
        `[${roomId}] 📡 Relaying signal from ${senderId} to ${receiverId} (Type: ${type})`
      );
      io.to(receiverSocketId).emit('signal-received', { senderId, type, data });
    } else {
      console.warn(
        `[${roomId}] ⚠️ Could not find socket for receiver ${receiverId} in room ${roomId}`
      );
    }
  });

  // Event: A user is leaving or disconnecting
  const handleDisconnect = () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    // Find which room and participant this socket belonged to
    for (const roomId in rooms) {
      for (const participantId in rooms[roomId]) {
        if (rooms[roomId][participantId] === socket.id) {
          console.log(`[${roomId}] 👋 Participant ${participantId} has left.`);
          // Remove them from our mapping
          delete rooms[roomId][participantId];
          // Notify others in the room
          socket.to(roomId).emit('user-left', participantId);
          // If room is empty, clean it up
          if (Object.keys(rooms[roomId]).length === 0) {
            delete rooms[roomId];
            console.log(`[${roomId}] 🗑️ Room is now empty and has been cleaned up.`);
          }
          return;
        }
      }
    }
  };

  socket.on('leave-room', handleDisconnect);
  socket.on('disconnect', handleDisconnect);
});

server.listen(PORT, () => {
  console.log(`✅ Signaling server listening on port ${PORT}`);
});
