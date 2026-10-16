# Implementation Plan: 三線跑酷遊戲

## Overview

純前端三線跑酷遊戲，採用 HTML5 Canvas 渲染，所有檔案置於 `docs/` 目錄下。實作分為十一個任務群組，從基礎骨架依序推進至整合驗收，每個群組均可獨立測試。

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1"],
      "description": "建立專案基礎結構"
    },
    {
      "wave": 2,
      "tasks": ["2"],
      "description": "遊戲狀態機與 Overlay 控制（依賴任務 1）"
    },
    {
      "wave": 3,
      "tasks": ["3"],
      "description": "Canvas 渲染基礎（依賴任務 2）"
    },
    {
      "wave": 4,
      "tasks": ["4", "6", "7", "9"],
      "description": "玩家角色、障礙物系統、金幣系統、HUD 分數顯示（均依賴任務 3，可並行）"
    },
    {
      "wave": 5,
      "tasks": ["5"],
      "description": "鍵盤輸入處理（依賴任務 4）"
    },
    {
      "wave": 6,
      "tasks": ["8"],
      "description": "碰撞判定（依賴任務 4、6、7、9）"
    },
    {
      "wave": 7,
      "tasks": ["10"],
      "description": "速度遞增（依賴任務 8）"
    },
    {
      "wave": 8,
      "tasks": ["11"],
      "description": "整合測試與驗收（依賴所有前置任務）"
    }
  ]
}
```

## Tasks

- [x] 1. 建立專案基礎結構
  - [x] 1.1. 建立 `docs/` 目錄與 `docs/index.html`，包含 `<canvas id="gameCanvas" width="480" height="700">`、開始畫面 Overlay div（含「開始遊戲」按鈕）、遊戲結束 Overlay div（含最終分數文字與「重新開始」按鈕），並引入 CSS 與 JS 檔案
  - [x] 1.2. 建立 `docs/css/style.css`，設定頁面背景色、Canvas 水平置中（`display: block; margin: auto`）、Overlay 絕對定位覆蓋 Canvas、Flex 垂直置中內容、按鈕基本樣式
  - [x] 1.3. 建立 `docs/js/game.js` 骨架，以區塊註解劃分各邏輯區段，宣告所有全域變數：`gameState`、`player`、`obstacles`、`coins`、`score`、`currentSpeed`、`frameCount`、`LANE_X`、`PLAYER_Y` 等常數
  _Requires: AC-1.1, AC-1.5, AC-6.6_

- [x] 2. 實作遊戲狀態機與 Overlay 控制
  - [x] 2.1. 定義三個狀態常數 `STATE_START`、`STATE_PLAYING`、`STATE_GAME_OVER`，實作 `startGame()` 函式：隱藏開始 Overlay、初始化所有遊戲變數、將 `gameState` 設為 `PLAYING`、啟動 `requestAnimationFrame` 迴圈
  - [x] 2.2. 實作 `endGame()` 函式：將 `gameState` 設為 `GAME_OVER`、停止迴圈更新、顯示結束 Overlay 並將最終分數寫入畫面
  - [x] 2.3. 實作 `resetGame()` 函式：重置分數為零、角色回到中間跑道（`lane = 1`）、清空 `obstacles` 與 `coins` 陣列、重新呼叫 `startGame()`
  - [x] 2.4. 在 `DOMContentLoaded` 中綁定「開始遊戲」按鈕呼叫 `startGame()`、「重新開始」按鈕呼叫 `resetGame()`；頁面初始顯示開始 Overlay，其餘 Overlay 隱藏
  _Requires: AC-5.1, AC-5.2, AC-5.3, AC-5.4, AC-5.5, AC-5.6_

- [x] 3. Canvas 渲染基礎
  - [x] 3.1. 實作 `gameLoop(timestamp)` 主迴圈：狀態非 `PLAYING` 時直接返回；依序呼叫 `update()` 與 `render()`，末端以 `requestAnimationFrame(gameLoop)` 遞迴維持迴圈
  - [x] 3.2. 實作 `drawBackground()`：以深灰色（`#1a1a2e`）填充整個畫布
  - [x] 3.3. 實作 `drawLanes()`：在 X = 160px 及 X = 320px 繪製兩條半透明白色（`rgba(255,255,255,0.2)`）垂直分隔線，標示三條跑道邊界
  - [x] 3.4. 確認 `render()` 依正確層次順序呼叫：背景 → 跑道線 → 金幣 → 障礙物 → 角色 → HUD
  _Requires: AC-1.1, AC-1.3, AC-1.4, AC-6.3_

