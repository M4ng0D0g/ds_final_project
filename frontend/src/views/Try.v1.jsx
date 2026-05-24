import React, { useState } from 'react';
import { 
  ArrowLeft, CheckCircle2, AlertTriangle, BookOpen, 
  GraduationCap, Globe, BookMarked, Layers, FileText,
  Calendar, Phone, Info
} from 'lucide-react';

// --- 結構化模擬資料 (完整保留原始資料結構) ---
const dashboardData = {
  totalRequired: 128,
  totalEarned: 110, 
  lastUpdated: '2026-05-08',
  catalogYear: '113學年度',
  categories: [
    {
      id: 'general',
      title: '通識課程',
      englishTitle: 'General Education',
      icon: Globe,
      themeClass: 'from-[#FF2A6D] via-[#A2388A] to-[#3D1D6D]',
      starColor: 'text-[#05FFD2]',
      required: 28,
      earned: 26,
      warnings: ['通識尚缺 2 學分'],
      items: [
        { name: '中文通', status: 'completed' },
        { name: '外文通', status: 'completed' },
        { name: '一般通識', status: 'completed' }
      ],
      detailId: 'g-total'
    },
    {
      id: 'core',
      title: '共同必修',
      englishTitle: 'Common Required',
      icon: BookMarked,
      themeClass: 'from-[#9B51E0] via-[#5A2493] to-[#1C0A35]',
      starColor: 'text-[#FFAD00]',
      required: 4, 
      earned: 4,
      unit: '門',
      warnings: [],
      items: [
        { name: '體育', status: 'completed' }
      ],
      detailId: 'c-total'
    },
    {
      id: 'major',
      title: '本系必修/群修',
      englishTitle: 'Department Core',
      icon: BookOpen,
      themeClass: 'from-[#FFAD00] via-[#D13B5A] to-[#1C0A35]',
      starColor: 'text-[#05FFD2]',
      required: 51, 
      earned: 45,
      warnings: [
        '必修：缺「作業系統」、「計算機結構與組織」',
        '群修：缺A群2門、B群1門、C群1門、D群1門、E群1門'
      ],
      items: [
        { name: '必修科目 (36學分)', status: 'warning' },
        { name: '群修科目 (15學分)', status: 'warning' },
        { name: '選修科目', status: 'neutral' }
      ],
      detailId: 'm1'
    },
    {
      id: 'outside',
      title: '外系選修',
      englishTitle: 'Elective Courses',
      icon: Layers,
      themeClass: 'from-[#E0407E] via-[#7A1F5C] to-[#16062E]',
      starColor: 'text-[#FFFF00]',
      required: 0, 
      earned: 15,
      warnings: [],
      items: [
        { name: '選修科目', status: 'neutral' }
      ],
      detailId: 'o1'
    }
  ]
};

// 模擬明細資料
const mockDetailRecords = {
  'g-total': [
    { semester: '110-1', name: '基礎國文', credit: 2, score: 85, type: '中文通', status: 'passed' },
    { semester: '110-2', name: '大一英文', credit: 2, score: 78, type: '外文通', status: 'passed' },
    { semester: '111-1', name: '哲學概論', credit: 2, score: 90, type: '一般', status: 'passed' },
  ],
  'm1': [
    { semester: '110-1', name: '計算機概論', credit: 3, score: 88, type: '必修', status: 'passed' },
    { semester: '110-2', name: '程式設計(一)', credit: 3, score: 92, type: '必修', status: 'passed' },
    { semester: '111-1', name: '資料結構', credit: 3, score: 75, type: '必修', status: 'passed' },
    { semester: '-', name: '作業系統', credit: 3, score: '-', type: '必修', status: 'missing' },
    { semester: '-', name: '計算機結構與組織', credit: 3, score: '-', type: '必修', status: 'missing' },
  ]
};

// --- 向量風格：閃爍四角星芒元件 ---
const SparkleIcon = ({ className = "w-4 h-4", color = "text-white" }) => (
  <svg className={`${className} ${color} animate-pulse`} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
  </svg>
);

// --- 質感噪點層（還原設計圖中高級的沙粒感） ---
const NoiseOverlay = () => (
  <div className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzRnJlcXVlbmN5PSIwLjY1IiBnum9tPSIzIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI24pIi8+PC9zdmc+')]"></div>
);

// --- 精緻復古粗外框進度條 ---
const ProgressBar = ({ current, max, colorClass }) => {
  const percentage = max > 0 ? Math.min(Math.round((current / max) * 100), 100) : 100;
  return (
    <div className="w-full bg-[#0B021A] rounded-xl h-5 p-0.5 border-2 border-[#3D1D6D] shadow-[2px_2px_0px_rgba(0,0,0,1)] overflow-hidden flex items-center">
      <div 
        className={`bg-gradient-to-r from-[#FF2A6D] to-[#FFAD00] h-full rounded-lg transition-all duration-1000 ease-out relative`} 
        style={{ width: `${percentage}%` }}
      >
        <NoiseOverlay />
      </div>
    </div>
  );
};

