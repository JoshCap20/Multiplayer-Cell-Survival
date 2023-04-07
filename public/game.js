const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let viewX = 0;
let viewY = 0;
let cellId;
let cells = [];
let foodParticles = [];
let mouseX = 0;
let mouseY = 0;
let playerCell;

const socket = new WebSocket("ws://localhost:8080");

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
        case "cellId":
            cellId = data.cellId;
            break;
        case "cellConsumed":
            if (cellId === undefined) return;
            if (data.cell === cellId) {
                displayMsg("You have been eaten!");
                socket.close();
            }
            break;
        case "foodParticles":
            foodParticles = data.foodParticles;
            break;
        case "update":
            cells = data.cells;
            
            playerCell = cells.find((cell) => cell.id === cellId);
            
            if (playerCell) {
                viewX = playerCell.x - canvas.width / 2;
                viewY = playerCell.y - canvas.height / 2;
            }
            
            foodParticles = data.foodParticles;
            renderGame();
            break;
    }
};

socket.onclose = () => {
    socket.send(JSON.stringify({ type: "disconnect" }));
    displayMsg("Disconnected from server");
};

socket.onerror = (error) => {
    console.log(`WebSocket error: ${error}`);
    displayMsg("Error connecting to server");
};

socket.onopen = () => {
    console.log("Connected to server");
    renderGame();
};

canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
  });

  setInterval(() => {
    if (playerCell) {
      const targetX = mouseX + viewX;
      const targetY = mouseY + viewY;
      socket.send(JSON.stringify({ type: "update", targetX, targetY }));
    }
  }, 1000 / 60);


function renderGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const cell of cells) {
        if (cell.id === cellId) continue; 

        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(cell.x - viewX, cell.y - viewY, cell.radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    }

    if (playerCell) {
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(
        playerCell.x - viewX,
        playerCell.y - viewY,
        playerCell.radius,
        0,
        2 * Math.PI
        );
        ctx.closePath();
        ctx.fill();
    }

    for (const food of foodParticles) {
        ctx.fillStyle = "green";
        ctx.beginPath();
        ctx.arc(food.x - viewX, food.y - viewY, 3, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    }

    requestAnimationFrame(renderGame);
}

function displayMsg(msg) {
    canvas.style.display = "none";
    const msgDiv = document.createElement("div");
    msgDiv.innerHTML = msg;
    document.body.appendChild(msgDiv);
}

