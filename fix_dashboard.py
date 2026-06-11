from pathlib import Path

path = Path(r"d:/coding/DB System/ds_final_project/frontend/src/views/Dashboard.jsx")
text = path.read_text(encoding="utf-8")
text = text.replace('overflowY: isTeacherView ? "auto" : "hidden",', 'overflowY: "hidden",')
text = text.replace('!isTeacherView && data?.studentInfo && (', 'data?.studentInfo && (')
text = text.replace('!isTeacherView && (', '')
start_marker = '        {isTeacherView ? ('
end_marker = '        ) : ('
start = text.find(start_marker)
end = text.find(end_marker, start)
if start != -1 and end != -1:
    end += len(end_marker)
    text = text[:start] + text[end:]
text = text.replace('最後更新：{isTeacherView ? teacherLastUpdated : data.lastUpdated}', '最後更新：{data.lastUpdated}')
path.write_text(text, encoding="utf-8")
print('Dashboard.jsx cleaned')
