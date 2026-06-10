import React, { useState } from "react";
import { login, registerStudent } from "../api";

// Register Modal Component
const RegisterModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    password: "",
    password_confirm: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.id.trim()) {
      setError("學號不能為空");
      return;
    }
    if (!formData.name.trim()) {
      setError("名字不能為空");
      return;
    }
    if (!formData.password.trim()) {
      setError("密碼不能為空");
      return;
    }
    if (formData.password.length < 6) {
      setError("密碼長度至少 6 個字符");
      return;
    }
    if (formData.password !== formData.password_confirm) {
      setError("密碼和密碼確認不匹配");
      return;
    }

    setIsLoading(true);
    try {
      await registerStudent({
        id: formData.id,
        name: formData.name,
        password: formData.password,
        password_confirm: formData.password_confirm,
      });
      alert("註冊成功！");
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "註冊失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      id: "",
      name: "",
      password: "",
      password_confirm: "",
    });
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.36)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "40px",
          maxWidth: "480px",
          width: "90%",
          boxShadow: "0 4px 6px rgba(0,0,0,0.07), 0 10px 20px rgba(0,0,0,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#1a1a1a",
            marginTop: 0,
            marginBottom: "8px",
          }}
        >
          新用戶註冊
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "#666",
            marginTop: 0,
            marginBottom: "24px",
          }}
        >
          請填寫以下信息以建立帳戶
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
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
              學號
            </label>
            <input
              type="text"
              name="id"
              value={formData.id}
              onChange={handleChange}
              placeholder="輸入您的學號"
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
              名字
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="輸入您的名字"
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
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="輸入密碼（至少 6 個字符）"
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
              密碼確認
            </label>
            <input
              type="password"
              name="password_confirm"
              value={formData.password_confirm}
              onChange={handleChange}
              placeholder="再次輸入密碼"
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

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              marginTop: "8px",
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              style={{
                padding: "12px 24px",
                background: "#f5f5f5",
                color: "#1a1a1a",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.5 : 1,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.background = "#e8e8e8";
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#f5f5f5";
              }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: "12px 24px",
                background: "#4a90e2",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.background = "#357abd";
                  e.target.style.transform = "translateY(-1px)";
                  e.target.style.boxShadow =
                    "0 4px 12px rgba(74, 144, 226, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#4a90e2";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            >
              {isLoading ? "註冊中..." : "確認註冊"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Login Component
const Login = ({ onLogin }) => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const body = await login(id, password);
      const token =
        body?.data?.token ||
        body?.token ||
        (body && body.data && body.data.token);
      const role =
        body?.data?.user?.role || body?.data?.role || body?.role || "student";
      if (!token) {
        setError("No token returned");
        return;
      }
      onLogin(token, role);
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
          <div style={{ marginBottom: "12px" }}>需要幫助？聯絡系統管理員</div>
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            style={{
              background: "transparent",
              border: "1px solid #4a90e2",
              color: "#4a90e2",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(74, 144, 226, 0.05)";
              e.target.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
              e.target.style.transform = "translateY(0)";
            }}
          >
            新用戶註冊
          </button>
        </div>

        <RegisterModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={() => {
            setId("");
            setPassword("");
            setError("");
          }}
        />
      </div>
    </div>
  );
};

export default Login;
