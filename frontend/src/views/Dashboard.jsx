import React, { useState, useEffect, useRef, useMemo } from "react";
import CategoryCard from "../components/CategoryCard";
import { getDashboardSummary } from "../api";

const CATEGORY_COLORS = [
  { fromColor: "#FF8A3D", toColor: "#FF3D3D" },
  { fromColor: "#7A5CFF", toColor: "#4C2FFF" },
  { fromColor: "#2FD6C8", toColor: "#13A0AB" },
  { fromColor: "#F3CB4D", toColor: "#D29D2F" },
];

const mapBackendCategory = (category, index) => {
  const colors = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  const hint = category.hint?.trim();
  return {
    id: category.id,
    title: category.name,
    subtitle: hint || category.id,
    earned: category.earned || 0,
    required: category.required || 0,
    unit: "學分",
    status: category.earned < category.required ? "alert" : "ok",
    fromColor: colors.fromColor,
    toColor: colors.toColor,
    warnings: hint ? [hint] : [],
    items: [],
    records: [],
  };
};

// --- Decorative Components ---

const Star4 = ({ size, color, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    style={{ position: "absolute", pointerEvents: "none", zIndex: 1, ...style }}
  >
    <path
      d="M10 0 L11.9 8.1 L20 10 L11.9 11.9 L10 20 L8.1 11.9 L0 10 L8.1 8.1 Z"
      fill={color}
    />
  </svg>
);

const PlusCross = ({ size, color, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    style={{ position: "absolute", pointerEvents: "none", zIndex: 1, ...style }}
  >
    <rect x="6.5" y="0" width="3" height="16" rx="1.5" fill={color} />
    <rect x="0" y="6.5" width="16" height="3" rx="1.5" fill={color} />
  </svg>
);

const SaturnDeco = ({ style }) => (
  <svg
    width="52"
    height="52"
    viewBox="0 0 52 52"
    style={{ position: "absolute", pointerEvents: "none", zIndex: 1, ...style }}
  >
    <ellipse cx="26" cy="22" rx="13" ry="13" fill="#62C4DA" />
    <ellipse
      cx="26"
      cy="22"
      rx="22"
      ry="6.5"
      fill="none"
      stroke="#A0DFF0"
      strokeWidth="2.5"
    />
    <circle cx="26" cy="16" r="4" fill="rgba(255,255,255,0.25)" />
  </svg>
);

// --- Sub Components ---

const CenterSun = ({ data }) => {
  const [pct, setPct] = useState(0);
  const totalPct =
    data.totalRequired > 0
      ? Math.round((data.totalEarned / data.totalRequired) * 100)
      : 0;
  const radius = 94;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const t = setTimeout(() => setPct(totalPct), 400);
    return () => clearTimeout(t);
  }, [totalPct]);

  const sunStyle = {
    width: "195px",
    height: "195px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle at 36% 32%, #FFDE96 0%, #FA855A 52%, #C93638 100%)",
    boxShadow: `
      0 0 0 12px rgba(255,222,150,.2),
      0 0 0 26px rgba(255,222,150,.07),
      0 16px 56px rgba(201,54,56,.28)
    `,
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 15,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
  };

  const sheenStyle = {
    position: "absolute",
    top: "12%",
    left: "16%",
    width: "44%",
    height: "30%",
    background:
      "radial-gradient(ellipse, rgba(255,255,255,0.4) 0%, transparent 80%)",
    borderRadius: "50%",
    pointerEvents: "none",
  };

  return (
    <div style={sunStyle}>
      <div style={sheenStyle} />
      <svg
        width="195"
        height="195"
        viewBox="0 0 195 195"
        style={{ position: "absolute", transform: "rotate(-90deg)" }}
      >
        <circle
          cx="97.5"
          cy="97.5"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="6"
        />
        <circle
          cx="97.5"
          cy="97.5"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.82)"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (pct / 100) * circumference}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 1.5s cubic-bezier(.23,1,.32,1)",
          }}
        />
      </svg>
      <div style={{ zIndex: 1, textAlign: "center" }}>
        <div
          style={{
            fontSize: "10.5px",
            fontWeight: 800,
            color: "rgba(80,20,0,.65)",
            marginBottom: "4px",
          }}
        >
          總畢業學分進度
        </div>
        <div
          style={{
            fontSize: "24px",
            fontWeight: 900,
            color: "#3A1200",
            lineHeight: 1,
          }}
        >
          {data.totalEarned} / {data.totalRequired}
        </div>
        <div
          style={{
            fontSize: "10px",
            color: "rgba(80,20,0,.45)",
            marginTop: "2px",
          }}
        >
          學分
        </div>
        <div
          style={{
            fontSize: "27px",
            fontWeight: 900,
            color: "#3A1200",
            marginTop: "4px",
          }}
        >
          {totalPct}%
        </div>
      </div>
    </div>
  );
};

