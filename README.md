# 資料庫系統期末專案

## How to push easily:
1. Change version number in `.settings` file
2. Copy the command below and paste in your terminal.
```bash
./push.sh "commit message"
```

## How to run on docker:
```bash
# 建置 Dockerfile，並在背景 (-d) 啟動所有服務
docker compose up --build -d
# 查看所有容器的狀態
docker compose ps
# 查看後端日誌
docker compose logs -f backend
# 查看前端日誌
docker compose logs -f frontend
```

由於資料庫連線的 hostname 已經變成 db，所以必須進入後端容器內才能執行 alembic 指令。
```bash
# 1. 產生新的 migration 檔案 (請替換 "init" 為你的描述)
docker-compose exec backend alembic revision --autogenerate -m "init"
# 2. 將 migration 應用到資料庫 (更新資料庫結構)
docker-compose exec backend alembic upgrade head
```

停止所有服務
```bash
# 停止並移除容器與網路，但保留 volume (資料庫資料不會消失)
docker-compose down
```

連帶清除資料庫的資料
```bash
docker-compose down -v
```

載入預設資料
```bash
docker-compose exec backend python -m seeds.seed_db
```

## Preview
https://gemini.google.com/share/0bf2827f4aa6

## 課程紀錄
[資料收集說明](./backend/tools/obtain_course_record.ipynb)