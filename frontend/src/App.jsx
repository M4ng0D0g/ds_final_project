import { useState } from "react";
import Dashboard from "./views/Dashboard";
import DetailView from "./views/DetailView";

function App() {
  const [detail, setDetail] = useState(null);

  return (
    <div style={{ fontFamily: "'Noto Sans TC', 'PingFang TC', system-ui", minHeight: '100vh' }}>
      {detail ? (
        <DetailView catId={detail} onBack={() => setDetail(null)} />
      ) : (
        <Dashboard onDetail={setDetail} />
      )}
    </div>
  );
}

export default App;
