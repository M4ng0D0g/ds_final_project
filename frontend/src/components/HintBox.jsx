import React from "react";

const HintBox = ({ selectedHint, onClose }) => {
  if (!selectedHint || !selectedHint.cat?.hint) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 50,
        bottom: 15,
        width: "240px",
        maxWidth: "calc(100vw - 48px)",
        background: "rgba(255,255,255,0.98)",
        border: "1px solid rgba(118, 92, 28, 0.16)",
        borderRadius: "22px",
        boxShadow: "0 20px 60px rgba(24, 28, 48, 0.16)",
        padding: "18px 18px 16px",
        zIndex: 35,
        animation: "hintFadeIn 260ms ease-out",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: "#6B4400",
                background: "#FFDE96",
                borderRadius: "999px",
                padding: "4px 10px",
              }}
            >
              {selectedHint.cat.title}
            </span>
          </div>
          <div
            style={{
              fontSize: "15px",
              fontWeight: 800,
              color: "#3A2000",
              marginBottom: "8px",
            }}
          >
            類別提示
          </div>
          <p
            style={{
              fontSize: "13px",
              lineHeight: 1.7,
              color: "#4F3C15",
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {selectedHint.cat.hint}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "rgba(58, 32, 0, 0.08)",
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            color: "#3A2000",
            fontSize: "18px",
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default HintBox;
