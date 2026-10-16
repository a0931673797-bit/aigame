# 專案開發規範

## 技術限制

- 僅使用純 HTML、CSS、JavaScript，不使用任何框架（React、Vue、Angular 等）
- 不使用 Node.js、Vite 或任何建置工具
- 不依賴外部 API，所有資料以模擬資料（mock data）方式寫在程式碼中

## 檔案結構

- 所有網站檔案放在 `docs/` 目錄下
- 靜態資源（圖片、CSS、JS）同樣置於 `docs/` 目錄內的對應子目錄

## 語言與內容

- 介面文字、說明內容一律使用**繁體中文**
- 模擬資料也以繁體中文撰寫

## 響應式設計

- 網頁需支援響應式佈局（RWD），適配桌機、平板、手機等不同螢幕尺寸
- 使用 CSS media query 或 CSS Grid / Flexbox 實現，不引入外部 CSS 框架

## GitHub Pages 發布設定

- 透過 `main` 分支的 `docs/` 目錄發布 GitHub Pages
- 確保 `docs/index.html` 為網站進入點
