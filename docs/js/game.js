// ============================================================
// === Canvas 設定 ===
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ============================================================
// === 狀態管理 ===
// ============================================================
const STATE_START     = 'START';
const STATE_PLAYING   = 'PLAYING';
const STATE_GAME_OVER = 'GAME_OVER';

let gameState = STATE_START;

// ============================================================
// === 全域遊戲變數 ===
// ============================================================
const LANE_X        = [80, 240, 400];
const PLAYER_Y      = canvas.height * 3 / 4; // 525px

const initialSpeed    = 3;
const speedIncrement  = 0.5;
const maxSpeed        = 12;
const speedUpInterval = 300;

let score              = 0;
let frameCount         = 0;
let currentSpeed       = initialSpeed;
let framesSinceLastSpawn = 0;
let framesSinceLastCoin  = 0;
let obstacles          = [];
let coins              = [];

// ============================================================
// === 玩家 ===
// ============================================================
let player = {
  lane: 1,
  x:    LANE_X[1],
  y:    PLAYER_Y
};

function initPlayer() {
  player.lane = 1;
  player.x    = LANE_X[player.lane];
  player.y    = PLAYER_Y;
}

// ============================================================
// === 狀態轉換函式 ===
// ============================================================
function startGame() {
  // 隱藏開始 Overlay
  document.getElementById('startOverlay').style.display = 'none';

  // 初始化所有遊戲變數
  score              = 0;
  frameCount         = 0;
  currentSpeed       = initialSpeed;
  obstacles          = [];
  coins              = [];
  framesSinceLastSpawn = 0;
  framesSinceLastCoin  = 0;
  initPlayer();

  // 設定遊戲狀態為 PLAYING
  gameState = STATE_PLAYING;

  // 啟動 requestAnimationFrame 迴圈
  requestAnimationFrame(gameLoop);
}

function endGame() {
  // 停止迴圈更新
  gameState = STATE_GAME_OVER;

  // 顯示結束 Overlay 並寫入最終分數
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  document.getElementById('finalScore').textContent = '最終分數：' + score;
  gameOverOverlay.style.display = 'flex';
}

function resetGame() {
  // 隱藏遊戲結束 Overlay
  document.getElementById('gameOverOverlay').style.display = 'none';

  // 重置分數與狀態，重新開始
  startGame();
}

// ============================================================
// === 遊戲迴圈 ===
// ============================================================
function gameLoop(timestamp) {
  if (gameState !== STATE_PLAYING) return;

  update();
  render();

  requestAnimationFrame(gameLoop);
}

function update() {
  updateObstacles();
  updateCoins();
  spawnLogic();
  checkCollisions();

  // 速度遞增
  frameCount++;
  if (frameCount % speedUpInterval === 0 && currentSpeed < maxSpeed) {
    currentSpeed = Math.min(currentSpeed + speedIncrement, maxSpeed);
  }
}

// ============================================================
// === 障礙物 ===
// ============================================================
function spawnObstacles() {
  // 隨機排列三條跑道索引
  const lanes = [0, 1, 2].sort(() => Math.random() - 0.5);
  const count = Math.random() < 0.5 ? 1 : 2; // 1 或 2 條跑道有障礙物

  for (let i = 0; i < count; i++) {
    obstacles.push({
      lane:   lanes[i],
      y:      -canvas.height, // 開局緩衝距離
      width:  40,
      height: 30
    });
  }
}

function updateObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].y += currentSpeed;
    if (obstacles[i].y > canvas.height) {
      obstacles.splice(i, 1);
    }
  }
}

function spawnLogic() {
  // 障礙物：依速度動態調整生成間隔
  const spawnInterval = Math.floor((200 + (maxSpeed - currentSpeed) * 20) / currentSpeed);

  framesSinceLastSpawn++;
  if (framesSinceLastSpawn >= spawnInterval) {
    spawnObstacles();
    framesSinceLastSpawn = 0;
  }

  // 金幣：固定每 150 幀生成一枚（AC-4.1）
  framesSinceLastCoin++;
  if (framesSinceLastCoin >= 150) {
    spawnCoins();
    framesSinceLastCoin = 0;
  }
}

