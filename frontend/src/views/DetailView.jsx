import React, { useState, useEffect } from "react";
import ProgressBar from "../components/ProgressBar";
import { getCategoryData } from "../api";

// --- Icons ---

const ArrowLeft = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4 L6 9 L11 14" />
  </svg>
);

const WarnIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20">
    <path
      d="M10 2 L19 17 H1 Z"
      fill="#FFD600"
      stroke="#C89000"
      strokeWidth="1.2"
    />
    <line
      x1="10"
      y1="8"
      x2="10"
      y2="13"
      stroke="#8B6000"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="10" cy="15.2" r="1" fill="#8B6000" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="7" fill="#2DB87A" />
    <path
      d="M4.5 8 L7 10.5 L11.5 5.5"
      stroke="#fff"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="7" fill="#E04040" />
    <path
      d="M5.5 5.5 L10.5 10.5 M10.5 5.5 L5.5 10.5"
      stroke="#fff"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

// --- Component ---

const DetailView = ({ category, onBack, token }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cat = category;

  useEffect(() => {
    const fetchDetail = async () => {
      if (!category?.id || !token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await getCategoryData(token, category.id);
        const courses = result?.data?.courses || [];
        setRecords(
          courses.map((course) => ({
            sem: course.semester,
            name: course.course_name,
            type: course.course_type,
            credit: course.credits,
            score: course.grade || (course.status === "passed" ? "P" : "F"),
            ok: course.status === "passed",
          })),
        );
      } catch (err) {
        setError(err.message || "無法取得課程明細");
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [category?.id, token]);

  if (!cat) return null;

  const pct = (cat.earned / cat.required) * 100;

  const headerStyle = {
    background: `radial-gradient(circle at 18% 60%, ${cat.fromColor} 0%, ${cat.toColor} 100%)`,
    padding: "40px 32px 32px",
    color: "#fff",
    position: "relative",
    overflow: "hidden",
  };

  const cardStyle = {
    background: "#fff",
    borderRadius: "16px",
    border: "2px solid #EDD880",
    padding: "24px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
  };

  return (
    <div
      style={{
        background: "#F6FFEA",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header style={headerStyle}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.07)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <button
            onClick={onBack}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: "8px",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              cursor: "pointer",
              marginBottom: "20px",
            }}
          >
            <ArrowLeft />
          </button>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  opacity: 0.8,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {cat.subtitle} //
              </div>
              <h1
                style={{ fontSize: "32px", fontWeight: 900, margin: "4px 0 0" }}
              >
                {cat.title}
              </h1>
            </div>
            <div style={{ fontSize: "42px", fontWeight: 900 }}>
              {Math.round(pct)}%
            </div>
          </div>

          <div style={{ marginTop: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "14px",
                fontWeight: 800,
                marginBottom: "8px",
              }}
            >
              <span>完成進度</span>
              <span>
                {cat.earned} / {cat.required} {cat.unit}
              </span>
            </div>
            <ProgressBar pct={pct} color="rgba(255,255,255,0.85)" height={12} />
          </div>
        </div>
      </header>

      <main
        style={{
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          flex: 1,
        }}
      >
        {/* Course Items Card */}
        <section style={cardStyle}>
          <h3
            style={{
              margin: "0 0 16px",
              fontSize: "14px",
              fontWeight: 800,
              color: "#8B6B00",
              textTransform: "uppercase",
            }}
          >
            修課項目規範
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {cat.items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: item.done ? "#1A7A4A" : "#C04040",
                }}
              >
                {item.done ? <CheckIcon /> : <XIcon />}
                {item.name}
              </div>
            ))}
          </div>
        </section>

        {/* Warnings Card */}
        {cat.warnings.length > 0 && (
          <section
            style={{
              ...cardStyle,
              background: "#FFFBE8",
              border: "2px solid #F0C830",
            }}
          >
            <div style={{ display: "flex", gap: "12px" }}>
              <WarnIcon />
              <div>
                <h3
                  style={{
                    margin: "0 0 8px",
                    fontSize: "14px",
                    fontWeight: 800,
                    color: "#7A3A00",
                  }}
                >
                  學分缺修警示
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  {cat.warnings.map((w, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#7A3A00",
                      }}
                    >
                      • {w}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Records Table Card */}
        <section style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "24px", textAlign: "center" }}>
              載入課程明細中...
            </div>
          ) : error ? (
            <div
              style={{ padding: "24px", color: "#C03030", textAlign: "center" }}
            >
              {error}
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead style={{ background: "#FBF5DC" }}>
                <tr>
                  {["學期", "課程名稱", "類別", "學分", "成績", "狀態"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: "16px",
                          fontSize: "13px",
                          fontWeight: 800,
                          color: "#8B7030",
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {(records.length > 0 ? records : []).map((r, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: "1px solid #EDD880",
                      background: r.ok ? "#fff" : "#FFF5F0",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = r.ok
                        ? "#FDFBF0"
                        : "#FFE8E0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = r.ok
                        ? "#fff"
                        : "#FFF5F0";
                    }}
                  >
                    <td
                      style={{
                        padding: "16px",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#3A2000",
                      }}
                    >
                      {r.sem}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        fontSize: "15px",
                        fontWeight: 800,
                        color: "#3A2000",
                      }}
                    >
                      {r.name}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span
                        style={{
                          background: "#FBF2D0",
                          border: "1px solid #E8D070",
                          borderRadius: "6px",
                          padding: "2px 8px",
                          fontSize: "12px",
                          fontWeight: 800,
                          color: "#8B7030",
                        }}
                      >
                        {r.type}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#3A2000",
                      }}
                    >
                      {r.credit}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#3A2000",
                      }}
                    >
                      {r.score}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: 800,
                          background: r.ok ? "#E8FAF0" : "#FFF0EE",
                          border: `1.5px solid ${r.ok ? "#80DDA8" : "#F0A0A0"}`,
                          color: r.ok ? "#1A7A4A" : "#C03030",
                        }}
                      >
                        {r.ok ? "通過" : "缺修"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>

      <footer
        style={{
          padding: "24px",
          textAlign: "center",
          fontSize: "12px",
          color: "#9A8050",
        }}
      >
        Credit Planet Map System // 2026
      </footer>
    </div>
  );
};

export default DetailView;
