const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static("public"));

let players = {};

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);
  players[socket.id] = { x: 10, y: 10, direction: "right", snake: [{ x: 10, y: 10 }] };

  // Send current players to the new player
  socket.emit("currentPlayers", players);

  // Notify existing players about the new player
  socket.broadcast.emit("newPlayer", { id: socket.id, data: players[socket.id] });

  // Handle player movement
  socket.on("move", (data) => {
    if (players[socket.id]) {
      players[socket.id].direction = data.direction;
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit("removePlayer", socket.id);
  });
});

// Game loop to update snake positions
setInterval(() => {
  for (let id in players) {
    const player = players[id];
    const head = { ...player.snake[player.snake.length - 1] };

    // Update position based on direction
    if (player.direction === "up") head.y -= 1;
    if (player.direction === "down") head.y += 1;
    if (player.direction === "left") head.x -= 1;
    if (player.direction === "right") head.x += 1;

    // Add the new head
    player.snake.push(head);

    // Remove the tail to simulate movement
    player.snake.shift();
  }

  // Send updated positions to all players
  io.emit("update", players);
}, 100);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