// ============================================================
// === 金幣 ===
// ============================================================
function spawnCoins() {
  const lane = Math.floor(Math.random() * 3);
  coins.push({
    lane:      lane,
    y:         -10,
    radius:    10,
    collected: false
  });
}

function updateCoins() {
  for (let i = coins.length - 1; i >= 0; i--) {
    coins[i].y += currentSpeed;
    if (coins[i].y > canvas.height || coins[i].collected) {
      coins.splice(i, 1);
    }
  }
}

// ============================================================
// === 碰撞判定 ===
// ============================================================
function checkCollisions() {
  const pLeft   = player.x - 15;
  const pRight  = player.x + 15;
  const pTop    = player.y - 20;
  const pBottom = player.y + 20;

  // 障礙物 AABB 碰撞
  for (let i = 0; i < obstacles.length; i++) {
    const obs     = obstacles[i];
    const obsLeft   = LANE_X[obs.lane] - obs.width  / 2;
    const obsRight  = LANE_X[obs.lane] + obs.width  / 2;
    const obsTop    = obs.y;
    const obsBottom = obs.y + obs.height;

    if (pRight > obsLeft && pLeft < obsRight &&
        pBottom > obsTop && pTop < obsBottom) {
      endGame();
      return;
    }
  }

  // 金幣距離碰撞
  const collectThreshold = 15 + 10; // 25px
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    const cx = LANE_X[coin.lane];
    const cy = coin.y;
    const dx = player.x - cx;
    const dy = player.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < collectThreshold) {
      coin.collected = true;
      score += 10;
    }
  }
}

// ============================================================
// === 渲染 ===
// ============================================================
function render() {
  drawBackground();
  drawLanes();
  drawCoins();
  drawObstacles();
  drawPlayer();
  drawHUD();
}

function drawBackground() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawLanes() {
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth   = 2;

  ctx.beginPath();
  ctx.moveTo(160, 0);
  ctx.lineTo(160, canvas.height);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(320, 0);
  ctx.lineTo(320, canvas.height);
  ctx.stroke();
}

function drawCoins() {
  ctx.fillStyle = '#FFD700';
  for (let i = 0; i < coins.length; i++) {
    const coin = coins[i];
    ctx.beginPath();
    ctx.arc(LANE_X[coin.lane], coin.y, coin.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawObstacles() {
  ctx.fillStyle = '#ef5350';
  for (let i = 0; i < obstacles.length; i++) {
    const obs = obstacles[i];
    ctx.fillRect(
      LANE_X[obs.lane] - obs.width  / 2,
      obs.y,
      obs.width,
      obs.height
    );
  }
}

function drawPlayer() {
  ctx.fillStyle = '#4fc3f7';
  ctx.fillRect(
    player.x - 15,
    player.y - 20,
    30,
    40
  );
}

function drawHUD() {
  ctx.shadowColor   = '#000000';
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.shadowBlur    = 3;

  ctx.fillStyle = '#FFFFFF';
  ctx.font      = 'bold 20px sans-serif';
  ctx.fillText('分數：' + score, 16, 32);

  // 重置陰影
  ctx.shadowColor   = 'transparent';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur    = 0;
}

// ============================================================
// === 輸入處理 ===
// ============================================================
function handleInput(event) {
  if (gameState !== STATE_PLAYING) return;

  if (event.key === 'ArrowLeft' && player.lane > 0) {
    player.lane--;
    player.x = LANE_X[player.lane];
  } else if (event.key === 'ArrowRight' && player.lane < 2) {
    player.lane++;
    player.x = LANE_X[player.lane];
  }
}

window.addEventListener('keydown', handleInput);

// ============================================================
// === 初始化 ===
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // 開始畫面顯示，結束畫面隱藏
  document.getElementById('startOverlay').style.display    = 'flex';
  document.getElementById('gameOverOverlay').style.display = 'none';

  // 按鈕事件綁定
  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('restartBtn').addEventListener('click', resetGame);
});
