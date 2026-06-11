import React, { useState, useEffect } from "react";
import {
  getTeacherStudentCreditProgress,
  teacherGetStudentDetail,
} from "../api";

import TeacherResultsTable from "../components/TeacherResultsTable";
import { StudentCard } from "../components/StudentCard";
import { ExportCSVButton } from "../components/ExportCSVButton";

const TeacherDashboard = ({ onLogout, token }) => {
  const [teacherResults, setTeacherResults] = useState([]);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [teacherError, setTeacherError] = useState(null);
  const [selectedEnrollmentYears, setSelectedEnrollmentYears] = useState([
    "111",
    "112",
    "113",
    "114",
  ]);

  const handleToggleEnrollmentYear = (year) => {
    setSelectedEnrollmentYears((prev) =>
      prev.includes(year)
        ? prev.filter((item) => item !== year).sort()
        : [...prev, year].sort(),
    );
  };

  useEffect(() => {
    const fetchTeacherStudents = async () => {
      if (!token) return;
      if (selectedEnrollmentYears.length === 0) {
        setTeacherResults([]);
        setTeacherError(null);
        setTeacherLoading(false);
        return;
      }

      setTeacherLoading(true);
      setTeacherError(null);
      try {
        const responses = await Promise.all(
          selectedEnrollmentYears.map((year) =>
            getTeacherStudentCreditProgress(token, year),
          ),
        );

        const results = responses.flatMap((response, index) => {
          const year = selectedEnrollmentYears[index];
          const data = response?.data || [];
          return data.map((item) => ({ ...item, enrollment_year: year }));
        });

        setTeacherResults(results);
      } catch (err) {
        setTeacherError(err.message || "無法取得學生資料");
      } finally {
        setTeacherLoading(false);
      }
    };

    fetchTeacherStudents();
  }, [token, selectedEnrollmentYears]);

  const teacherLastUpdated = new Date().toLocaleDateString("zh-TW");

  const [studentDetailOn, setStudentDetailOn] = useState(false);
  const [studentDetail, setStudentDetail] = useState(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflowY: "hidden",
        overflowX: "hidden",
        background: "#F6FFEA",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-50px",
          left: "-50px",
          width: "340px",
          height: "340px",
          borderRadius: "50%",
          background: "rgba(255,222,150,.18)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-100px",
          right: "-50px",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background: "rgba(98,196,218,.10)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "40%",
          right: "10%",
          width: "220px",
          height: "220px",
          borderRadius: "50%",
          background: "rgba(250,133,90,.09)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      <header
        style={{
          flexShrink: 0,
          padding: "24px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          zIndex: 10,
          position: "fixed",
          width: "100%",
          top: 0,
          background: "#111827",
        }}
      >
        <div style={{ pointerEvents: "none" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 800,
              color: "#CBD5E1",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Credit Planet map //
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "4px",
              marginBottom: "16px",
            }}
          >
            <h1
              style={{
                fontSize: "26px",
                fontWeight: 900,
                color: "#FFFFFF",
                margin: 0,
              }}
            >
              學分星球
            </h1>
            <div
              style={{
                background: "#FBBF24",
                color: "#111827",
                borderRadius: "8px",
                padding: "3px 10px",
                fontSize: "13px",
                fontWeight: 800,
              }}
            >
              {new Date().getFullYear()}
            </div>
          </div>
          <div style={{ color: "#CBD5E1", fontSize: "14px" }}>教師檢視</div>
        </div>
        <div style={{ display: "flex", gap: "12px", pointerEvents: "auto" }}>
          <button
            onClick={onLogout}
            style={{
              background: "#ffffff",
              border: "2px solid #C8A840",
              borderRadius: "10px",
              padding: "8px 16px",
              fontWeight: 800,
              color: "#3A3A3A",
              cursor: "pointer",
            }}
          >
            登出
          </button>
        </div>
      </header>

      <div
        style={{
          width: "100%",
          padding: "72px 40px 24px",
          boxSizing: "border-box",
          background: "rgba(255,255,255,0.72)",
          borderRadius: "28px",
          border: "1px solid rgba(200,168,48,0.12)",
          backdropFilter: "blur(12px)",
          marginTop: "106px",
          overflow: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "#3A2000",
            }}
          >
            選擇入學年級
          </div>
          {["111", "112", "113", "114"].map((year) => (
            <label
              key={year}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: "14px",
                color: "#3A2000",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={selectedEnrollmentYears.includes(year)}
                onChange={() => handleToggleEnrollmentYear(year)}
                style={{
                  width: "16px",
                  height: "16px",
                  accentColor: "#4a90e2",
                }}
              />
              {year}
            </label>
          ))}
        </div>

        <div
          style={{
            marginBottom: "24px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <div style={{ color: "#4d5868", fontSize: "14px" }}>
            已選擇年級：
            {selectedEnrollmentYears.length > 0
              ? selectedEnrollmentYears.join("、")
              : "請至少選擇一個年級"}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#3A2000" }}>
            共 {teacherResults.length} 位學生
          </div>
        </div>

        {teacherError && (
          <div
            style={{
              padding: "16px",
              background: "#fee",
              border: "1px solid #fcc",
              borderRadius: "14px",
              color: "#c33",
              marginBottom: "24px",
            }}
          >
            {teacherError}
          </div>
        )}

        {teacherLoading ? (
          <div
            style={{
              minHeight: "280px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#4a90e2",
              fontWeight: 700,
            }}
          >
            載入中，請稍候...
          </div>
        ) : teacherResults.length === 0 ? (
          <div
            style={{
              minHeight: "280px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#666",
              fontSize: "15px",
            }}
          >
            尚未有符合條件的學生資料。
          </div>
        ) : (
          // Display the results in table style
          <TeacherResultsTable
            data={teacherResults}
            handleClick={async (id) => {
              try {
                // 1. Add 'async' to the function arguments and 'await' here
                const response = await teacherGetStudentDetail(token, id);

                // Now 'response' is the actual data object returned by your API
                setStudentDetail(response.data);
                setStudentDetailOn(true);
              } catch (error) {
                // 2. It's always a good idea to handle potential network errors
                console.error("Failed to fetch student details:", error);
              }
            }}
          />
        )}
      </div>

      <StudentCard
        show={studentDetailOn}
        data={studentDetail}
        onBack={() => {
          setStudentDetailOn(false);
        }}
      />

      <footer
        style={{
          padding: "20px",
          textAlign: "center",
          fontSize: "11px",
          color: "#9A8050",
          zIndex: 10,
        }}
      >
        最後更新：{teacherLastUpdated} | 系統維護：(02) 2345-6789 #123
      </footer>
    </div>
  );
};

export default TeacherDashboard;
