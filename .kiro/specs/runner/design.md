# 三線跑酷遊戲 — 技術設計文件

## 1. 系統架構概覽

### 1.1 架構說明

本遊戲採用純前端單頁面應用架構（SPA），無需任何後端伺服器、API 或資料庫。所有遊戲邏輯、渲染與狀態管理皆在使用者瀏覽器端的 JavaScript 中執行。入口為單一 `index.html`，以 HTML5 Canvas 作為主要渲染介面，全部程式碼不依賴任何外部框架或函式庫，符合 AC-1.5 及 AC-6.6 的純瀏覽器執行要求。

### 1.2 檔案結構

```
docs/
├── index.html          # 遊戲入口：HTML 骨架、Canvas 元素、Overlay div
├── css/
│   └── style.css       # 畫面版面、Overlay 樣式、字型設定
└── js/
    └── game.js         # 全部遊戲邏輯（狀態機、迴圈、渲染、輸入）
```

### 1.3 各檔案職責

| 檔案 | 職責 |
|------|------|
| `docs/index.html` | 定義 HTML 結構：`<canvas>` 畫布、開始畫面 Overlay div、遊戲結束 Overlay div；引入 CSS 與 JS |
| `docs/css/style.css` | 設定頁面背景色、Canvas 置中、Overlay 定位（`position: absolute`）及按鈕樣式 |
| `docs/js/game.js` | 實作所有遊戲邏輯：狀態機、遊戲迴圈、玩家、障礙物、金幣、碰撞判定、渲染、輸入處理 |

---

## 2. 遊戲狀態機

### 2.1 狀態定義

遊戲共有三個互斥狀態，以字串常數表示：

| 狀態常數 | 值 | 說明 |
|----------|----|------|
| `STATE_START` | `'START'` | 遊戲尚未開始，顯示開始畫面 Overlay |
| `STATE_PLAYING` | `'PLAYING'` | 遊戲進行中，迴圈持續更新與渲染 |
| `STATE_GAME_OVER` | `'GAME_OVER'` | 碰撞發生後，遊戲停止，顯示結束畫面 Overlay |

```
                  點擊「開始遊戲」
    ┌──────────┐ ───────────────► ┌─────────────┐
    │  START   │                  │   PLAYING   │
    └──────────┘                  └─────────────┘
          ▲                              │
          │    點擊「重新開始」           │ 角色碰撞障礙物
          │                              ▼
          │                       ┌─────────────┐
          └────────────────────── │  GAME_OVER  │
                                  └─────────────┘
```

### 2.2 狀態轉換邏輯

- **START → PLAYING**：玩家點擊「開始遊戲」按鈕，呼叫 `startGame()`，隱藏開始 Overlay，初始化所有遊戲變數，啟動 `requestAnimationFrame` 迴圈（AC-5.1、AC-5.2）。
- **PLAYING → GAME_OVER**：`checkCollisions()` 偵測到角色與障礙物碰撞，呼叫 `endGame()`，停止迴圈更新，顯示結束 Overlay 並寫入最終分數（AC-5.3、AC-5.6）。
- **GAME_OVER → PLAYING**：玩家點擊「重新開始」按鈕，呼叫 `resetGame()`，重置所有狀態並重新啟動迴圈（AC-5.4、AC-5.5）。

---

## 3. Canvas 渲染設計

### 3.1 畫布規格

| 屬性 | 值 |
|------|----|
| 寬度 | `480px` |
| 高度 | `700px` |
| HTML 元素 | `<canvas id="gameCanvas" width="480" height="700">` |

畫布在 CSS 中以 `display: block; margin: auto;` 水平置中，背景色設為深灰或深藍。

### 3.2 遊戲迴圈

使用 `requestAnimationFrame` 驅動主迴圈，確保渲染與螢幕刷新率同步，避免卡頓（AC-6.3）：

```
gameLoop(timestamp)
  │
  ├─ 若狀態非 PLAYING → 直接返回
  ├─ update()   ← 更新所有遊戲物件位置、計算速度遞增、執行碰撞判定
  └─ render()   ← 清除畫布並依序繪製所有層次
       └─ requestAnimationFrame(gameLoop)  ← 遞迴呼叫維持迴圈
```

### 3.3 渲染層次順序

每幀依以下順序繪製，確保前景物件不被後景覆蓋（AC-1.3、AC-1.4）：

1. **背景**：填充純色矩形（深灰 `#1a1a2e`）覆蓋整個畫布
2. **跑道線**：三條垂直分隔線標示跑道邊界
3. **金幣**：金黃色小圓形，位於跑道上
4. **障礙物**：紅色矩形，位於跑道上
5. **角色**：藍色矩形，固定 Y 座標
6. **HUD**：左上角文字顯示分數（最後繪製確保不被遮蔽）

