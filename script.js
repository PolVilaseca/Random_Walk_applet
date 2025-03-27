// --- Global Settings ---
let gridSize = 20;
let totalCells = gridSize * gridSize;
const FIXED_GRID_DIMENSION_PX = 500;
const UPDATE_INTERVAL_MS = 50;

// --- DOM Elements ---
const gridContainer = document.getElementById('grid-container');
const playButton = document.getElementById('play-button');
const pauseButton = document.getElementById('pause-button');
const stepButton = document.getElementById('step-button');
const resetButton = document.getElementById('reset-button');
const gridSizeInput = document.getElementById('grid-size-input');
const chartCanvas = document.getElementById('visited-chart');
const chartContainer = document.getElementById('chart-container');

// --- Simulation State ---
let gridState = [];
let walkerPos = { x: 0, y: 0 };
let simulationIntervalId = null;
let isRunning = false;

// --- Chart State (Chart.js) ---
let visitedChart = null;
let stepCount = 0;
let visitedCount = 0;
let chartData = { labels: [], percentages: [] };
const MAX_CHART_POINTS = 2000;

// --- Initialization ---

function initializeGrid(newSize) {
    const validatedSize = Math.max(2, Math.min(200, newSize || parseInt(gridSizeInput.value, 10) || 20));
    gridSize = validatedSize;
    totalCells = gridSize * gridSize;
    gridSizeInput.value = gridSize;
    console.log(`Initializing grid with size: ${gridSize}x${gridSize}`);

    const cellSizePx = FIXED_GRID_DIMENSION_PX / gridSize;
    console.log(`Calculated cell size: ${cellSizePx}px`);

    gridContainer.innerHTML = '';
    gridState = [];
    gridContainer.style.width = `${FIXED_GRID_DIMENSION_PX}px`;
    gridContainer.style.height = `${FIXED_GRID_DIMENSION_PX}px`;
    gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, ${cellSizePx}px)`;
    gridContainer.style.gridTemplateRows = `repeat(${gridSize}, ${cellSizePx}px)`;

    for (let y = 0; y < gridSize; y++) {
        gridState[y] = [];
        for (let x = 0; x < gridSize; x++) {
            gridState[y][x] = false;
            const cell = document.createElement('div');
            cell.classList.add('cell', 'unvisited');
            cell.id = `cell-${x}-${y}`;
            cell.style.width = `${cellSizePx}px`;
            cell.style.height = `${cellSizePx}px`;
            gridContainer.appendChild(cell);
        }
    }

    // Keep simple chart height calculation
    const gridHeightWithBorder = FIXED_GRID_DIMENSION_PX + 2;
    const chartHeight = Math.max(150, Math.round(gridHeightWithBorder / 2));
    chartContainer.style.height = `${chartHeight}px`;


    walkerPos.x = Math.floor(Math.random() * gridSize);
    walkerPos.y = Math.floor(Math.random() * gridSize);
    stepCount = 0;
    visitedCount = 0;

    updateWalkerVisual();
    initializeChart(); // Re-initialize chart

    chartData.labels.push(0);
    chartData.percentages.push(0.0);
    if (visitedChart) { visitedChart.update(); }

    console.log(`Walker starting at: (${walkerPos.x}, ${walkerPos.y})`);

    playButton.disabled = false;
    pauseButton.disabled = true;
    stepButton.disabled = false;
    resetButton.disabled = false;
    gridSizeInput.disabled = false;
}

// --- Chart.js Functions ---

function initializeChart() {
    if (visitedChart) { visitedChart.destroy(); visitedChart = null; }
    chartData.labels = []; chartData.percentages = [];
    const ctx = chartCanvas.getContext('2d');
    if (!ctx) { console.error("Failed to get canvas context"); return; }

    visitedChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Visited Cells (%)',
                data: chartData.percentages,
                borderColor: 'rgb(255, 99, 132)', // Red
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderWidth: 1.5, fill: true, tension: 0.1, pointRadius: 0, pointHitRadius: 5
            }]
        },
        options: {
            scales: { x: { title: { display: true, text: 'Time Step' }, min: 0 },
                      y: { title: { display: true, text: 'Percentage (%)' }, min: 0, max: 100, beginAtZero: true } },
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Keep legend disabled
                }
            },
            // --- Add Internal Layout Padding ---
            layout: {
                padding: {
                    bottom: 25 // Add 25px padding inside the chart area at the bottom (adjust as needed)
                }
            }
            // --- End Layout Padding ---
        }
    });
    console.log("Chart.js initialized.");
}

function updateChartData() {
    if (!visitedChart) return;
    let percentage = (visitedCount / totalCells) * 100;
    chartData.labels.push(stepCount);
    chartData.percentages.push(percentage); // Push the number
    if (chartData.labels.length > MAX_CHART_POINTS) { chartData.labels.shift(); chartData.percentages.shift(); }
    visitedChart.update();
}

// --- Simulation Logic (No changes) ---
function performStepLogic() {
    const previousCell = document.getElementById(`cell-${walkerPos.x}-${walkerPos.y}`);
    const wasVisitedBefore = gridState[walkerPos.y][walkerPos.x];
    gridState[walkerPos.y][walkerPos.x] = true;
    if (!wasVisitedBefore) { visitedCount++; }
    const moves = [ { dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 } ];
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    let nextX = (walkerPos.x + randomMove.dx + gridSize) % gridSize;
    let nextY = (walkerPos.y + randomMove.dy + gridSize) % gridSize;
    if (previousCell) { previousCell.classList.remove('walker', 'unvisited'); previousCell.classList.add('visited'); }
    walkerPos.x = nextX; walkerPos.y = nextY;
    updateWalkerVisual();
    stepCount++;
    updateChartData();
}
function step() { if (!isRunning) return; performStepLogic(); }

// --- Visual Updates (Grid - No changes) ---
function updateWalkerVisual() {
    const walkerCell = document.getElementById(`cell-${walkerPos.x}-${walkerPos.y}`);
     if (walkerCell) { walkerCell.classList.remove('unvisited', 'visited'); walkerCell.classList.add('walker'); }
}

// --- Control Functions (No changes) ---
function playSimulation() {
    if (!isRunning) {
        isRunning = true;
        simulationIntervalId = setInterval(step, UPDATE_INTERVAL_MS);
        playButton.disabled = true; pauseButton.disabled = false; stepButton.disabled = true; resetButton.disabled = true; gridSizeInput.disabled = true;
        console.log("Simulation Started");
    }
}
function pauseSimulation() {
    if (isRunning) {
        isRunning = false;
        clearInterval(simulationIntervalId); simulationIntervalId = null;
        playButton.disabled = false; pauseButton.disabled = true; stepButton.disabled = false; resetButton.disabled = false; gridSizeInput.disabled = false;
        console.log("Simulation Paused");
    }
}
function singleStep() {
    if (!isRunning) {
        performStepLogic();
        playButton.disabled = false; pauseButton.disabled = true; stepButton.disabled = false; resetButton.disabled = false; gridSizeInput.disabled = false;
        console.log("Single Step Performed");
    }
}
function resetSimulation() {
    pauseSimulation();
    const newSize = parseInt(gridSizeInput.value, 10);
    initializeGrid(newSize);
    console.log("Simulation Reset");
}

// --- Event Listeners (No changes) ---
playButton.addEventListener('click', playSimulation);
pauseButton.addEventListener('click', pauseSimulation);
stepButton.addEventListener('click', singleStep);
resetButton.addEventListener('click', resetSimulation);

// --- Initial Setup ---
initializeGrid(parseInt(gridSizeInput.value, 10));
