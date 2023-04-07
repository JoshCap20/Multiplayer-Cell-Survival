const WebSocket = require("ws");
const http = require("http");
const express = require("express");
const path = require("path");

const app = express();

app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

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
    cell.x = data.x;
    cell.y = data.y;
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
  let x = Math.random() * 800;
  let y = Math.random() * 600;

  return { x, y };
}

function generateFoodParticles() {
  const foodParticles = [];

  for (let i = 0; i < 100; i++) {
    const x = Math.random() * 800;
    const y = Math.random() * 600;

    foodParticles.push({ x, y });
  }

  return foodParticles;
}

function updateCell(cellId, data) {
    let cell = cells.get(cellId);
    if (cell) {
      const speedFactor = Math.max(0.2, 1 - (cell.radius - 10) / 100);
      cell.x += (data.x - cell.x) * speedFactor;
      cell.y += (data.y - cell.y) * speedFactor;
    }
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
