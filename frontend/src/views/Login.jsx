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
    <div className="min-h-screen flex items-center justify-center bg-[#0B021A] text-gray-100">
      <div className="w-full max-w-md p-8 bg-[#140425]/80 border border-[#3D1D6D] rounded-2xl shadow-lg">
        <h2 className="text-2xl font-black mb-4">登入系統</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-[#A291B5]">帳號</label>
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full mt-1 p-2 rounded-md bg-[#0B021A] border border-[#3D1D6D]"
            />
          </div>
          <div>
            <label className="text-xs text-[#A291B5]">密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 p-2 rounded-md bg-[#0B021A] border border-[#3D1D6D]"
            />
          </div>
          {error && <div className="text-sm text-[#FF6B6B]">{error}</div>}
          <div className="flex justify-between items-center">
            <button
              type="submit"
              className="px-4 py-2 bg-[#FFAD00] text-[#0B021A] font-bold rounded-xl"
            >
              登入
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
