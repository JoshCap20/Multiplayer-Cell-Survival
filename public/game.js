const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let cellId;
let cells = [];
let foodParticles = [];

const socket = new WebSocket("ws://localhost:8080");

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case "cellId":
      cellId = data.cellId;
      break;
    case "update":
      cells = data.cells;
      foodParticles = data.foodParticles;
      break;
    case "cellConsumed":
      if (cellId === undefined) return;
      if (data.cell === cellId) {
        alert("Game over!")
      }
    case "foodParticles":
      foodParticles = data.foodParticles;
      break;
  }
};

socket.onclose = () => {
  socket.send(JSON.stringify({ type: "disconnect" }));
};

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  socket.send(JSON.stringify({ type: "update", x, y }));
});

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const cell of cells) {
    if (cell.id === cellId) {
      ctx.fillStyle = "blue";
    } else {
      ctx.fillStyle = "red";
    }

    ctx.beginPath();
    ctx.arc(cell.x, cell.y, cell.radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
  }

  for (const food of foodParticles) {
    ctx.fillStyle = "green";
    ctx.beginPath();
    ctx.arc(food.x, food.y, 3, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
