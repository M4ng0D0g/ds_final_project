const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. 資料庫連線設定 ---
const dbConfig = {
    host: 'localhost',
    user: 'root',         // 你的 MySQL 帳號
    password: 'nccutest', // 你的 MySQL 密碼
    database: 'db_project'
};

// --- 2. API 端點：獲取學生學分審查進度 ---
app.get('/api/audit/:studentId', async (req, res) => {
    const { studentId } = req.params;
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);

        // A. 查詢學生基本資料與系所名稱
        const [studentInfo] = await connection.execute(`
            SELECT s.username, d.department_name, s.department_major1 
            FROM student_account s
            JOIN department d ON s.department_major1 = d.department_id
            WHERE s.student_id = ?`, [studentId]);

        if (studentInfo.length === 0) {
            return res.status(404).json({ message: "找不到該學生" });
        }

        // B. 查詢已得學分統計 (依修別分組)
        const [creditStats] = await connection.execute(`
            SELECT c.course_type, SUM(c.credits) as earned 
            FROM course_record r
            JOIN course_information c ON r.course_id = c.course_id
            WHERE r.student_id = ? AND r.passed_state = 'Y'
            GROUP BY c.course_type`, [studentId]);

        // C. 查詢該系「尚未修習」的必修課 (Warnings)
        // 邏輯：系所 ID 匹配且修別含「必」字，但不在該生已過關名單中
        const [missingRequired] = await connection.execute(`
            SELECT course_id, course_name 
            FROM course_information 
            WHERE department_id = ? AND course_type LIKE '%必%'
            AND course_id NOT IN (
                SELECT course_id FROM course_record 
                WHERE student_id = ? AND passed_state = 'Y'
            )`, [studentInfo[0].department_major1, studentId]);

        // D. 組合 JSON 回傳
        res.json({
            name: studentInfo[0].username,
            major: studentInfo[0].department_name,
            progress: creditStats,
            warnings: missingRequired
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "伺服器內部錯誤" });
    } finally {
        if (connection) await connection.end();
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 API 伺服器已啟動：http://localhost:${PORT}`);
});