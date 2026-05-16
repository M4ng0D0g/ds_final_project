import os
from typing import AsyncGenerator
from dotenv import load_dotenv
from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

# 1. 載入 .env 環境變數
load_dotenv()

# 2. 取得資料庫連線字串 (預設使用 asyncmy 作為 MySQL 的非同步驅動)
# 格式: mysql+asyncmy://user:password@host:port/dbname
DATABASE_URL = f"mysql+asyncmy://{os.getenv("USER", "root")}:{os.getenv("PASSWORD", "password")}@localhost:3306/ds_final_project?charset=utf8mb4"
# print(DATABASE_URL)

# 3. 建立非同步資料庫引擎 (Engine)
# echo=True 會在終端機印出實際執行的 SQL 語句，開發時很好用，生產環境建議改為 False
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,  # 自動檢查連線是否可用，避免 "MySQL server has gone away" 錯誤
    pool_size=10,        # 連線池基本大小
    max_overflow=20      # 超出 pool_size 後最多可額外建立的連線數
)

# 4. 建立非同步 Session 工廠
# expire_on_commit=False 可以防止在 commit 後物件的屬性被排空，適合非同步操作
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)

convention = {
    "ix": "ix_%(column_0_label)s",                          # 索引
    "uq": "uq_%(table_name)s_%(column_0_name)s",            # 唯一限制
    "ck": "ck_%(table_name)s_%(constraint_name)s",         # 檢查限制
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s", # 外鍵規則！
    "pk": "pk_%(table_name)s"                               # 主鍵
}
# 5. 定義所有 Model 的基底類別 (SQLAlchemy 2.0 樣式)
class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=convention)

# 6. 建立 FastAPI 專用的 Dependency (依賴注入函式)
# 這個函式確保每個 API 請求都有獨立的 Session，並在請求結束後自動關閉連線
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()