---

## 4. 三條跑道佈局

### 4.1 跑道 X 軸座標

畫布寬度 480px，將其均分為六等份，跑道中心點落在奇數等份位置：

| 跑道索引 | 計算公式 | 結果（X 像素） |
|----------|----------|----------------|
| 0（左）  | `canvas.width / 6 * 1` | `80px` |
| 1（中）  | `canvas.width / 6 * 3` | `240px` |
| 2（右）  | `canvas.width / 6 * 5` | `400px` |

跑道中心 X 座標存於陣列 `LANE_X = [80, 240, 400]`，角色與物件的 X 座標皆取自此陣列。

### 4.2 角色 Y 軸固定位置

角色固定於畫面下方 3/4 處：

```
PLAYER_Y = canvas.height * 3 / 4   // = 525px
```

### 4.3 跑道視覺呈現

以兩條垂直線分隔三條跑道（X = 160px 及 X = 320px），線條顏色為半透明白色（`rgba(255,255,255,0.2)`），配合整體視覺風格（AC-1.1）。

---

## 5. 玩家角色設計

### 5.1 幾何外觀

角色以填充矩形表示，顏色為藍色（`#4fc3f7`），不使用任何外部圖片（AC-1.4）：

| 屬性 | 值 |
|------|----|
| 寬度 | `30px` |
| 高度 | `40px` |
| 繪製基準 | 以角色中心點為基準：`x = LANE_X[player.lane] - 15`，`y = PLAYER_Y - 20` |

### 5.2 跑道記錄

玩家物件儲存目前所在跑道索引：

```js
player = {
  lane: 1,   // 0=左, 1=中, 2=右；初始位於中間跑道（AC-5.5）
  x: 0,      // 由 LANE_X[player.lane] 計算得出
  y: 525     // PLAYER_Y，固定值
}
```

### 5.3 跑道切換

按下方向鍵後直接更新 `player.lane`，並立即以 `LANE_X[player.lane]` 更新 `player.x`，無緩動動畫，確保操作即時反應（AC-2.1～AC-2.6、AC-6.4）。

### 5.4 碰撞盒（AABB）

角色碰撞判定使用軸對齊包圍盒（Axis-Aligned Bounding Box）：

```
left   = player.x - 15
right  = player.x + 15
top    = player.y - 20
bottom = player.y + 20
```

---

## 6. 障礙物系統

### 6.1 物件結構

```js
{
  lane:   0 | 1 | 2,   // 所在跑道索引
  y:      number,       // 畫布上的 Y 座標（初始為負值，由畫面頂端進入）
  width:  40,           // 固定寬度（px）
  height: 30            // 固定高度（px）
}
```

障礙物以紅色矩形（`#ef5350`）繪製，X 座標 = `LANE_X[obstacle.lane] - obstacle.width / 2`。

### 6.2 陣列管理

所有畫面上的障礙物存於全域陣列 `obstacles[]`，每幀 `update()` 中遍歷並更新 `y += currentSpeed`；`y > canvas.height` 時從陣列移除（AC-3.4）。

### 6.3 生成規則

- 使用計數器 `framesSinceLastSpawn` 追蹤距上次生成的幀數。
- 達到 `spawnInterval`（見第 9 節）時觸發一批新障礙物生成。
- 每批隨機選擇 1 或 2 條跑道放置障礙物，確保至少保留一條空跑道（AC-3.2）：
  1. 產生三條跑道的隨機排列。
  2. 取前 1 或 2 條（最多 2 條）放置障礙物。
  3. 其餘跑道保持空白。
- 遊戲開始時初始緩衝距離：首批障礙物 `y` 初始值設為 `-canvas.height`，確保玩家有足夠反應時間（AC-3.5）。

---

## 7. 金幣系統

### 7.1 物件結構

```js
{
  lane:      0 | 1 | 2,  // 所在跑道索引
  y:         number,      // 畫布上的 Y 座標
  radius:    10,          // 半徑（px）
  collected: false        // 是否已被收集
}
```

金幣以金黃色實心圓（`#FFD700`）繪製，圓心 X 座標 = `LANE_X[coin.lane]`。

### 7.2 陣列管理

所有畫面上的金幣存於全域陣列 `coins[]`，每幀 `update()` 中更新 `y += currentSpeed`；`y > canvas.height` 或 `collected === true` 時從陣列移除（AC-4.5）。

### 7.3 收集邏輯

金幣碰撞後立即執行（AC-4.2、AC-4.3）：
1. 標記 `coin.collected = true`。
2. 從 `coins[]` 陣列移除。
3. 執行 `score += 10`（每枚金幣 10 分）。
4. 分數變更即時反映於 HUD（同幀 `render()` 中更新）。

