from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

# 定義一個泛型變數 T，代表未來真正要裝進 data 的資料型態
T = TypeVar("T")

# 1. 成功時的統一外殼
class JSendSuccessResponse(BaseModel, Generic[T]):
    status: str = "success"
    data: T  # 💡 這裡可以是單個物件、清單(List)或字典

# 2. 失敗時的錯誤欄位結構
class ErrorDetails(BaseModel):
    code: str
    message: str
    data: Optional[Any] = None

# 3. 失敗/錯誤時的統一外殼
class JSendErrorResponse(BaseModel):
    status: str = "error"  # 或者是 "fail"
    error: ErrorDetails