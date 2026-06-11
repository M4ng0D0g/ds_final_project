import { ExportCSVButton } from "./ExportCSVButton";

const TeacherResultsTable = ({ data, onBack, handleClick }) => {
  // Helper function to extract and format category credits safely
  const getCategoryProgress = (categories, categoryId) => {
    if (categoryId === "aux") {
      const aux1 = categories.find((cat) => cat.id === "auxiliary1");
      const aux2 = categories.find((cat) => cat.id === "auxiliary2");

      if (!aux1 && !aux2) return "-";

      const earned = (aux1 ? aux1.earned : 0) + (aux2 ? aux2.earned : 0);
      const required = aux1 ? aux1.required : 0 + aux2 ? aux2.required : 0;
      return `${earned} / ${required}`;
    }
    const category = categories.find((cat) => cat.id === categoryId);
    if (!category) return "-";
    return `${category.earned} ${category.required == 0 ? "" : "/" + category.required}`;
  };

  return (
    <>
      <ExportCSVButton data={data} />
      <div style={containerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={headerRowStyle}>
              <th style={thStyle}>學號</th>
              <th style={thStyle}>名字</th>
              <th style={thStyle}>主修</th>
              <th style={thStyle}>雙主修</th>
              <th style={thStyle}>輔系1</th>
              <th style={thStyle}>輔系2</th>
              <th style={thStyle}>主修進度</th>
              <th style={thStyle}>雙主修進度</th>
              <th style={thStyle}>輔修進度</th>
              <th style={thStyle}>外系選修</th>
              <th style={thStyle}>通識課程進度</th>
              <th style={thStyle}>共同必修進度</th>
              <th style={thStyle}>通過</th>
            </tr>
          </thead>
          <tbody>
            {data.map((student, index) => {
              const { student_info, categories } = student;
              const isEven = index % 2 === 0;

              return (
                <tr
                  key={student_info.student_id || index}
                  style={{
                    ...rowStyle,
                    backgroundColor: isEven ? "#ffffff" : "#f9fafb",
                    cursor: "pointer",
                  }}
                  onClick={() => handleClick(student_info.student_id)}
                >
                  <td style={tdStyle}>{student_info.student_id}</td>
                  <td style={tdStyle}>{student_info.name}</td>
                  <td style={tdStyle}>{student_info.major1 || "-"}</td>
                  <td style={tdStyle}>{student_info.major2 || "-"}</td>
                  <td style={tdStyle}>{student_info.auxiliary1 || "-"}</td>
                  <td style={tdStyle}>{student_info.auxiliary2 || "-"}</td>

                  {/* Progress columns map to categories array (earned / required) */}
                  <td style={tdStyle}>
                    {getCategoryProgress(categories, "major1")}
                  </td>
                  <td style={tdStyle}>
                    {getCategoryProgress(categories, "major2")}
                  </td>
                  <td style={tdStyle}>
                    {getCategoryProgress(categories, "aux")}
                  </td>
                  <td style={tdStyle}>
                    {getCategoryProgress(categories, "out_department")}
                  </td>
                  <td style={tdStyle}>
                    {getCategoryProgress(categories, "general_edu")}
                  </td>
                  <td style={tdStyle}>
                    {getCategoryProgress(categories, "common_compulsory")}
                  </td>

                  {/* Pass Status */}
                  <td style={{ ...tdStyle, fontWeight: "bold" }}>
                    {student_info.is_pass ? (
                      <span style={{ color: "#10B981" }}>✅ 通過</span>
                    ) : (
                      <span style={{ color: "#EF4444" }}>❌ 未通過</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

// Simple, clean modern CSS-in-JS styles
const containerStyle = {
  overflowX: "auto",
  margin: "20px 0",
  boxShadow:
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left",
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontSize: "14px",
};

const headerRowStyle = {
  backgroundColor: "#f3f4f6",
  borderBottom: "2px solid #e5e7eb",
};

const rowStyle = {
  borderBottom: "1px solid #e5e7eb",
  transition: "background-color 0.2s",
};

const thStyle = {
  padding: "12px 16px",
  fontWeight: "600",
  color: "#374151",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px 16px",
  color: "#4b5563",
  whiteSpace: "nowrap",
};

export default TeacherResultsTable;