- [x] 4. 玩家角色
  - [x] 4.1. 定義跑道常數 `LANE_X = [80, 240, 400]` 與角色固定 Y 座標 `PLAYER_Y = canvas.height * 3 / 4`（= 525px）
  - [x] 4.2. 實作 `initPlayer()`：將 `player.lane` 設為 1（中間跑道），並依 `LANE_X[player.lane]` 更新 `player.x`、`player.y = PLAYER_Y`
  - [x] 4.3. 實作 `drawPlayer()`：以藍色（`#4fc3f7`）繪製 30×40px 填充矩形，繪製基準以角色中心點計算（`x = player.x - 15`，`y = player.y - 20`）
  _Requires: AC-1.2, AC-1.4, AC-2.6, AC-5.5_

- [x] 5. 鍵盤輸入處理
  - [x] 5.1. 在 `game.js` 初始化時於 `window` 上掛載一次 `keydown` 事件監聽，呼叫 `handleInput(event)`
  - [x] 5.2. 實作 `handleInput(event)`：`gameState !== STATE_PLAYING` 時直接返回；按下 `ArrowLeft` 且 `player.lane > 0` 時執行 `player.lane--`；按下 `ArrowRight` 且 `player.lane < 2` 時執行 `player.lane++`；每次操作後立即以 `LANE_X[player.lane]` 更新 `player.x`
  _Requires: AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-2.5, AC-2.6, AC-6.4_

- [x] 6. 障礙物系統
  - [x] 6.1. 實作 `spawnObstacles()`：隨機排列三條跑道索引，取前 1 或 2 條放置障礙物（確保至少一條跑道空白）；每個障礙物物件含 `{ lane, y, width: 40, height: 30 }`，初始 `y` 設為 `-canvas.height` 以提供開局緩衝距離
  - [x] 6.2. 實作 `updateObstacles()`：每幀對 `obstacles[]` 中每個障礙物執行 `y += currentSpeed`；`y > canvas.height` 時從陣列移除
  - [x] 6.3. 在 `update()` 中使用計數器 `framesSinceLastSpawn` 追蹤距上次生成的幀數，達到動態 `spawnInterval` 時觸發 `spawnObstacles()` 並重置計數器
  - [x] 6.4. 實作 `drawObstacles()`：以紅色（`#ef5350`）繪製每個障礙物矩形，X 座標 = `LANE_X[obs.lane] - obs.width / 2`
  _Requires: AC-3.1, AC-3.2, AC-3.4, AC-3.5_

- [x] 7. 金幣系統
  - [x] 7.1. 實作 `spawnCoins()`：每隔固定幀數（150 幀）在隨機一條跑道上生成一枚金幣，物件含 `{ lane, y: -10, radius: 10, collected: false }`
  - [x] 7.2. 實作 `updateCoins()`：每幀對 `coins[]` 中每個金幣執行 `y += currentSpeed`；`y > canvas.height` 或 `collected === true` 時從陣列移除
  - [x] 7.3. 實作 `drawCoins()`：以金黃色（`#FFD700`）繪製每個金幣實心圓，圓心 X = `LANE_X[coin.lane]`
  _Requires: AC-4.1, AC-4.5_