### 7.4 生成規則

金幣與障礙物使用獨立計數器，每隔固定幀數（如 `150 幀`）在隨機一條跑道上生成一枚金幣，生成 Y 座標初始值為 `-10`（從畫面頂端進入）（AC-4.1）。

---

## 8. 速度遞增設計

### 8.1 速度參數

| 參數 | 值 |
|------|----|
| 初始速度 `initialSpeed` | `3 px/frame` |
| 每次增量 `speedIncrement` | `0.5 px/frame` |
| 速度上限 `maxSpeed` | `12 px/frame` |
| 加速間隔 `speedUpInterval` | `300 幀` |

### 8.2 加速邏輯

```js
// 每幀 update() 末端執行
frameCount++;
if (frameCount % speedUpInterval === 0 && currentSpeed < maxSpeed) {
    currentSpeed = Math.min(currentSpeed + speedIncrement, maxSpeed);
}
```

速度以 `300 幀`為單位逐步遞增，每次僅增加 `0.5px/frame`，確保難度循序漸進（AC-6.1、AC-6.2）。

---

## 9. 障礙物生成間距設計

### 9.1 動態間距公式

生成間距（幀數）隨當前速度動態調整，速度越快、間距越小，但仍確保玩家有足夠反應時間（AC-6.2）：

```
spawnInterval（幀）= Math.floor((200 + (maxSpeed - currentSpeed) * 20) / currentSpeed)
```

### 9.2 各速度對應間距範例

| 當前速度（px/frame） | 生成間距（幀） | 約等於畫布高度倍數 |
|----------------------|----------------|--------------------|
| 3 | `≈ 93 幀` | 約 279px |
| 6 | `≈ 53 幀` | 約 318px |
| 9 | `≈ 29 幀` | 約 261px |
| 12 | `≈ 16 幀` | 約 192px |

間距換算為像素距離 ≈ `spawnInterval × currentSpeed`，玩家從障礙物出現到抵達位置有充分時間反應（AC-3.2、AC-6.2）。

---

## 10. HUD（畫面顯示資訊）

### 10.1 分數顯示

HUD 在每幀 `render()` 最後繪製，確保顯示於所有遊戲物件上方（AC-4.3、AC-4.4）：

| 屬性 | 值 |
|------|----|
| 位置 | 左上角，`x = 16px`，`y = 32px` |
| 文字格式 | `「分數：` + score + `」` |
| 字體 | `bold 20px sans-serif` |
| 顏色 | `#FFFFFF`（白色） |
| 陰影顏色 | `#000000`（黑色），偏移 `1px 1px`，模糊 `3px` |

陰影使分數在各種背景色上均清晰可讀。

---

## 11. 遊戲畫面覆蓋層（Overlay）

### 11.1 HTML 結構

Overlay 以 `<div>` 實作，絕對定位覆蓋於 Canvas 上方，遊戲進行時以 `display: none` 隱藏（AC-5.1、AC-5.2、AC-5.3、AC-5.4）：

```html
<!-- 開始畫面 Overlay -->
<div id="startOverlay">
  <h1>三線跑酷</h1>
  <button id="startBtn">開始遊戲</button>
</div>

<!-- 遊戲結束 Overlay -->
<div id="gameOverOverlay">
  <h1>遊戲結束</h1>
  <p id="finalScore">最終分數：0</p>
  <button id="restartBtn">重新開始</button>
</div>
```

### 11.2 CSS 定位

Overlay div 使用 `position: absolute`，相對於包裝容器（`position: relative`）定位，精確覆蓋 Canvas 區域；內容以 Flexbox 垂直置中排列。

### 11.3 顯示切換邏輯

| 狀態 | `startOverlay` | `gameOverOverlay` |
|------|----------------|-------------------|
| `START` | `display: flex` | `display: none` |
| `PLAYING` | `display: none` | `display: none` |
| `GAME_OVER` | `display: none` | `display: flex` |

---

## 12. 鍵盤輸入處理

### 12.1 事件監聽

在 `window` 上監聽 `keydown` 事件，於 `game.js` 初始化時掛載一次：

```js
window.addEventListener('keydown', handleInput);
```

### 12.2 輸入處理邏輯

```
handleInput(event)
  │
  ├─ 若 gameState !== STATE_PLAYING → 忽略，直接返回（AC-5.6）
  ├─ ArrowLeft：
  │    若 player.lane > 0 → player.lane--，更新 player.x（AC-2.1、AC-2.4）
  └─ ArrowRight：
       若 player.lane < 2 → player.lane++，更新 player.x（AC-2.2、AC-2.5）
```

- 每次操作僅移動一條跑道（AC-2.3）。
- 邊界檢查在移動前執行，確保 `lane` 不小於 0 或大於 2（AC-2.4、AC-2.5）。
- 位置更新即時生效，下一幀渲染即可看到新位置（AC-2.6、AC-6.4）。

