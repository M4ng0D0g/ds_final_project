import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from alembic.config import Config
from alembic import command

# 1. 建立資料庫本身 (MySQL)
def create_db_if_not_exists():
    # 注意：這裡要連線到 mysql 而不是特定資料庫
    load_dotenv()
    password = os.getenv("PASSWORD")
    root_url = f"mysql+pymysql://root:{password}@localhost:3306"
    engine = create_engine(root_url)
    with engine.connect() as conn:
        conn.execute(text('''
            CREATE DATABASE IF NOT EXISTS ds_final_project 
            CHARACTER SET utf8mb4 
            COLLATE utf8mb4_unicode_ci;
        '''))
    print("✅ Database ensured.")

# 2. 執行 Alembic 遷移
def run_migrations():
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
    print("✅ Migrations applied to latest version.")

if __name__ == "__main__":
    create_db_if_not_exists()
    run_migrations()