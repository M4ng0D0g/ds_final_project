# 政大畢業學分檢核系統 (NCCU Graduation Credit Audit System)

本專案為一個現代化、直觀且便利的國立政治大學 (NCCU) **畢業學分與課程規範檢核系統**。旨在幫助學生與學術導師輕鬆管理和審查修課進度，擺脫傳統繁瑣的人工核對。

學生可直接上傳「全人系統」匯出的課業學習歷程 JSON 檔案，系統會依據其主修系所、通識規範、共同必修、外系選修、雙主修及輔系等複雜規則進行樹狀演算法核算，並以高質感的視覺化儀表板呈現檢核結果與尚缺學分/課程提示。教師端（導師/系主任）亦可針對該系所的學生進行畢業學分核對與進度追蹤。

---

## 🌟 核心特色

1. **雙角色權限設計**
   * **學生端**：提供個人學分統計、樹狀規則進度條、各類別（主修、通識、選修、體育、雙主修、輔系）修課明細與未達標提示。
   * **教師端**：支援系所學生檢索、入學年度與學號篩選、分頁瀏覽以及個別學生修課明細深度審查。
2. **強大檢核引擎 (Rule-Checking Engine)**
   * 採用樹狀規則結構（`RequirementRule` 與 `RequirementCourseMapping`），支援巢狀邏輯（例如「指定課程群組中至少修滿 N 門」或「至少選修 X 學分」）。
   * 支援**替代課程 (Alternative Courses)** 的抵免檢核邏輯。
3. **細緻的政大通識規則**
   * 嚴格對照政大通識學分標準（如中文通識上下限、外文通識上下限、各領域學分上限）。
   * 核心通識（人文核通、社會核通、自然核通）三者至少須修滿二類之邏輯校驗。
   * 自動識別學生主修系所並執行特定豁免條件（例如：資訊通識 GI 對於資科系等資訊相關學系免修之邏輯）。
4. **全人系統整合**
   * 提供前端上傳入口，直接將全人系統匯出的學歷 JSON 檔案快速解析並自動 Upsert 入修課紀錄資料庫。
5. **全端 Docker 容器化與熱重載**
   * 一鍵式部署，前端 (React + Vite)、後端 (FastAPI) 與 MySQL 資料庫皆可在容器中運行，並支援本地代碼變更熱重載。
6. **整合效能測試與觀測指標**
   * 配置 k6 負載測試工具，並銜接 Prometheus / Grafana 指標收集系統，內建自訂 HTML 報表自動化生成管線。

---

## 🛠️ 技術棧

