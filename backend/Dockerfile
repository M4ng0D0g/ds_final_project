# 1. 使用官方 Python 輕量版作為基礎映像檔
FROM python:3.12-slim

# 2. 設定容器內的工作目錄（接下來的指令都會在這裡執行）
WORKDIR /app

# 3. 設定 Python 環境變數
# PYTHONDONTWRITEBYTECODE: 防止 Python 產生 .pyc 暫存檔，保持容器乾淨
# PYTHONUNBUFFERED: 讓 Python 的 log 輸出能即時顯示在終端機上，方便 debug
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV USER=root
ENV PASSWORD=password


# 4. 安裝系統依賴（選填）
# 如果你的 Python 套件需要編譯（例如某些舊版資料庫驅動），可以取消註解以下兩行
# RUN apt-get update && apt-get install -y --no-install-recommends gcc default-libmysqlclient-dev && rm -rf /var/lib/apt/lists/*

# 5. 先複製相依套件清單（利用 Docker 快取機制優化建置速度）
COPY requirements.txt .

# 6. 安裝 Python 套件
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 7. 複製專案所有原始碼到容器內
# 💡 提示：開發期我們會用 docker-compose 的 volumes 覆蓋這裡，但寫著能確保生產環境可用
COPY . .

# 8. 宣告容器運行時要監聽的連接埠（Port）
EXPOSE 8000

# 9. 容器啟動時執行的預設指令
# --host 0.0.0.0 : 允許容器外的本機（Windows/Mac）連線進來
# --reload       : 開啟熱重載，程式碼一改立刻自動重啟
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]