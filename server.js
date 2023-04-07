const WebSocket = require("ws");
const http = require("http");
const express = require("express");
const path = require("path");

const app = express();

app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

const MAP_WIDTH = 500;
const MAP_HEIGHT = 500;

let cells = new Map();
let foodParticles = generateFoodParticles();

wss.on("connection", (ws) => {
  let cellId = createCellId();
  let spawnPoint = getRandomSpawnPoint();
  cells.set(cellId, {
    id: cellId,
    x: spawnPoint.x,
    y: spawnPoint.y,
    radius: 10,
  });
  console.log("new connection");
  ws.send(JSON.stringify({ type: "cellId", cellId }));
  ws.send(JSON.stringify({ type: "foodParticles", foodParticles }));

  ws.on("message", (message) => {
    let data = JSON.parse(message);
    switch (data.type) {
      case "update":
        updateCell(cellId, data);
        break;
      case "disconnect":
        cells.delete(cellId);
        break;
    }
  });

  ws.on("close", () => {
    cells.delete(cellId);
  });

  setInterval(() => {
    handleCollision(cells, foodParticles);
    consumeSmallerCells(cells);
    ws.send(
      JSON.stringify({
        type: "update",
        cells: Array.from(cells.values()),
        foodParticles,
      })
    );
  }, 1000 / 60);
});

function createCellId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function updateCell(cellId, data) {
    let cell = cells.get(cellId);
    if (cell) {
      const speedFactor = Math.max(0.2, 1 - (cell.radius - 10) / 100);
      const targetX = data.targetX;
      const targetY = data.targetY;
      const dx = targetX - cell.x;
      const dy = targetY - cell.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
  
      if (distance > 1) {
        const newX = cell.x + (dx / distance) * speedFactor;
        const newY = cell.y + (dy / distance) * speedFactor;
  
        // Keep the cell within the game map boundaries
        cell.x = Math.min(Math.max(newX, cell.radius), MAP_WIDTH - cell.radius);
        cell.y = Math.min(Math.max(newY, cell.radius), MAP_HEIGHT - cell.radius);
      }
    }
  }
  
  

function handleCollision(cells, foodParticles) {
  for (const cell of cells.values()) {
    for (const food of foodParticles) {
      const distance = Math.sqrt((cell.x - food.x) ** 2 + (cell.y - food.y) ** 2);

      if (distance < cell.radius) {
        foodParticles.splice(foodParticles.indexOf(food), 1);
        cell.radius += 1;
        break;
      }
    }
  }
}

function getRandomSpawnPoint() {
  let x = Math.random() * MAP_WIDTH;
  let y = Math.random() * MAP_HEIGHT;

  return { x, y };
}

function generateFoodParticles(amount = 100) {
  const foodParticles = [];

  for (let i = 0; i < amount; i++) {
    const x = Math.random() * MAP_WIDTH;
    const y = Math.random() * MAP_HEIGHT;

    foodParticles.push({ x, y });
  }

  return foodParticles;
}

  
  function consumeSmallerCells(cells) {
    const cellArray = Array.from(cells.values());
  
    for (const cellA of cellArray) {
      for (const cellB of cellArray) {
        if (cellA.id !== cellB.id) {
          const dx = cellA.x - cellB.x;
          const dy = cellA.y - cellB.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
  
          if (cellA.radius > cellB.radius && distance <= cellA.radius - cellB.radius) {
            cellA.radius += cellB.radius * 0.25;
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({ type: "cellConsumed", cell: cellB.id }));
                }
            });
            cells.delete(cellB.id);
          }
        }
      }
    }
  }

server.listen(8080, () => {
  console.log("Server listening on port 8080, connect to play");
  require('dns').lookup(require('os').hostname(), function (err, add, fam) {
    console.log('Play with anyone on your network: ' + add + ':8080');
  })
});

// generate more particles when there are less than 1000
// setInterval(() => {
//     if (foodParticles.length < 1000) {
//         foodParticles = generateFoodParticles(10000);
//     }
// }, 1000);