* **前端 (Frontend)**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + Vanilla CSS (手寫質感暗色/玻璃擬態風格，流暢微動畫)
* **後端 (Backend)**: [Python 3.12](https://www.python.org/) + [FastAPI](https://fastapi.tiangolo.com/) (全非同步開發，嚴格遵循 JSend API 響應規範)
* **資料庫 & ORM**: [MySQL 8.0](https://www.mysql.com/) + [SQLAlchemy 2.0 (Async)](https://www.sqlalchemy.org/)
* **遷移工具 (Migration)**: [Alembic](https://alembic.sqlalchemy.org/)
* **效能測試 & 監控**: [k6](https://k6.io/) + [Prometheus](https://prometheus.io/) + [Grafana](https://grafana.com/)
* **容器化**: [Docker](https://www.docker.com/) + [Docker Compose](https://docs.docker.com/compose/)

---

## 📂 專案目錄結構

```text
ds_final_project/
├── backend/                  # 後端 Python 應用程式
│   ├── alembic/              # 資料庫版本遷移檔案
│   ├── models/               # SQLAlchemy 資料庫模型 (帳號、課程、系所規定)
│   ├── routers/              # API 業務路由 (驗證、課程、畢業審查、教師端等)
│   ├── seeds/                # 資料庫初始化 CSV 種子數據與 seed_db 腳本
│   ├── utils/                # 共用 Tool、例外攔截與 Setup 常式
│   ├── main.py               # FastAPI 啟動入口
│   └── Dockerfile            # 後端 Docker 映像檔建置說明
│
├── frontend/                 # 前端 React 應用程式
│   ├── src/
│   │   ├── views/            # Dashboard.jsx、DetailView.jsx、Login.jsx
│   │   ├── api.js            # Axios 串接與 Token 傳遞封裝
│   │   └── App.jsx           # 單頁面切換與流暢動畫
│   └── Dockerfile            # 前端 Docker 映像檔建置說明
│
├── k6/                       # 效能測試與監控
│   ├── tests/                # 壓測指令檔 (normal、peak、stress)
│   └── report/               # 測試生成的 JSON 與 HTML 報告檔
│
├── scripts/                  # 輔助與協作腳本
│   ├── push.sh / push.bat    # 快捷 Git 提交與推送腳本
│   └── start_obs.sh          # 觀測平台啟動指令
│
├── docker-compose.yml        # 全系統多容器編排檔
├── prometheus.yml            # Prometheus scrape 設定檔
├── report.sh                 # 壓測暨 HTML 報表自動化分析指令
└── README.md                 # 專案說明文件
```

---

## 🚀 快速開始指南

### 1. 系統環境要求
確保本地已安裝：
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) 
* [Node.js](https://nodejs.org/) (若要在本地端執行報表生成或 npm 指令)

---

### 2. 一鍵啟動所有服務 (Docker)
在專案根目錄下，透過 Docker Compose 建立並在背景啟動資料庫、後端與前端服務：
```bash
docker compose up --build -d
```
> [!NOTE]
> 也可以直接在根目錄使用 `npm run obs:start`。

啟動完成後，您可存取：
* **前端介面 (Web)**：[http://localhost:5173](http://localhost:5173)
* **後端 Swagger API 文件**：[http://localhost:8080/docs](http://localhost:8080/docs)

---

### 3. 資料庫結構遷移與種子資料載入
首次啟動時，後端容器會自動套用 Alembic 遷移更新資料庫結構。若需手動操作，可參考以下指令：

**手動套用 Alembic 資料庫結構遷移**
```bash
# 產生新的 revision (當您修改了 models/*.py)
docker compose exec backend alembic revision --autogenerate -m "修改描述"

# 將結構套用到資料庫
docker compose exec backend alembic upgrade head
```

**載入政大預設科系、課程與測試帳號 (Seeds)**
本系統包含預設之科系畢業標準（以資科系、社科院等為範例）與多門政大課程：
```bash
docker compose exec backend python -m seeds.seed_db
```

**清除並重置資料庫**
```bash
docker compose down -v
```

---

## 📊 效能壓測與監控管線

專案整合了 k6 以及觀測管線。在根目錄中，您可以使用預配置的 npm 指令來啟動特定的負載測試：

```bash
# 1. 輕量 Smoke 測試 (1 VU, 5s/10s)
npm run test:normal

# 2. 尖峰負載測試
npm run test:peak

# 3. 極限壓力測試
npm run test:stress
```

執行測試後，`report.sh` 會自動將結果寫入 Prometheus，並在本地編譯出 HTML 報表：
* **Grafana 儀表板**：[http://localhost:3000](http://localhost:3000)
* **Prometheus 原生介面**：[http://localhost:9090](http://localhost:9090)
* **HTML 測試報告**：輸出於 [k6/report/html/](file:///d:/Projects/ds_final_project/k6/report/html/) 目錄下。

---

## 🤝 團隊 Git 快速提交規定

為了簡化版本變更與 Git 提交，專案提供快捷提交機制：
1. 開啟根目錄下的 [.settings](file:///d:/Projects/ds_final_project/.settings) 檔案，更新您的版本號（如 `project_version=1.0.1`）。
2. 在終端機執行快捷推送指令：
   ```bash
   # Linux / macOS
   ./scripts/push.sh "您的提交說明"
   
   # Windows (CMD / PowerShell)
   .\scripts\push.bat "您的提交說明"
   ```
   *此指令會自動修正遠端倉庫至指定 Git 目標、將版本號加入 commit 標題中並自動推送到 `main` 分支。*

---

## 📝 授權與課程資訊
* **專案名稱**：資料庫系統期末專案 - 政大畢業學分檢核系統
* **課程資訊**：國立政治大學 - 資料庫系統課程專案
* 課程資料收集說明可參見：[數據採集 Notebook](file:///d:/Projects/ds_final_project/backend/tools/obtain_course_record.ipynb)
