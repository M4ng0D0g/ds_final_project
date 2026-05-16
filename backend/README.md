# Python + MySQL
- Python 3.14.5
    - FastAPI
    - sqlalchemy
    - Alembic

SQL使用者預設為root  

# Alembic
https://alembic.sqlalchemy.org/en/latest/tutorial.html

## 遷移
alembic revision --autogenerate -m "訊息"
用途：比對你 Python 程式碼中的 models.py 與你「當前的資料庫結構」。如果發現程式碼多了欄位、少了資料表，它會自動在 alembic/versions/ 資料夾下生成一個新的 Python 腳本。

-m 參數：就像 git commit -m，用來記錄這次變動的摘要（例如："create user table" 或 "add age to users"）。

注意：此指令不會更動資料庫，它只是「產生程式碼」。
要檢查生成腳本 有可能出錯

alembic upgrade head
用途：執行所有尚未套用的遷移腳本，將資料庫結構升級到最新狀態（head 代表最新版本）。

注意：此指令才會真正去修改你的 MySQL 資料庫結構。

## 運行
用py -m [module] 執行檔案
- 初始化並同步資料庫變更
```
py -m setup
```
- 導入資料
```
py -m seeds.seed_db
```

## 資料庫相關
course_type
- N 未定
- R 必修
- P 群修
- E 選修
