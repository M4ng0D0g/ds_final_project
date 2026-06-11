import React from "react";

const CATEGORY_NAMES = {
  major1: "主修課程",
  major2: "雙主修課程",
  out_department: "外系選修",
  general_edu: "通識課程",
  common_compulsory: "共同必修",
  auxiliary1: "第一輔修",
  auxiliary2: "第二輔修",
};

export function StudentCard({ show, data, onBack }) {
  const categories = Array.isArray(data) ? data : data?.categories || [];

  if (!show || categories.length === 0) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case "passed":
        return (
          <span style={{ color: "#10B981", fontWeight: "600" }}>已通過</span>
        );
      case "unknown":
        return (
          <span style={{ color: "#F59E0B", fontWeight: "600" }}>
            修習中/未定
          </span>
        );
      default:
        return (
          <span style={{ color: "#EF4444", fontWeight: "600" }}>不通過</span>
        );
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Modal Header - Stays pinned at top */}
        <div style={headerStyle}>
          <h2 style={titleStyle}>學生詳細修課紀錄</h2>
          <button style={closeIconStyle} onClick={onBack} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Modal Body - Scrolls internally within the fixed height */}
        <div style={bodyStyle}>
          {categories.map((category) => {
            const hasCourses = category.courses && category.courses.length > 0;

            return (
              <div key={category.id} style={sectionStyle}>
                <h3 style={sectionTitleStyle}>
                  {CATEGORY_NAMES[category.id] || category.id}
                  <span style={countStyle}>
                    ({category.courses?.length || 0} 門課)
                  </span>
                </h3>

                {hasCourses ? (
                  <div style={tableContainerStyle}>
                    <table style={miniTableStyle}>
                      <thead>
                        <tr style={miniHeaderRowStyle}>
                          <th style={miniThStyle}>課號</th>
                          <th style={miniThStyle}>課名</th>
                          <th style={miniThStyle}>學分</th>
                          <th style={miniThStyle}>授課老師</th>
                          <th style={miniThStyle}>學期</th>
                          <th style={miniThStyle}>成績</th>
                          <th style={miniThStyle}>狀態</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.courses.map((course, idx) => (
                          <tr key={course.course_id + idx} style={miniRowStyle}>
                            <td style={miniTdStyle}>{course.course_id}</td>
                            <td
                              style={{
                                ...miniTdStyle,
                                fontWeight: "500",
                                color: "#111827",
                              }}
                            >
                              {course.course_name}
                            </td>
                            <td style={miniTdStyle}>{course.credits}</td>
                            <td style={miniTdStyle}>{course.teacher_name}</td>
                            <td style={miniTdStyle}>{course.semester}</td>
                            <td style={miniTdStyle}>
                              {course.status === "unknown" ? "-" : course.grade}
                            </td>
                            <td style={miniTdStyle}>
                              {getStatusBadge(course.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={emptyTextStyle}>查無此項別之修課紀錄</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer - Stays pinned at bottom */}
        <div style={footerStyle}>
          <button style={closeButtonStyle} onClick={onBack}>
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Modified CSS-in-JS Styles ---

const overlayStyle = {
  position: "fixed", // Fixed positioning over the screen viewport
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  display: "flex",
  justifyContent: "center", // Horizontally centers the popup
  alignItems: "center", // Vertically centers the popup
  zIndex: 1000,
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const modalStyle = {
  backgroundColor: "#ffffff",
  width: "95%",
  maxWidth: "900px",
  height: "600px", // 1. FIXED HEIGHT enforced here
  display: "flex", // 2. Flex layout keeps header/footer rigid while body stretches
  flexDirection: "column",
  overflow: "hidden", // Prevents content from breaking the rounded borders
  borderRadius: "12px",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
};

const bodyStyle = {
  padding: "24px",
  overflowY: "auto", // 3. Spills excess content down into an internal dynamic scrollbar
  flex: 1, // Instructs the body container to fill up the leftover fixed space
};

// Pinned and atomic sub-component parameters
const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 24px",
  borderBottom: "1px solid #E5E7EB",
};
const titleStyle = {
  margin: 0,
  fontSize: "18px",
  fontWeight: "700",
  color: "#111827",
};
const closeIconStyle = {
  background: "none",
  border: "none",
  fontSize: "18px",
  cursor: "pointer",
  color: "#9CA3AF",
};
const sectionStyle = { marginBottom: "28px" };
const sectionTitleStyle = {
  margin: "0 0 12px 0",
  fontSize: "16px",
  fontWeight: "600",
  color: "#1F2937",
  borderLeft: "4px solid #3B82F6",
  paddingLeft: "8px",
};
const countStyle = {
  fontSize: "13px",
  fontWeight: "normal",
  color: "#6B7280",
  marginLeft: "6px",
};
const tableContainerStyle = {
  overflowX: "auto",
  border: "1px solid #E5E7EB",
  borderRadius: "8px",
};
const miniTableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
  textAlign: "left",
};
const miniHeaderRowStyle = {
  backgroundColor: "#F9FAFB",
  borderBottom: "1px solid #E5E7EB",
};
const miniRowStyle = { borderBottom: "1px solid #F3F4F6" };
const miniThStyle = {
  padding: "10px 14px",
  fontWeight: "600",
  color: "#4B5563",
};
const miniTdStyle = {
  padding: "10px 14px",
  color: "#4B5563",
  whiteSpace: "nowrap",
};
const emptyTextStyle = {
  padding: "12px",
  color: "#9CA3AF",
  fontSize: "14px",
  fontStyle: "italic",
};
const footerStyle = {
  padding: "14px 24px",
  borderTop: "1px solid #E5E7EB",
  display: "flex",
  justifyContent: "flex-end",
  backgroundColor: "#F9FAFB",
};
const closeButtonStyle = {
  backgroundColor: "#374151",
  color: "#ffffff",
  border: "none",
  padding: "8px 16px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
};