const OrbitSystem = ({ data, onDetail }) => {
  const RX = 370;
  const RY = 185;

  const [angles, setAngles] = useState([90, 0, 270, 180]);
  const anglesRef = useRef([90, 0, 270, 180]);
  const snappingRef = useRef(false);

  const snapToFront = (idx) => {
    if (snappingRef.current) return;
    const TARGET = 90;
    const currentAngle = anglesRef.current[idx];
    let diff = (((TARGET - currentAngle) % 360) + 360) % 360;
    if (diff > 180) diff -= 360;

    if (Math.abs(diff) < 1) return;

    snappingRef.current = true;
    const startAngles = [...anglesRef.current];
    const startTime = performance.now();
    const duration = 1000;

    const animateSnap = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const t = 1 - Math.pow(1 - progress, 4);

      const nextAngles = startAngles.map((a) => (a + diff * t + 360) % 360);
      anglesRef.current = nextAngles;
      setAngles(nextAngles);

      if (progress < 1) {
        requestAnimationFrame(animateSnap);
      } else {
        snappingRef.current = false;
      }
    };
    requestAnimationFrame(animateSnap);
  };

  const planets = useMemo(() => {
    return data.categories
      .map((cat, i) => {
        const angle = angles[i % angles.length];
        const rad = (angle * Math.PI) / 180;
        const x = RX * Math.cos(rad);
        const y = RY * Math.sin(rad);
        const depth = Math.sin(rad);
        const t = (depth + 1) / 2;
        const PMIN = 125;
        const PMAX = 145;
        const size = Math.round(PMIN + (PMAX - PMIN) * t);

        return { cat, x, y, depth, size, angle };
      })
      .sort((a, b) => a.depth - b.depth);
  }, [angles, data.categories]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "visible",
      }}
    >
      {/* 
        [1] 軌道 SVG 與主星球一樣，絕對置中於 50% 50%，保證兩者物理中心完美對齊。 
        使用絕對定位置中一個 0x0 點，再用 viewBox 向外擴展，為最穩定的做法。
      */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 0,
          height: 0,
          zIndex: 1,
        }}
      >
        <svg
          style={{
            position: "absolute",
            left: "-600px",
            top: "-600px",
            width: "1200px",
            height: "1200px",
            pointerEvents: "none",
            overflow: "visible",
          }}
          viewBox="-600 -600 1200 1200"
        >
          <g stroke="#C4A830" fill="none">
            {[
              { rx: 0.31, ry: 0.31, dash: [2, 7], op: 0.15, sw: 0.8 },
              { rx: 0.5, ry: 0.5, dash: [3, 8], op: 0.18, sw: 0.9 },
              { rx: 0.73, ry: 0.73, dash: [4, 9], op: 0.25, sw: 1 },
              { rx: 1, ry: 1, dash: [6, 8], op: 0.45, sw: 1.8 },
              { rx: 1.16, ry: 1.15, dash: [4, 10], op: 0.28, sw: 1 },
              { rx: 1.32, ry: 1.3, dash: [3, 12], op: 0.16, sw: 0.8 },
              { rx: 1.5, ry: 1.46, dash: [2, 14], op: 0.09, sw: 0.6 },
            ].map((cfg, i) => (
              <ellipse
                key={i}
                cx="0"
                cy="0"
                rx={RX * cfg.rx}
                ry={RY * cfg.ry}
                strokeDasharray={cfg.dash.join(" ")}
                opacity={cfg.op}
                strokeWidth={cfg.sw}
              />
            ))}
            <line
              x1={-RX * 1.3}
              x2={RX * 1.3}
              y1="0"
              y2="0"
              strokeWidth="0.4"
              opacity="0.12"
            />
            <line
              x1="0"
              x2="0"
              y1={-RY * 1.5}
              y2={RY * 1.5}
              strokeWidth="0.4"
              opacity="0.12"
            />

            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
              const r = (deg * Math.PI) / 180;
              const x = RX * Math.cos(r);
              const y = RY * Math.sin(r);
              const nx = Math.cos(r) * 12;
              const ny = Math.sin(r) * 12;
              return (
                <line
                  key={deg}
                  x1={x}
                  y1={y}
                  x2={x + nx}
                  y2={y + ny}
                  strokeWidth="1.2"
                  opacity="0.35"
                />
              );
            })}
          </g>
        </svg>
      </div>

      <CenterSun data={data} />

      {planets.map((p, i) => (
        <div
          key={p.cat.id}
          style={{
            position: "absolute",
            left: `calc(50% + ${p.x}px)`,
            top: `calc(50% + ${p.y}px)`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            transform: "translate(-50%, -50%)",
            zIndex: Math.round(p.depth * 10) + 20,
          }}
        >
          <CategoryCard
            cat={p.cat}
            size={p.size}
            depth={p.depth}
            onClick={() =>
              snapToFront(data.categories.findIndex((c) => c.id === p.cat.id))
            }
            onDetailClick={(id) =>
              onDetail(data.categories.find((cat) => cat.id === id))
            }
          />
        </div>
      ))}
    </div>
  );
};

// --- Main Dashboard Component ---

