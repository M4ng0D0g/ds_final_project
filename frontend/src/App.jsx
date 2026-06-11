import { useState, useEffect } from "react";
import Dashboard from "./views/Dashboard";
import TeacherDashboard from "./views/TeacherDashboard";
import DetailView from "./views/DetailView";
import Login from "./views/Login";

function App() {
  const [detail, setDetail] = useState(null);
  const [token, setToken] = useState(null);
  const [userRole, setUserRole] = useState("student");
  const [planetAngles, setPlanetAngles] = useState([90, 0, 270, 180]);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const role = localStorage.getItem("userRole") || "student";
    if (t) setToken(t);
    setUserRole(role);
  }, []);

  const handleLogin = (newToken, role = "student") => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("userRole", role);
    setToken(newToken);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    setToken(null);
    setUserRole("student");
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

  if (userRole === "teacher") {
    return (
      <div
        style={{
          fontFamily: "'Noto Sans TC', 'PingFang TC', system-ui",
          minHeight: "100vh",
        }}
      >
        <TeacherDashboard onLogout={handleLogout} token={token} />
      </div>
    );
  }

  // Render the student dashboard and detail view overlay.
  return (
    <div
      style={{
        fontFamily: "'Noto Sans TC', 'PingFang TC', system-ui",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transition: "opacity 320ms ease",
          opacity: detail ? 0.28 : 1,
          pointerEvents: detail ? "none" : "auto",
        }}
      >
        <Dashboard
          onDetail={setDetail}
          onLogout={handleLogout}
          token={token}
          role={userRole}
          planetAngles={planetAngles}
          setPlanetAngles={setPlanetAngles}
        />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          transition:
            "transform 420ms cubic-bezier(.22,1,.36,1), opacity 320ms ease",
          transform: detail ? "translateY(0)" : "translateY(100%)",
          opacity: detail ? 1 : 0,
          pointerEvents: detail ? "auto" : "none",
          overflowY: "auto",
        }}
      >
        <DetailView
          category={detail}
          onBack={() => setDetail(null)}
          onLogout={handleLogout}
          token={token}
        />
      </div>
    </div>
  );
}

export default App;
