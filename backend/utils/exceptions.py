class APIFailException(Exception):
    """對應 JSend 'fail' (4xx 業務邏輯錯誤，如：密碼錯誤、找不到類別)"""
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code

class APIErrorException(Exception):
    """對應 JSend 'error' (5xx 系統級嚴重錯誤)"""
    def __init__(self, code: str, message: str, status_code: int = 500):
        self.code = code
        self.message = message
        self.status_code = status_code