const Dashboard = ({ onDetail, token }) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getDashboardSummary(token);
        const summary = result?.data;
        if (!summary) {
          throw new Error("Invalid summary response");
        }

        const mappedCategories = summary.categories.map(mapBackendCategory);
        const totalEarned = mappedCategories.reduce(
          (sum, cat) => sum + cat.earned,
          0,
        );
        const totalRequired = mappedCategories.reduce(
          (sum, cat) => sum + cat.required,
          0,
        );
        const now = new Date();

        setDashboard({
          studentInfo: summary.student_info,
          categories: mappedCategories,
          totalEarned,
          totalRequired,
          lastUpdated: now.toLocaleDateString("zh-TW"),
          catalogYear: now.getFullYear(),
        });
      } catch (err) {
        setError(err.message || "無法取得儀表板資料");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B021A",
          color: "#fff",
        }}
      >
        <div>載入中，請稍候...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B021A",
          color: "#fff",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "520px", textAlign: "center" }}>
          <p
            style={{
              marginBottom: "16px",
              fontSize: "20px",
              fontWeight: "900",
            }}
          >
            讀取儀表板失敗
          </p>
          <p style={{ marginBottom: "24px" }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              borderRadius: "12px",
              border: "none",
              background: "#FFAD00",
              color: "#0B021A",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  const data = dashboard;

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#F6FFEA",
        position: "relative",
      }}
    >
      {/* Background Decor */}
      <div
        style={{
          position: "absolute",
          top: "-50px",
          left: "-50px",
          width: "340px",
          height: "340px",
          borderRadius: "50%",
          background: "rgba(255,222,150,.18)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-100px",
          right: "-50px",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background: "rgba(98,196,218,.10)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "40%",
          right: "10%",
          width: "220px",
          height: "220px",
          borderRadius: "50%",
          background: "rgba(250,133,90,.09)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      <Star4 size={18} color="#C93638" style={{ top: "15%", left: "12%" }} />
      <Star4 size={12} color="#C93638" style={{ top: "25%", left: "25%" }} />
      <Star4 size={22} color="#62C4DA" style={{ top: "10%", left: "80%" }} />
      <Star4 size={14} color="#C93638" style={{ bottom: "20%", left: "15%" }} />
      <Star4
        size={10}
        color="#C93638"
        style={{ bottom: "15%", right: "25%" }}
      />
      <Star4 size={16} color="#62C4DA" style={{ top: "60%", left: "5%" }} />
      <Star4 size={12} color="#C93638" style={{ bottom: "40%", right: "8%" }} />
      <Star4 size={20} color="#C93638" style={{ top: "45%", left: "85%" }} />
      <Star4 size={15} color="#C93638" style={{ top: "8%", left: "45%" }} />
      <Star4 size={11} color="#62C4DA" style={{ bottom: "8%", left: "40%" }} />

      <PlusCross
        size={16}
        color="#C8A030"
        style={{ top: "35%", left: "18%" }}
      />
      <PlusCross
        size={14}
        color="#C8A030"
        style={{ bottom: "30%", right: "12%" }}
      />
      <PlusCross
        size={18}
        color="#C8A030"
        style={{ top: "20%", right: "35%" }}
      />

      <SaturnDeco style={{ top: "50px", right: "10%" }} />

      {/* Header */}
      <header
        style={{
          flexShrink: 0,
          padding: "24px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          zIndex: 10,
        }}
      >
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 800,
              color: "#8B7030",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Credit Planet map //
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "4px",
            }}
          >
            <h1
              style={{
                fontSize: "26px",
                fontWeight: 900,
                color: "#3A2000",
                margin: 0,
              }}
            >
              學分星球
            </h1>
            <div
              style={{
                background: "#FFDE96",
                color: "#6B4400",
                borderRadius: "8px",
                padding: "3px 10px",
                fontSize: "13px",
                fontWeight: 800,
              }}
            >
              {data.catalogYear}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            style={{
              background: "#FFDE96",
              border: "2px solid #C8A820",
              borderRadius: "10px",
              padding: "8px 16px",
              fontWeight: 800,
              color: "#6B4400",
              cursor: "pointer",
            }}
          >
            Contact
          </button>
          <button
            style={{
              border: "2px solid #C8A840",
              borderRadius: "10px",
              padding: "8px 10px",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "2px",
                background: "#8B7030",
                borderRadius: "2px",
              }}
            />
            <div
              style={{
                width: "20px",
                height: "2px",
                background: "#8B7030",
                borderRadius: "2px",
              }}
            />
            <div
              style={{
                width: "15px",
                height: "2px",
                background: "#8B7030",
                borderRadius: "2px",
              }}
            />
          </button>
        </div>
      </header>

      {/* Orbit Container */}
      <div
        style={{
          flex: 1,
          position: "relative",
          zIndex: 5,
          transform: "translateY(-60px)",
        }}
      >
        <OrbitSystem data={data} onDetail={onDetail} />
      </div>

      {/* Footer */}
      <footer
        style={{
          padding: "20px",
          textAlign: "center",
          fontSize: "11px",
          color: "#9A8050",
          zIndex: 10,
        }}
      >
        最後更新：{data.lastUpdated} | 系統維護：(02) 2345-6789 #123
      </footer>
    </div>
  );
};

export default Dashboard;
