# Python + MySQL
- Python 3.12.10
    - FastAPI
    - sqlalchemy
    - Alembic

SQL使用者預設為root  
所有命令都是假設執行位置為backend

## docker相關
建立並啟動容器  
```
docker-compose up
```

清空
```
docker compose down -v
```

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
### 數據格式
    以{table_name}為名的csv或json檔
    需要在seeds/seed_db.py跟main.py中加入加載函數
    在csv中，空值視為NULL而非''
  
###　course_type
- R 必修 required
- P 群修 partially required
- E 選修 elective
- G 通識 general
- CG 核心通識 core general
    - C 中文通識 chinese
    - F 外文通識 foreign
    - H 人文通識 human
    - S 社會通識 social
    - N 自然通識 nature
    - I 資訊通識 information
    - A 書院通識 academic
- RPE 體育必修
- EPE 體育選修
- CD 國防 civil defence
  
### 必修科目表結構
graduation_requirements: 必修分數限制、總學分限制  
requirement_rule: 建立必修規則，約束需要滿足的課程數
    規則可以是其他規則的子規則，由parent_rule_id定義
    當子規則被滿足時，母規則滿足課程數+1

requirement_course_mapping: 紀錄課程在哪個規則之下
  
檢查:
    每有一種不同的alternative_course_id，母規則被滿足的規則數+1
    NULL視為獨一無二的alternative_course_id

## API相關
全自動互動式文件: http://127.0.0.1:8080/docs