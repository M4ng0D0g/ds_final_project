import React, { useState } from "react";
import { login } from "../api";

const Login = ({ onLogin }) => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const body = await login(id, password);
      const token =
        body?.data?.token ||
        body?.token ||
        (body && body.data && body.data.token);
      if (!token) {
        setError("No token returned");
        return;
      }
      onLogin(token);
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)",
        fontFamily: "'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "48px 40px",
          background: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.07), 0 10px 20px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#1a1a1a",
              margin: "0 0 8px 0",
              letterSpacing: "-0.5px",
            }}
          >
            學分星球
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#666",
              margin: 0,
            }}
          >
            登入您的帳號
          </p>
        </div>

        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#333",
                marginBottom: "8px",
              }}
            >
              帳號
            </label>
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="輸入您的帳號"
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: "14px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                boxSizing: "border-box",
                transition: "all 0.2s ease",
                outline: "none",
                background: "#fafafa",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#4a90e2";
                e.target.style.boxShadow = "0 0 0 3px rgba(74, 144, 226, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#ddd";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#333",
                marginBottom: "8px",
              }}
            >
              密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="輸入您的密碼"
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: "14px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                boxSizing: "border-box",
                transition: "all 0.2s ease",
                outline: "none",
                background: "#fafafa",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#4a90e2";
                e.target.style.boxShadow = "0 0 0 3px rgba(74, 144, 226, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#ddd";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "12px 14px",
                background: "#fee",
                border: "1px solid #fcc",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#c33",
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              padding: "12px 16px",
              background: "#4a90e2",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              marginTop: "8px",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#357abd";
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 12px rgba(74, 144, 226, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#4a90e2";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            登入
          </button>
        </form>

        <div
          style={{
            marginTop: "24px",
            paddingTop: "24px",
            borderTop: "1px solid #eee",
            textAlign: "center",
            fontSize: "12px",
            color: "#999",
          }}
        >
          需要幫助？聯絡系統管理員
        </div>
      </div>
    </div>
  );
};

export default Login;
