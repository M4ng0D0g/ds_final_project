import React from "react";

export function ExportCSVButton({ data, filename = "學生畢業審查進度表.csv" }) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("沒有可匯出的資料！");
      return;
    }

    // 1. Define CSV headers matching your exact table columns
    const headers = [
      "學號",
      "名字",
      "主修",
      "雙主修",
      "輔系1",
      "輔系2",
      "主修進度",
      "雙主修進度",
      "輔修進度",
      "外系選修",
      "通識課程進度",
      "共同必修進度",
      "通過狀態",
    ];

    // 2. Replicate your table's data extraction logic for consistency
    const getCategoryProgressText = (categories, categoryId) => {
      if (categoryId === "aux") {
        const aux1 = categories.find((cat) => cat.id === "auxiliary1");
        const aux2 = categories.find((cat) => cat.id === "auxiliary2");

        if (!aux1 && !aux2) return "-";

        // Fixed the operator precedence bug using parentheses
        const earned = (aux1 ? aux1.earned : 0) + (aux2 ? aux2.earned : 0);
        const required =
          (aux1 ? aux1.required : 0) + (aux2 ? aux2.required : 0);
        return `${earned} / ${required}`;
      }

      const category = categories.find((cat) => cat.id === categoryId);
      if (!category) return "-";
      return `${category.earned}${category.required === 0 ? "" : " / " + category.required}`;
    };

    // 3. Process each student row into comma-separated strings
    const csvRows = data.map((student) => {
      const { student_info, categories } = student;

      const rowFields = [
        student_info.student_id || "",
        student_info.name || "",
        student_info.major1 || "-",
        student_info.major2 || "-",
        student_info.auxiliary1 || "-",
        student_info.auxiliary2 || "-",
        getCategoryProgressText(categories, "major1"),
        getCategoryProgressText(categories, "major2"),
        getCategoryProgressText(categories, "aux"),
        getCategoryProgressText(categories, "out_department"),
        getCategoryProgressText(categories, "general_edu"),
        getCategoryProgressText(categories, "common_compulsory"),
        student_info.is_pass ? "通過" : "未通過",
      ];

      // Escape quotes and wrap each item in double quotes to prevent comma breaks
      return rowFields
        .map((field) => `="${String(field).replace(/"/g, '""')}"`)
        .join(",");
    });

    // 4. Assemble CSV strings with newlines
    const csvContent = [headers.join(","), ...csvRows].join("\n");

    // 5. Inject UTF-8 BOM (\uFEFF) so Microsoft Excel opens Chinese characters without breaking
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    // 6. Programmatically trigger a hidden browser download link
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Free memory allocation
  };

  return (
    <button onClick={handleExport} style={buttonStyle}>
      匯出 CSV 報表
    </button>
  );
}

// Matching component aesthetics
const buttonStyle = {
  backgroundColor: "#10B981", // Soft emerald green
  color: "#ffffff",
  border: "none",
  padding: "10px 18px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  transition: "background-color 0.2s ease",
};
