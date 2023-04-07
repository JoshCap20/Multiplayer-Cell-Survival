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
                alert("Game over!");
            }
            break;
        case "foodParticles":
            foodParticles = data.foodParticles;
            break;
        case "update":
            cells = data.cells;
            foodParticles = data.foodParticles;

            if (!playerCell) {
                playerCell = cells.find((cell) => cell.id === cellId);
            }

            if (playerCell) {
                viewX = playerCell.x - canvas.width / 2;
                viewY = playerCell.y - canvas.height / 2;
            }

            renderGame();
            break;
    }
};

socket.onclose = () => {
    socket.send(JSON.stringify({ type: "disconnect" }));
};

socket.onopen = () => {
    console.log("connected to server");
    renderGame();
};

canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;

    const targetX = mouseX + viewX;
    const targetY = mouseY + viewY;

    if (playerCell) {
        const dx = targetX - playerCell.x;
        const dy = targetY - playerCell.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const speedFactor = Math.max(0.2, 1 - (playerCell.radius - 10) / 100);

        if (distance > 1) {
            playerCell.x += (dx / distance) * speedFactor;
            playerCell.y += (dy / distance) * speedFactor;
        }
    }

    socket.send(JSON.stringify({ type: "update", x: playerCell.x, y: playerCell.y }));
});





function renderGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const cell of cells) {
        if (cell.id === cellId) continue; // Skip the local player's cell

        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(cell.x - viewX, cell.y - viewY, cell.radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    }

    // Draw the local player's cell
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



