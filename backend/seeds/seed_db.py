import asyncio
import json
import csv
import os
from sqlalchemy.dialects.mysql import insert as mysql_insert
from database import AsyncSessionLocal  # 引入你的 Session 工廠
from models import Base

SEEDS_DIR = os.path.dirname(os.path.abspath(__file__))
registered_tables = Base.metadata.tables
        
async def seed_data(file_name):
    file_path = os.path.join(SEEDS_DIR, file_name)
    if os.path.isfile(file_path):
        table_name, ext = os.path.splitext(os.path.basename(file_path))
        if ext == ".json" or ext == ".csv":
            if table_name not in registered_tables:
                print(f"⚠️ 警告：找不到與檔案名 [{file_name}] 相符的資料表，跳過該檔案。")
                return
            
            async with AsyncSessionLocal() as db:
                table_obj = registered_tables[table_name]
                if ext == ".json":
                    with open(file_path, "r", encoding="utf-8") as f:
                        records = json.load(f)
                        
                    if not records:
                        return

                    # 運用 MySQL 的 ON DUPLICATE KEY UPDATE 實現全自動 Upsert
                    for record in records:
                        # 建立一個基礎的 insert 指令
                        insert_stmt = mysql_insert(table_obj).values(record)
                        
                        # 動態動構：當主鍵衝突時，自動更新除了主鍵以外的所有欄位
                        update_dict = {
                            c.name: insert_stmt.inserted[c.name] 
                            for c in table_obj.columns if not c.primary_key
                        }
                        
                        upsert_stmt = insert_stmt.on_duplicate_key_update(**update_dict)
                        
                        await db.execute(upsert_stmt)
                if ext == ".csv":
                    with open(file_path, "r", encoding="utf-8") as f:
                        # DictReader 會自動把每一行的 tuple 轉對應到第一行的 header
                        reader = csv.DictReader(f)
                        
                        for row in reader:
                            # 1. 略過空行防呆
                            if not row or None in row or not any(row.values()):
                                continue
                                
                            # 2. 💡【關鍵修正】將這一行資料中所有的空字串 '' 轉成 None (資料庫的 NULL)
                            # 順便把字串前後可能不小心按到的空白 (strip) 修正掉
                            clean_row = {}
                            for k, v in row.items():
                                if v is not None:
                                    v = v.strip() # 去除前後空白
                                clean_row[k] = None if v == "" else v     
                                        
                            insert_stmt = mysql_insert(table_obj).values(clean_row)

                            update_dict = {
                                c.name: insert_stmt.inserted[c.name] 
                                for c in table_obj.columns if not c.primary_key
                            }
                            
                            upsert_stmt = insert_stmt.on_duplicate_key_update(**update_dict)
                            await db.execute(upsert_stmt)   
                await db.commit()

async def main():
    await seed_data("department.csv")
    await seed_data("course_information.csv")
    await seed_data("student_account.csv")
    await seed_data("course_record.csv")
    await seed_data("graduation_requirements.csv")
    await seed_data("requirement_rule.csv")
    await seed_data("requirement_course_mapping.csv")

if __name__ == "__main__":
    asyncio.run(main())