// --- 總覽頁面 (Dashboard) ---
const Dashboard = ({ onNavigate }) => {
  const totalPercentage = Math.round((dashboardData.totalEarned / dashboardData.totalRequired) * 100);

  return (
    <div className="space-y-8">
      {/* 頂部佈局：左側總進度卡片，右側第一類別卡片 (兩欄橫向排布) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 總畢業學分進度卡片 (佔比 2 欄) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#40123B] via-[#21092F] to-[#16062E] rounded-3xl p-6 md:p-8 border-2 border-[#5C2162] shadow-[4px_4px_0px_#000000] relative overflow-hidden flex flex-col justify-between">
          <NoiseOverlay />
          
          {/* 設計圖中的多層次背景向量裝飾物 */}
          <div className="absolute right-0 bottom-0 w-80 h-80 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-[#FF2A6D]/20 via-[#9B51E0]/5 to-transparent rounded-full pointer-events-none"></div>
          <div className="absolute top-6 right-8 flex gap-3">
            <SparkleIcon className="w-14 h-14 text-white opacity-80" />
            <SparkleIcon className="w-6 h-6 text-[#FFAD00] opacity-40 self-end" />
          </div>
          <div className="absolute bottom-12 left-6"><SparkleIcon className="w-8 h-8 text-white opacity-20" /></div>

          <div className="relative z-10 w-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#FFAD00] text-[#0B021A] rounded-xl border-2 border-black shadow-[2px_2px_0px_#000000]">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-wide">總畢業學分進度</h2>
            </div>
            
            {/* 數據主體：還原大尺寸黃字 */}
            <div className="my-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-[#A291B5] text-xs font-bold uppercase tracking-wider mb-1">Earned / Required Credits</p>
                <div className="text-4xl md:text-5xl font-black text-[#FFAD00] font-mono tracking-tight drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  {dashboardData.totalEarned} <span className="text-xl text-white font-sans font-bold">/ {dashboardData.totalRequired} 學分</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black px-2.5 py-1 rounded bg-[#FF2A6D]/20 border border-[#FF2A6D]/40 text-[#FF2A6D] inline-block mb-1">達成率</span>
                <div className="text-5xl md:text-6xl font-black text-white font-mono drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  {totalPercentage}%
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <ProgressBar current={dashboardData.totalEarned} max={dashboardData.totalRequired} />
            </div>
          </div>
        </div>

        {/* 右側：通識課程卡片 (精準對應設計圖右上角獨立卡片) */}
        {(() => {
          const cat = dashboardData.categories[0];
          return (
            <div key={cat.id} className="bg-[#1C0A35] rounded-3xl border-2 border-[#3D1D6D] shadow-[4px_4px_0px_#000000] overflow-hidden flex flex-col justify-between">
              <div>
                {/* 向量流體波浪標頭 */}
                <div className={`p-5 relative overflow-hidden border-b-2 border-[#3D1D6D] bg-gradient-to-r ${cat.themeClass}`}>
                  <NoiseOverlay />
                  <div className="absolute right-4 top-4"><SparkleIcon className="w-8 h-8" color={cat.starColor} /></div>
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2 rounded-xl bg-[#0B021A] border border-[#3D1D6D] text-white">
                      <cat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight">{cat.title}</h3>
                      <p className="text-white/60 text-[10px] font-bold uppercase font-mono tracking-wider">{cat.englishTitle}</p>
                    </div>
                  </div>
                </div>

                {/* 卡片內容 */}
                <div className="p-5 space-y-4">
                  <div className="text-sm text-gray-300 flex justify-between items-center font-semibold">
                    <span>已取得學分：</span>
                    <span className="text-[#FFAD00] font-mono font-bold text-base">{cat.earned} / {cat.required}</span>
                  </div>
                  
                  {/* 子項目列表 */}
                  <div className="space-y-2">
                    {cat.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2.5 bg-[#110426] border border-[#2D1654] rounded-xl text-gray-300 font-bold">
                        <span className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#FF2A6D]" />
                          {item.name}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-[#05FFD2]" />
                      </div>
                    ))}
                  </div>

                  {/* 警告區塊 */}
                  {cat.warnings.map((warn, idx) => (
                    <div key={idx} className="bg-[#FFAD00]/10 border border-[#FFAD00]/40 rounded-xl p-2.5 flex items-center gap-2 text-xs text-[#FFAD00] font-bold">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-[#110426] border-t border-[#2D1654]">
                <button
                  onClick={() => onNavigate(cat.detailId, cat.title)}
                  className="w-full py-2 rounded-xl text-xs font-black text-white bg-[#0B021A] border border-[#3D1D6D] hover:bg-[#FF2A6D] hover:border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5" /> 查看修課明細
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 下方區域：剩餘 3 個類別的網格佈局 (精準還原下方卡片矩陣) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dashboardData.categories.slice(1).map((cat) => (
          <div key={cat.id} className="bg-[#1C0A35] rounded-3xl border-2 border-[#3D1D6D] shadow-[4px_4px_0px_#000000] overflow-hidden flex flex-col justify-between">
            <div>
              {/* 卡片標頭：有機向量插畫風格 */}
              <div className={`p-5 relative overflow-hidden border-b-2 border-[#3D1D6D] bg-gradient-to-r ${cat.themeClass}`}>
                <NoiseOverlay />
                <div className="absolute right-4 top-4"><SparkleIcon className="w-7 h-7" color={cat.starColor} /></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="p-2 rounded-xl bg-[#0B021A] border border-[#3D1D6D] text-white">
                    <cat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight">{cat.title}</h3>
                    <p className="text-white/60 text-[10px] font-bold uppercase font-mono tracking-wider">{cat.englishTitle}</p>
                  </div>
                </div>
              </div>

              {/* 卡片內容 */}
              <div className="p-5 space-y-4">
                <div className="text-sm text-gray-300 flex justify-between items-center font-semibold">
                  <span>進度認證：</span>
                  <span className="text-[#05FFD2] font-mono font-bold text-base">
                    {cat.earned} / {cat.required} {cat.unit || '學分'}
                  </span>
                </div>

                {/* 子項目列表 */}
                <div className="space-y-2">
                  {cat.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2.5 bg-[#110426] border border-[#2D1654] rounded-xl text-gray-300 font-bold">
                      <span className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#9B51E0]" />
                        {item.name}
                      </span>
                      {item.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-[#05FFD2]" />}
                      {item.status === 'warning' && <AlertTriangle className="w-4 h-4 text-[#FFAD00]" />}
                      {item.status === 'neutral' && <div className="w-2 h-2 rounded-full bg-gray-600" />}
                    </div>
                  ))}
                </div>

                {/* 警告訊息區塊 */}
                {cat.warnings.length > 0 && (
                  <div className="bg-[#FF2A6D]/10 border border-[#FF2A6D]/30 rounded-xl p-3 flex items-start gap-2 text-xs text-[#FF2A6D] font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <ul className="space-y-1 list-none pl-0">
                      {cat.warnings.map((warn, idx) => (
                        <li key={idx}>✦ {warn}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* 卡片底部按鈕 */}
            <div className="p-4 bg-[#110426] border-t border-[#2D1654]">
              <button
                onClick={() => onNavigate(cat.detailId, cat.title)}
                className="w-full py-2 rounded-xl text-xs font-black text-white bg-[#0B021A] border border-[#3D1D6D] hover:bg-[#FF2A6D] hover:border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
              >
                <FileText className="w-3.5 h-3.5" /> 查看修課明細
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 明細頁面 (Detail View) ---
const DetailView = ({ detailId, title, onBack }) => {
  const records = mockDetailRecords[detailId] || [];

  return (
    <div className="bg-[#1C0A35] rounded-3xl border-2 border-[#3D1D6D] shadow-[4px_4px_0px_#000000] min-h-[500px] flex flex-col overflow-hidden">
      <NoiseOverlay />
      {/* 標頭 */}
      <div className="p-6 border-b border-[#3D1D6D] flex items-center gap-4 bg-[#110426]/90 backdrop-blur-md sticky top-0 z-10">
        <button 
          onClick={onBack}
          className="p-2.5 rounded-xl bg-[#0B021A] border border-[#3D1D6D] text-[#05FFD2] hover:bg-[#FF2A6D] hover:text-white hover:border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">{title}</h2>
          <p className="text-xs text-[#A291B5] font-bold uppercase tracking-wider mt-0.5">Course breakdown records</p>
        </div>
      </div>

      {/* 內容表格區 */}
      <div className="p-6 flex-grow bg-[#16062E]/30">
        {records.length > 0 ? (
          <div className="border border-[#3D1D6D] rounded-2xl overflow-hidden bg-[#0B021A] shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#110426] text-[#A291B5] text-xs font-black uppercase tracking-wider border-b border-[#3D1D6D]">
                    <th className="py-3 px-5">學期</th>
                    <th className="py-3 px-5">課程名稱</th>
                    <th className="py-3 px-5">類別</th>
                    <th className="py-3 px-5 text-center">學分</th>
                    <th className="py-3 px-5 text-center">成績</th>
                    <th className="py-3 px-5 text-center">狀態</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D1654] text-xs font-bold text-gray-300">
                  {records.map((record, idx) => (
                    <tr key={idx} className="hover:bg-[#1C0A35]/40 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-[#A291B5]">{record.semester}</td>
                      <td className="py-3.5 px-5 font-black text-white text-sm">{record.name}</td>
                      <td className="py-3.5 px-5">
                        <span className="bg-[#1C0A35] text-[#05FFD2] border border-[#3D1D6D] px-2 py-0.5 rounded text-[10px]">
                          {record.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center font-bold text-[#FFAD00]">{record.credit}</td>
                      <td className="py-3.5 px-5 text-center font-mono">{record.score}</td>
                      <td className="py-3.5 px-5 text-center">
                        {record.status === 'missing' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[#FF2A6D] bg-[#FF2A6D]/10 text-[10px] border border-[#FF2A6D]/30">
                            <AlertTriangle className="w-3 h-3" /> 缺修
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[#05FFD2] bg-[#05FFD2]/10 text-[10px] border border-[#05FFD2]/30">
                            <CheckCircle2 className="w-3 h-3" /> 通過
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-12 h-12 text-[#3D1D6D] mb-3" />
            <p className="text-base font-black text-white">尚無修課紀錄</p>
            <p className="text-xs text-[#A291B5] mt-1">目前該類別沒有任何已登記的課程資料</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- 主應用程式元件 ---
export default function App() {
  const [view, setView] = useState({ type: 'dashboard', detailId: null, title: '' });

  const navigateToDetail = (id, title) => {
    setView({ type: 'detail', detailId: id, title });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToDashboard = () => {
    setView({ type: 'dashboard', detailId: null, title: '' });
  };

  return (
    <div className="min-h-screen bg-[#0B021A] text-gray-100 font-sans relative pb-12 selection:bg-[#FF2A6D]/40">
      {/* 全局噪點和漂浮四角星芒背景 */}
      <NoiseOverlay />
      <div className="absolute top-12 left-10 pointer-events-none opacity-40"><SparkleIcon className="w-6 h-6 text-white" /></div>
      <div className="absolute bottom-24 right-12 pointer-events-none opacity-30"><SparkleIcon className="w-8 h-8 text-[#FFAD00]" /></div>

      {/* 頂部導覽列：還原設計圖中大膽的黃黑撞色標題 */}
      <header className="bg-[#110426]/90 backdrop-blur-md border-b-2 border-[#3D1D6D] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFAD00] border border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#000000]">
              <GraduationCap className="w-5 h-5 text-[#0B021A]" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">畢業學分檢核系統</h1>
              <p className="text-[10px] text-[#FFAD00] font-bold uppercase tracking-wider font-mono -mt-0.5">Graduation Credit Check System</p>
            </div>
          </div>
          <div>
            <span className="flex items-center gap-1.5 bg-[#1C0A35] border border-[#3D1D6D] px-3 py-1.5 rounded-xl font-black text-[#FFAD00] text-xs shadow-[2px_2px_0px_#000000]">
              <Calendar className="w-3.5 h-3.5" /> {dashboardData.catalogYear}
            </span>
          </div>
        </div>
      </header>

      {/* 聯絡與資訊橫幅 */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-6">
        <div className="bg-[#1C0A35] border border-[#3D1D6D] rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between text-xs font-bold text-gray-300 shadow-[3px_3px_0px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0B021A] rounded-xl border border-[#3D1D6D] text-[#05FFD2]">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white font-black text-sm">學分認定疑問？</p>
              <p className="text-[#A291B5] mt-0.5 flex flex-wrap items-center gap-x-4">
                <span className="flex items-center gap-1 text-[#05FFD2]"><Phone className="w-3.5 h-3.5" /> 註冊組: 02-29393091 分機 63279</span>
                <span>或洽詢系所承辦同仁</span>
              </p>
            </div>
          </div>
          <div className="text-[#A291B5] text-[10px] uppercase sm:text-right shrink-0">
            LAST UPDATED // <span className="text-white font-mono">{dashboardData.lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* 主要內容區 */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        {view.type === 'dashboard' ? (
          <Dashboard onNavigate={navigateToDetail} />
        ) : (
          <DetailView 
            detailId={view.detailId} 
            title={view.title} 
            onBack={navigateToDashboard} 
          />
        )}
      </main>
      
      {/* 頁尾 */}
      <footer className="max-w-6xl mx-auto px-4 md:px-8 pt-4 text-center text-[10px] font-bold text-[#A291B5] tracking-widest uppercase">
        <p>© 2026 DIGITAL CAMPUS // CREDIT CHECK MODULE</p>
      </footer>
    </div>
  );
}