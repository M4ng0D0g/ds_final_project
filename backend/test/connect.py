from database import engine
import asyncio
from sqlalchemy import text

async def test_connection():
    try:
        # 嘗試與資料庫建立連線並執行一個極輕量的查詢
        async with engine.connect() as conn:
            # text("SELECT 1") 是最標準的資料庫健康檢查語句
            result = await conn.execute(text("SELECT 1"))
            val = result.scalar()
            
            if val == 1:
                print("====================================")
                # 恭喜！這代表驅動、帳密、網路、資料庫全部正常
                print("✅ 連線成功！SQLAlchemy 與 asyncmy 運作正常。")
                print("====================================")
                
    except Exception as e:
        print("====================================")
        print("❌ 連線失敗！請檢查以下錯誤訊息：")
        print(f"\n{e}\n")
        print("====================================")
    finally:
        # 測試完畢後關閉引擎，釋放連線
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_connection())