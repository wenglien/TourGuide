# TourGuide

**輸入目的地，拿到一條走得完、有時間表的路線，畫成像捷運路線圖的樣子。**

[English](README.md) · [線上展示](https://tourguide-53562.web.app) · [設計說明](DESIGN.md)

<p>
  <img src="docs/screenshots/01-compose.png" width="23%" alt="填寫：目的地、多久、想做什麼" />
  <img src="docs/screenshots/02-example.png" width="23%" alt="首頁範例與時間滑桿" />
  <img src="docs/screenshots/03-result.png" width="23%" alt="結果：每個時段一條顏色的路線" />
  <img src="docs/screenshots/04-map.png" width="23%" alt="同一天的地圖" />
</p>

多數行程規劃工具給你一份清單，TourGuide 給你一條**路線**：上午、下午、傍晚、晚上各有一種顏色，景點是車站，站與站之間標著步行或搭車要幾分鐘、多少錢。拖動列車，就能看到一天裡任何時刻你會在哪裡。

## 功能

- **一張表單，所有行程**：輸入目的地和「多久」。2 小時或半天會排出一條 AI 散步路線；1 到 7 天會排出依時段分配的每日行程。
- **時間滑桿**：仿列車車廂上方的路線顯示器。可以拖動、點站、或按播放，下方路線和地圖會跟著動，鍵盤也能操作。
- **以真實地點為基礎**：1 天以上的行程，候選地點來自 Google Places，AI 只負責挑選與排序。散步路線（2 小時、半天）由模型直接產生，出發前請自行確認地點。
- **就地調整**：換掉一個景點、重排一個時段或一整天、拖曳或用箭頭調整順序、一鍵改成最短步行順序。
- **天氣與人潮**：偵測當天是否下雨並提供室內版本；隨行模式會在外出時留意天氣與人潮。
- **紀念章**：在景點留下心得和照片，蓋一個紀念章收進紀念章冊。
- **儲存、分享、匯出**：存進帳號、產生公開分享連結、匯出 PDF 或 Google 日曆，並追蹤實際花費。
- 可安裝的 PWA、繁體中文與英文、淺色與深色主題。

## 技術

| 項目 | 選擇 |
| --- | --- |
| 前端 | React 19、TypeScript、Vite、手寫 CSS 與設計 token |
| 路由 | React Router 6 |
| 後端 | Firebase：Auth（Google）、Firestore、Storage、Hosting |
| 地圖與地點 | Google Maps JavaScript API（Places、Geocoding、Directions、Distance Matrix） |
| AI | Groq（`openai/gpt-oss-120b`，於 `src/services/llm.ts` 設定） |
| 天氣 | OpenWeatherMap（選用） |
| 匯出 | jsPDF、html2canvas |

## 開始使用

### 需要準備

- Node.js 18 以上
- 一個 Firebase 專案，並啟用 **Authentication（Google 登入）**、**Firestore**、**Storage**
- 一組 Google Cloud API 金鑰，啟用 Maps JavaScript、Places、Geocoding、Directions、Distance Matrix
- [Groq](https://console.groq.com) API 金鑰
- 選用：[OpenWeatherMap](https://openweathermap.org/api) API 金鑰

### 執行

```bash
git clone https://github.com/wenglien/TourGuide.git
cd TourGuide
npm install
cp .env.example .env   # 填入你自己的金鑰
npm run dev
```

### 環境變數

所有變數都會在建置時被 Vite 打包進瀏覽器端的程式碼，請先閱讀下方[安全注意事項](#安全注意事項)。

| 變數 | 必填 | 用途 |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY`、`VITE_FIREBASE_AUTH_DOMAIN`、`VITE_FIREBASE_PROJECT_ID`、`VITE_FIREBASE_STORAGE_BUCKET`、`VITE_FIREBASE_MESSAGING_SENDER_ID`、`VITE_FIREBASE_APP_ID` | 是 | Firebase 網頁應用程式設定（專案設定 → 你的應用程式） |
| `VITE_FIREBASE_MEASUREMENT_ID` | 否 | Analytics |
| `VITE_FIREBASE_VAPID_KEY` | 否 | 推播的公開金鑰；沒設定就不會啟用推播 |
| `VITE_GOOGLE_MAPS_API_KEY` | 是 | 地圖、地點搜尋、地理編碼與交通時間 |
| `VITE_GROQ_API_KEY` | 是 | 產生路線與行程 |
| `VITE_OPENWEATHERMAP_API_KEY` | 否 | 下雨偵測；沒設定就略過天氣 |

### 指令

| 指令 | 說明 |
| --- | --- |
| `npm run dev` | 啟動開發伺服器 |
| `npm run build` | 型別檢查並建置到 `dist/` |
| `npm run preview` | 在本機預覽正式版 |
| `npm run lint` | 執行 ESLint |
| `npm run deploy` | 建置並部署到 Firebase Hosting（請先把 `.firebaserc` 改成你的專案） |

## 專案結構

```
src/
  app/          App、頂部列、路由
  features/
    trip/       唯一的主頁：表單、生成中、結果標頭
    plan/       多天行程結果與狀態（usePlanner）
    walk/       單次散步結果
    route-line/ 路線圖 RouteLine 與時間滑桿 DayScrubber
    stamps/     紀念章
    trips/      「我的旅程」：行程、紀念章冊、動態
    shared/     公開分享頁
  components/   地圖、地址自動完成、預算追蹤、排序清單
  services/     Google Maps、LLM、Firebase、天氣、匯出、i18n
  ui/           底部視窗、提示訊息與確認對話框、分段控制
  styles/       設計 token 與基礎樣式
```

配色、字型與動態的設計決策記錄在 [DESIGN.md](DESIGN.md)。

## 安全注意事項

TourGuide 是純前端應用，所有 `VITE_` 開頭的變數，任何訪客都看得到。公開部署前請注意：

- **限制 Google Maps 金鑰**：設定 HTTP 參照網址限制，並只開放上面列出的 API。
- **別放你在意的 Groq 金鑰上線**：正式環境請把 LLM 呼叫移到自己的後端（例如 Cloud Function），金鑰留在伺服器端。在那之前，請替金鑰設定用量上限。
- **寫好 Firestore 與 Storage 安全規則**：使用者只能讀寫自己的資料，分享出去的行程是唯一的公開讀取。
- 不要提交 `.env`。它已在 `.gitignore` 中，`.env.example` 只列變數名稱。

發現安全問題？請在 GitHub 開一個私人的 security advisory，不要直接開公開 issue。

## 參與貢獻

歡迎提 issue 和 pull request。送出前請確認 `npm run build` 能通過（會做型別檢查）；如果要改外觀，請先讀 [DESIGN.md](DESIGN.md)。`npm run lint` 目前還有一些舊的問題（主要是 `any` 型別和 hook 依賴警告），請不要新增，順手清掉也非常歡迎。

## 授權

[MIT](LICENSE)
