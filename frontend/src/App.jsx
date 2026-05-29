import { useState, useEffect } from "react";
import Dashboard from "./views/Dashboard";
import DetailView from "./views/DetailView";
import Login from "./views/Login";

function App() {
  const [detail, setDetail] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) setToken(t);
  }, []);

  const handleLogin = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  if (!token) {
    return (
      <div
        style={{
          fontFamily: "'Noto Sans TC', 'PingFang TC', system-ui",
          minHeight: "100vh",
        }}
      >
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "'Noto Sans TC', 'PingFang TC', system-ui",
        minHeight: "100vh",
      }}
    >
      {detail ? (
        <DetailView
          category={detail}
          onBack={() => setDetail(null)}
          onLogout={handleLogout}
          token={token}
        />
      ) : (
        <Dashboard onDetail={setDetail} onLogout={handleLogout} token={token} />
      )}
    </div>
  );
}

export default App;