---

## 13. 碰撞判定

### 13.1 角色碰撞盒

以角色中心點為基準，定義 AABB：

```
left   = player.x - 15   // 中心點 - 寬/2
right  = player.x + 15   // 中心點 + 寬/2
top    = player.y - 20   // 中心點 - 高/2
bottom = player.y + 20   // 中心點 + 高/2
```

角色碰撞盒尺寸：寬 `30px`、高 `40px`。

### 13.2 障礙物碰撞判定（AABB vs AABB）

障礙物碰撞盒以物件左上角為起點：

```
obsLeft   = LANE_X[obs.lane] - obs.width / 2   // = LANE_X - 20
obsRight  = LANE_X[obs.lane] + obs.width / 2   // = LANE_X + 20
obsTop    = obs.y
obsBottom = obs.y + obs.height
```

AABB 重疊判定（兩盒在 X 與 Y 軸上均重疊即視為碰撞，AC-3.3、AC-6.5）：

```js
if (player.right > obsLeft &&
    player.left  < obsRight &&
    player.bottom > obsTop &&
    player.top    < obsBottom) {
    endGame();
}
```

### 13.3 金幣碰撞判定（圓形距離）

以角色中心點與金幣中心點之距離判定（AC-4.2）：

```js
dx = player.x - coin.x;
dy = player.y - coin.y;
distance = Math.sqrt(dx * dx + dy * dy);
collectThreshold = 15 + coin.radius;   // 角色寬/2 + 金幣半徑 = 15 + 10

if (distance < collectThreshold) {
    // 收集金幣
}
```

### 13.4 判定時機

`checkCollisions()` 在每幀 `update()` 中執行，保證判定與視覺位置同步（AC-6.5）。

---

## 14. 模組職責分配（game.js 區塊結構）

由於不使用模組系統，`game.js` 以區塊註解分隔以下邏輯，每個區塊職責明確：

```
// ============================================================
// === 狀態管理 ===
// ============================================================
// 遊戲狀態常數定義（STATE_START, STATE_PLAYING, STATE_GAME_OVER）
// 狀態變數 gameState
// startGame(), endGame(), resetGame() 函式

// ============================================================
// === 遊戲迴圈 ===
// ============================================================
// requestAnimationFrame 主迴圈 gameLoop()
// frameCount 計數器
// 速度遞增邏輯

// ============================================================
// === 玩家 ===
// ============================================================
// player 物件定義（lane, x, y）
// 跑道座標陣列 LANE_X
// initPlayer() 初始化函式

// ============================================================
// === 障礙物 ===
// ============================================================
// obstacles[] 陣列
// spawnObstacles() 生成函式
// updateObstacles() 每幀移動並移除超出邊界者
// spawnInterval 動態計算

// ============================================================
// === 金幣 ===
// ============================================================
// coins[] 陣列
// spawnCoins() 生成函式
// updateCoins() 每幀移動並移除超出邊界者

// ============================================================
// === 碰撞判定 ===
// ============================================================
// checkCollisions() 函式
// AABB vs AABB 障礙物碰撞邏輯
// 圓形距離金幣收集邏輯

// ============================================================
// === 渲染 ===
// ============================================================
// render() 主渲染函式
// drawBackground() 背景
// drawLanes() 跑道線
// drawCoins() 金幣
// drawObstacles() 障礙物
// drawPlayer() 角色
// drawHUD() 分數 HUD

// ============================================================
// === 輸入處理 ===
// ============================================================
// handleInput(event) keydown 監聽回呼
// 方向鍵邏輯與邊界檢查
```

---

## 15. 驗收條件對應表

| 驗收條件 | 對應設計章節 |
|----------|--------------|
| AC-1.1 三條跑道顯示 | §3、§4 |
| AC-1.2 角色可見 | §5 |
| AC-1.3 障礙物持續移動 | §3.2、§6 |
| AC-1.4 簡單幾何圖形 | §3.3、§5.1、§6.1、§7.1 |
| AC-1.5 無需外掛 | §1.1 |
| AC-2.1～AC-2.6 角色控制 | §12 |
| AC-3.1～AC-3.5 障礙物系統 | §6 |
| AC-4.1～AC-4.6 金幣與分數 | §7、§10 |
| AC-5.1～AC-5.6 開始與重啟 | §2、§11 |
| AC-6.1～AC-6.2 速度遞增 | §8、§9 |
| AC-6.3 渲染穩定 | §3.2 |
| AC-6.4 輸入即時反應 | §12 |
| AC-6.5 碰撞準確性 | §13 |
| AC-6.6 瀏覽器相容性 | §1.1 |
