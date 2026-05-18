from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import setup
from seeds import seed_db
from routers import course, account, student  # 匯入子路由

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("伺服器啟動中...")
    try:
        setup.run_migrations()
        await seed_db.seed_data("department.csv")
        await seed_db.seed_data("course_information.csv")
        await seed_db.seed_data("student_account.csv")
        await seed_db.seed_data("course_record.csv")
        await seed_db.seed_data("graduation_requirements.csv")
        await seed_db.seed_data("requirement_rule.csv")
        await seed_db.seed_data("requirement_course_mapping.csv")
    except Exception as e:
        print(f"導入資料失敗: {e}")
    print("伺服器啟動完畢!")
    yield

app = FastAPI(
    title="政大畢業學分檢核系統 API",
    description="包含課程查詢、學分計算、畢業規範檢核的核心後端框架",
    version="1.0.0",
    lifespan=lifespan,
)

# 允許跨來源請求（讓前端可以順利 call 你的 API，避免阻擋）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開發期先允許所有來源，上線再限縮
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 註冊其他模組的路由
app.include_router(course.router)
app.include_router(account.router)
app.include_router(student.router)

@app.get("/")
def root():
    return {"message": "Welcome to NCCU Graduation Requirement Checker API!"}