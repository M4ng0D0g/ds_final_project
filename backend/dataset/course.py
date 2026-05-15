import pandas as pd
import re
import os

# 1. 設定檔案路徑
current_dir = os.path.dirname(os.path.abspath(__file__))
excel_file = os.path.join(current_dir, 'CoursesList.xlsx')

# 2. 定義核心關鍵字對應表
'''
keyword_mapping = {
    '文學院': 100, '中文': 101, '教育': 102, '歷史': 103, '哲學': 104,
    '政治': 202, '外交': 203, '社會': 204, '財政': 205, '公行': 206, '地': 207, '經濟': 208, '民族': 209, 
    '國貿': 301, '金融': 302, '會計': 303, '統計': 304, '企管': 305, '資管': 306, '財管': 307, '風管': 308,
    '新聞': 401, '廣告': 402, '廣電': 403, '傳院': 405, '傳播': 405,
    '英文': 501, '阿文': 502, '斯語': 504, '日文': 506, '韓文': 507, '土文': 508, '歐文': 509,
    '法律': 601,
    '應數': 701, '心理': 702, '資訊': 703
}
'''
keyword_mapping = {
    '資訊': 703
}

grad_keywords = ['碩', '博', '所', '專班', '專一', '專二', '博士', '碩士']

def get_dept_id(name):
    # 優先找尋數字代碼 (如 "703 資訊科學系")
    match = re.search(r'\d{3}', name)
    if match:
        return str(match.group()) # 統一轉為字串方便排序
    
    # 模糊匹配關鍵字
    for key, val in keyword_mapping.items():
        if key in name:
            return str(val)
    return "0"

unknown_depts = set()
course_records = [] # 用來存儲所有課程物件，以便後續排序
skipped_count = 0

try:
    df = pd.read_excel(excel_file, skiprows=1, header=None)

    for index, row in df.iterrows():
        if pd.isna(row[0]) or '科目代號' in str(row[0]):
            continue
            
        dept_name = str(row[6]).strip()
        
        # 過濾碩博資料
        if any(word in dept_name for word in grad_keywords):
            skipped_count += 1
            continue
            
        course_id = str(row[0]).strip()
        credits = int(row[1])
        course_name = str(row[2]).strip().replace("'", "''")
        teacher = str(row[4]).strip().replace("'", "''")
        course_type = str(row[11]).strip()
        
        dept_id = get_dept_id(dept_name)
        if dept_id == "0":
            unknown_depts.add(dept_name)
            continue
        
        # 將資料存成字典
        course_records.append({
            'dept_id': dept_id,
            'course_id': course_id,
            'course_name': course_name,
            'course_type': course_type,
            'teacher': teacher,
            'credits': credits
        })

    # --- 關鍵步驟：按 department_id 進行排序 ---
    # 使用 sorted 函數，排序關鍵字為 dept_id
    sorted_records = sorted(course_records, key=lambda x: x['dept_id'])

    # 生成 SQL 指令
    output_sqls = []
    for r in sorted_records:
        sql = f"INSERT IGNORE INTO course_information (course_id, course_name, course_type, teacher_name, department_id, credits) " \
              f"VALUES ('{r['course_id']}', '{r['course_name']}', '{r['course_type']}', '{r['teacher']}', '{r['dept_id']}', {r['credits']});"
        output_sqls.append(sql)

    # 輸出 SQL
    with open('course_data.sql', 'w', encoding='utf-8') as f:
        f.write("" + "\n".join(output_sqls))

    print(f"✅ 處理完成！")
    print(f"成功匯入學士部課程：{len(output_sqls)} 筆 (已按系所 ID 排序)")
    print(f"已自動過濾碩博課程：{skipped_count} 筆")
    if unknown_depts:
        print(f"⚠️ 剩餘無法匹配：{sorted(list(unknown_depts))}")

except Exception as e:
    print(f"❌ 錯誤：{e}")