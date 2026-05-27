from fastapi import FastAPI, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import utils.setup as setup
from seeds import seed_db
from routers import course, graduation, authorization, import_data, teacher  # 匯入子路由
from utils.exceptions import APIFailException, APIErrorException

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
    lifespan=lifespan
)

v1_router = APIRouter(prefix="/api/v1")

# 允許跨來源請求（讓前端可以順利 call 你的 API，避免阻擋）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開發期先允許所有來源，上線再限縮
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 註冊其他模組的路由
v1_router.include_router(course.router, prefix="/course",)
v1_router.include_router(authorization.router, prefix="/auth",)
v1_router.include_router(graduation.router, prefix="/graduation",)
v1_router.include_router(import_data.router, prefix="/import",)
v1_router.include_router(teacher.router, prefix="/teacher",)

app.include_router(v1_router)

@app.get("/")
def root():
    return {"message": "Welcome to NCCU Graduation Requirement Checker API!"}

@app.exception_handler(APIFailException)
async def api_fail_handler(request: Request, exc: APIFailException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "fail",
            "error": {
                "code": exc.code,
                "message": exc.message
            }
        }
    )

# 👮‍♂️ 攔截 5xx 系統錯誤 (error)
@app.exception_handler(APIErrorException)
async def api_error_handler(request: Request, exc: APIErrorException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "error": {
                "code": exc.code,
                "message": exc.message
            }
        }
    )