- [x] 8. 碰撞判定
  - [x] 8.1. 實作障礙物 AABB 碰撞判定：在 `checkCollisions()` 中計算角色碰撞盒（`left/right/top/bottom`）與每個障礙物碰撞盒，X 軸與 Y 軸均重疊時呼叫 `endGame()`
  - [x] 8.2. 實作金幣距離碰撞判定：計算角色中心點與金幣圓心的歐氏距離，距離小於 `collectThreshold`（= 15 + 10 = 25）時標記 `collected = true`、`score += 10`
  - [x] 8.3. 確認 `checkCollisions()` 在每幀 `update()` 中執行，保證判定結果與視覺位置同幀同步
  _Requires: AC-3.3, AC-4.2, AC-4.3, AC-6.5_

- [x] 9. HUD 分數顯示
  - [x] 9.1. 實作 `drawHUD()`：在 `render()` 最後繪製，位置為左上角（`x = 16`，`y = 32`），文字格式「分數：{score}」，字體 `bold 20px sans-serif`，顏色白色（`#FFFFFF`），加黑色文字陰影（偏移 1px 1px，模糊 3px）確保清晰可讀
  - [x] 9.2. 確認 `startGame()` 與 `resetGame()` 執行時均將 `score` 重置為 0，使新局分數從零開始
  _Requires: AC-4.3, AC-4.4, AC-4.6_

- [x] 10. 速度遞增
  - [x] 10.1. 初始化速度參數：`initialSpeed = 3`、`speedIncrement = 0.5`、`maxSpeed = 12`、`speedUpInterval = 300`；在 `update()` 末端每幀累加 `frameCount`，每 300 幀執行 `currentSpeed = Math.min(currentSpeed + speedIncrement, maxSpeed)`
  - [x] 10.2. 實作動態障礙物生成間距：`spawnInterval = Math.floor((200 + (maxSpeed - currentSpeed) * 20) / currentSpeed)`，確保速度越快間距越小但仍保留足夠反應時間
  _Requires: AC-6.1, AC-6.2_

- [x] 11. 整合測試與驗收
  - [x] 11.1. 手動驗證畫面呈現：確認三條跑道可見（AC-1.1）、角色始終顯示於畫面中（AC-1.2）、障礙物與金幣由上往下移動（AC-1.3）、所有圖形為純幾何形狀（AC-1.4）、無需外掛即可在 Chrome／Firefox／Edge 開啟（AC-1.5、AC-6.6）
  - [x] 11.2. 手動驗證角色控制：左右方向鍵各移動一條跑道（AC-2.1～2.3）、邊界不超出（AC-2.4～2.5）、切換有即時視覺回饋且無延遲（AC-2.6、AC-6.4）
  - [x] 11.3. 手動驗證障礙物與金幣：每排最多兩條跑道有障礙物（AC-3.2）、碰撞後立即結束遊戲（AC-3.3）、離開畫面後消失（AC-3.4）、開局有緩衝距離（AC-3.5）；金幣收集後分數即時更新（AC-4.2～4.3）、未收集者消失不計分（AC-4.5）、新局分數歸零（AC-4.6）
  - [x] 11.4. 手動驗證流程與體驗：開始畫面顯示正確（AC-5.1～5.2）、結束畫面顯示最終分數與重啟按鈕（AC-5.3～5.4）、重啟後角色回中間跑道（AC-5.5）、結束後畫面凍結（AC-5.6）；速度逐漸加快且無瞬間跳躍（AC-6.1～6.2）、渲染無明顯卡頓（AC-6.3）、碰撞判定與視覺一致（AC-6.5）
  _Requires: AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-2.5, AC-2.6, AC-3.2, AC-3.3, AC-3.4, AC-3.5, AC-4.2, AC-4.3, AC-4.5, AC-4.6, AC-5.1, AC-5.2, AC-5.3, AC-5.4, AC-5.5, AC-5.6, AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.5, AC-6.6_

## Notes

- 所有檔案置於 `docs/` 目錄下，以靜態 HTML 方式直接在瀏覽器開啟即可執行，無需任何建置工具或伺服器
- 任務 1～3 為基礎骨架，建議依序完成後再進行後續任務
- 任務 6、7、8 可在任務 3～5 完成後並行開發
- 整合測試（任務 11）應在所有功能任務完成後進行，逐一對照驗收條件手動測試
