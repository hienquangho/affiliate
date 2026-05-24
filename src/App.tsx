import { useState, useEffect } from "react";
import { 
  Home, 
  Sparkles, 
  Video, 
  Wand2, 
  ShieldAlert, 
  LayoutGrid, 
  TrendingUp, 
  Clock, 
  RefreshCw, 
  ListCollapse, 
  Rocket, 
  ChevronRight,
  ExternalLink,
  BookOpen,
  FolderOpen,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  Heart,
  X
} from "lucide-react";
import BrandBuilder from "./components/BrandBuilder";
import ScriptWriter from "./components/ScriptWriter";
import ScriptOptimizer from "./components/ScriptOptimizer";
import ContentScanner from "./components/ContentScanner";
import { getHistory } from "./utils/storage";
import { SubAppId } from "./types";
import { verifyLicenseClient } from "./utils/license";

interface RecentProjectItem {
  id: string;
  appId: SubAppId;
  appName: string;
  title: string;
  createdAt: string;
  badgeColor: string;
}

export default function App() {
  const [isLicenseVerified, setIsLicenseVerified] = useState<boolean>(false);
  const [isLicenseChecking, setIsLicenseChecking] = useState<boolean>(true);
  const [licenseInput, setLicenseInput] = useState<string>("");
  const [licenseError, setLicenseError] = useState<string>("");

  useEffect(() => {
    const verifyStoredLicense = async () => {
      const stored = localStorage.getItem("app_license_key");
      if (!stored) {
        setIsLicenseChecking(false);
        setIsLicenseVerified(false);
        return;
      }
      
      // Try instant, secure client-side SHA-256 check first (essential for GitHub Pages)
      const isClientValid = await verifyLicenseClient(stored);
      if (isClientValid) {
        setIsLicenseVerified(true);
        setIsLicenseChecking(false);
        return;
      }

      try {
        const response = await fetch("/api/verify-license", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: stored.trim() })
        });
        const data = await response.json();
        if (data.valid) {
          setIsLicenseVerified(true);
        } else {
          localStorage.removeItem("app_license_key");
          setIsLicenseVerified(false);
        }
      } catch (err) {
        // If server is not reachable (like on static GitHub Pages), we trust the client-side check.
        // Since client-side check already failed above, we default to false.
        setIsLicenseVerified(false);
      } finally {
        setIsLicenseChecking(false);
      }
    };
    verifyStoredLicense();
  }, []);

  const handleVerifyNewLicense = async (keyToVerify: string) => {
    const trimmed = keyToVerify.trim();
    if (!trimmed) {
      setLicenseError("Vui lòng nhập License Key.");
      return;
    }
    setIsLicenseChecking(true);
    setLicenseError("");

    // Try client-side SHA-256 first
    const isClientValid = await verifyLicenseClient(trimmed);
    if (isClientValid) {
      localStorage.setItem("app_license_key", trimmed);
      setIsLicenseVerified(true);
      setIsLicenseChecking(false);
      return;
    }

    try {
      const response = await fetch("/api/verify-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: trimmed })
      });
      const data = await response.json();
      if (data.valid) {
        localStorage.setItem("app_license_key", trimmed);
        setIsLicenseVerified(true);
      } else {
        setLicenseError(data.error || "Hãy liên hệ với Zalo: 0979.460.605 để được hỗ trợ.");
      }
    } catch (err) {
      setLicenseError("Hãy liên hệ với Zalo: 0979.460.605 để được hỗ trợ.");
    } finally {
      setIsLicenseChecking(false);
    }
  };

  const [activeTab, setActiveTab] = useState<"home" | SubAppId>("home");
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem("global_gemini_api_key") || "";
  });
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const [recentProjects, setRecentProjects] = useState<RecentProjectItem[]>([]);
  const [stats, setStats] = useState({
    brandCount: 0,
    writerCount: 0,
    optimizerCount: 0,
    scannerCount: 0
  });

  const handleSaveApiKey = (key: string) => {
    const sanitized = key.trim();
    setCustomApiKey(sanitized);
    if (sanitized) {
      localStorage.setItem("global_gemini_api_key", sanitized);
    } else {
      localStorage.removeItem("global_gemini_api_key");
    }
  };

  const [homeKeyInput, setHomeKeyInput] = useState(customApiKey);
  const [showHomeKey, setShowHomeKey] = useState(false);

  // Sync home key input when global key changes
  useEffect(() => {
    setHomeKeyInput(customApiKey);
  }, [customApiKey]);

  // Load and consolidate stats/recent list from localStorage
  const loadDataSummary = () => {
    const bbList = getHistory<any>("brand-builder");
    const swList = getHistory<any>("script-writer");
    const soList = getHistory<any>("script-optimizer");
    const csList = getHistory<any>("content-scanner");

    setStats({
      brandCount: bbList.length,
      writerCount: swList.length,
      optimizerCount: soList.length,
      scannerCount: csList.length
    });

    const consolidated: RecentProjectItem[] = [];

    bbList.forEach(item => {
      consolidated.push({
        id: item.id,
        appId: "brand-builder",
        appName: "Tạo Thương Hiệu",
        title: item.title,
        createdAt: item.createdAt,
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      });
    });

    swList.forEach(item => {
      consolidated.push({
        id: item.id,
        appId: "script-writer",
        appName: "Kịch Bản TikTok V2",
        title: item.title,
        createdAt: item.createdAt,
        badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
      });
    });

    soList.forEach(item => {
      consolidated.push({
        id: item.id,
        appId: "script-optimizer",
        appName: "Sửa Kịch Bản",
        title: item.title,
        createdAt: item.createdAt,
        badgeColor: "bg-pink-500/10 text-pink-400 border-pink-500/20"
      });
    });

    csList.forEach(item => {
      consolidated.push({
        id: item.id,
        appId: "content-scanner",
        appName: "Quét Trùng Lặp",
        title: item.title,
        createdAt: item.createdAt,
        badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20"
      });
    });

    // Sort by chronological order (newest first)
    consolidated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setRecentProjects(consolidated.slice(0, 5));
  };

  useEffect(() => {
    loadDataSummary();
  }, [activeTab]);

  if (isLicenseChecking) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-slate-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-bold tracking-wider uppercase animate-pulse">Đang đồng bộ...</span>
        </div>
      </div>
    );
  }

  if (!isLicenseVerified) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-slate-100 flex items-center justify-center font-sans p-4 relative overflow-hidden">
        {/* Ambient background blur circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/5 blur-[120px] rounded-full"></div>

        <div className="bg-[#121216] border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md relative z-10 shadow-2xl">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-white uppercase">License Key</h1>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <input
                  type="text"
                  value={licenseInput}
                  onChange={(e) => setLicenseInput(e.target.value)}
                  placeholder="Nhập License Key..."
                  className="w-full bg-[#1c1c24] border border-slate-800/80 focus:border-indigo-500/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition text-center font-mono tracking-wider"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleVerifyNewLicense(licenseInput);
                    }
                  }}
                />
              </div>

              {licenseError && (
                <div className="text-xs text-rose-400 font-medium bg-rose-500/5 p-3 border border-rose-500/10 rounded-xl text-center leading-relaxed">
                  {licenseError}
                </div>
              )}

              <button
                onClick={() => handleVerifyNewLicense(licenseInput)}
                className="w-full cursor-pointer bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-sm font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-indigo-500/15 transition-all text-center uppercase tracking-wide"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-100 font-sans flex flex-col md:flex-row">
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-full md:w-24 shrink-0 bg-[#121216] border-b md:border-b-0 md:border-r border-slate-800/80 p-4 md:py-8 flex flex-row md:flex-col items-center justify-between md:justify-start md:gap-12 sticky top-0 z-50">
        
        {/* LOGO */}
        <div 
          onClick={() => setActiveTab("home")}
          className="flex items-center gap-3 md:flex-col md:gap-2 cursor-pointer group"
        >
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10 group-hover:scale-105 transition">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <span className="md:hidden font-bold text-sm text-gradient bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            AF-Hub
          </span>
        </div>

        {/* NAV ROUTERS */}
        <nav className="flex flex-row md:flex-col gap-1 md:gap-4 items-center">
          {/* Home */}
          <button
            onClick={() => setActiveTab("home")}
            className={`p-3 rounded-xl transition ${
              activeTab === "home" 
                ? "bg-slate-800 text-indigo-400" 
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
            title="Trang chủ Hub"
          >
            <Home className="w-5 h-5" />
          </button>

          {/* Builder */}
          <button
            onClick={() => setActiveTab("brand-builder")}
            className={`p-3 rounded-xl transition ${
              activeTab === "brand-builder" 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" 
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
            title="Tạo Thương Hiệu"
          >
            <Sparkles className="w-5 h-5" />
          </button>

          {/* Script Writer */}
          <button
            onClick={() => setActiveTab("script-writer")}
            className={`p-3 rounded-xl transition ${
              activeTab === "script-writer" 
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/10" 
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
            title="Tạo Kịch Bản Affiliate"
          >
            <Video className="w-5 h-5" />
          </button>

          {/* Optimizer */}
          <button
            onClick={() => setActiveTab("script-optimizer")}
            className={`p-3 rounded-xl transition ${
              activeTab === "script-optimizer" 
                ? "bg-pink-500/10 text-pink-400 border border-pink-500/10" 
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
            title="Chỉnh Sửa Kịch Bản"
          >
            <Wand2 className="w-5 h-5" />
          </button>

          {/* Scanner */}
          <button
            onClick={() => setActiveTab("content-scanner")}
            className={`p-3 rounded-xl transition ${
              activeTab === "content-scanner" 
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/10" 
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
            title="Dò Quét Trùng Lặp"
          >
            <ShieldAlert className="w-5 h-5" />
          </button>
        </nav>

        {/* BOTTOM USER DECORATOR */}
        <div className="hidden md:block mt-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
            AM
          </div>
        </div>
      </aside>

      {/* MAIN WORKSPACE VIEW */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full transition-all">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Chú Hiển MMO - Affiliate Hub Master
              </h1>
              <span className="text-[10px] font-bold bg-[#1d1d24] border border-slate-800 text-indigo-400 px-2 py-0.5 rounded-full">
                All-in-One
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Hệ sinh thái thông minh sáng tạo nội dung, kịch bản & phòng chống gậy TikTok / Shopee Mall
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold tracking-wide uppercase">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              Live Model Core
            </span>
            <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>
            
            {/* API KEY CONFIGURATION BUTTON */}
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className={`p-1 px-3 border rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1.5 transition ${
                customApiKey 
                  ? "bg-emerald-600/10 hover:bg-emerald-600/20 border-emerald-500/30 text-emerald-400" 
                  : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Cấu hình Gemini API Key của riêng bạn"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Cấu hình API {customApiKey ? "● Đang dùng" : ""}</span>
            </button>

            <button 
              onClick={loadDataSummary} 
              className="p-1 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white text-xs font-medium cursor-pointer flex items-center gap-1.5 transition"
              title="Đồng bộ hóa các thay đổi mới"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Cập nhật</span>
            </button>
          </div>
        </header>

        {/* CONTAINER SWITCHES */}
        {activeTab === "home" && (
          <div className="space-y-8 animate-fade-in">
            {/* Bento Grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

              {/* PRIMARY BENTO: WRITE SCRIPT (col-span-8) */}
              <div 
                onClick={() => setActiveTab("script-writer")}
                className="md:col-span-8 bg-gradient-to-br from-indigo-950/20 via-[#121216]/90 to-[#121216] border border-indigo-500/20 hover:border-indigo-500/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group cursor-pointer transition duration-300 min-h-[260px] shadow-xl"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full group-hover:bg-indigo-500/10 transition-all duration-500"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-md">
                    <Video className="w-6 h-6" />
                  </div>
                  <div className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-400/10 px-2.5 py-1 border border-indigo-500/20 rounded-full">
                    Kịch Bản Tiktok Aff V2.0
                  </div>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-indigo-300 transition">
                    Viết Kịch Bản TikTok Affiliate
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl">
                    Tạo kịch bản TikTok Affiliate chuyên nghiệp bán hàng cực đỉnh chỉ trong tích tắc. Được lập trình mốc thời gian, mỏ húc (Hook) mượt mà đi liền cùng Call-to-Action.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                    Đã lưu trữ: <span className="font-extrabold text-indigo-400">{stats.writerCount} kịch bản</span>
                  </span>
                  <span className="text-indigo-400 group-hover:translate-x-1.5 transition text-xs font-bold flex items-center gap-1">
                    Lên kịch bản ngay <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* BENTO SECONDARY: CREATE NEW CHANNELS (col-span-4) */}
              <div 
                onClick={() => setActiveTab("brand-builder")}
                className="md:col-span-4 bg-[#121216] border border-slate-800/80 hover:border-emerald-500/30 rounded-3xl p-6 flex flex-col justify-between group cursor-pointer transition duration-300 min-h-[260px]"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-600/10 border border-emerald-500/20 rounded-xl text-emerald-400 shadow-sm">
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-300 transition">
                    Xây Dựng Kênh Thương Hiệu
                  </h2>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                    Định vị màu sắc, tiểu sử, trụ cột nội dung dài hạn và ý tưởng đột phá 3 ngày đầu tiên. Phù hợp cho ngách kênh mới từ con số 0.
                  </p>
                </div>

                <div className="mt-6">
                  <div className="h-1.5 w-full bg-slate-900 rounded-full mb-3 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, Math.max(15, stats.brandCount * 25))}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-bold font-mono">
                    <span>Đã tạo: {stats.brandCount}</span>
                    <span>Optimized AI</span>
                  </div>
                </div>
              </div>

              {/* BENTO THIRDLY: SCRIPT RE-WRITER (col-span-4) */}
              <div 
                onClick={() => setActiveTab("script-optimizer")}
                className="md:col-span-4 bg-[#121216] border border-slate-800/80 hover:border-pink-500/30 rounded-3xl p-6 flex flex-col justify-between group cursor-pointer transition duration-300 min-h-[220px]"
              >
                <div className="p-3 bg-pink-600/10 border border-pink-500/20 rounded-xl text-pink-400 shadow-sm w-max">
                  <Wand2 className="w-6 h-6" />
                </div>

                <div className="my-3">
                  <h2 className="text-base font-bold text-white mb-1.5 group-hover:text-pink-300 transition">
                    Tối ưu & Sửa Kịch Bản
                  </h2>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                    Tối ưu hóa và cải thiện kịch bản sẵn có để tăng tỉ lệ chuyển đổi đơn hàng Affiliate mà không làm mất tính tự nhiên của thoại.
                  </p>
                </div>

                <span className="text-pink-400 text-xs font-bold flex items-center gap-1 group-hover:gap-1.5 transition-all">
                  Mở chế bản <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* BENTO FOURTH: DUPLICATION POLICY SCANNER (col-span-4) */}
              <div 
                onClick={() => setActiveTab("content-scanner")}
                className="md:col-span-4 bg-[#121216] border border-slate-800/80 hover:border-amber-500/30 rounded-3xl p-6 flex flex-col justify-between group cursor-pointer transition duration-300 min-h-[220px]"
              >
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 shadow-sm w-max">
                  <ShieldAlert className="w-5 h-5" />
                </div>

                <div className="my-3">
                  <h2 className="text-base font-bold text-white mb-1.5 group-hover:text-amber-300 transition">
                    Quét Trùng Lặp & Từ Cấm
                  </h2>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                    TikTok Safe Content Auditor: Rà soát từ cấm chính sách, lọc từ vựng sáo rỗng để chống quét trùng lặp và tránh bóp tương tác.
                  </p>
                </div>

                <div className="flex justify-between items-center text-[10px] uppercase font-mono text-slate-600">
                  <span>Scanner v2.5</span>
                  <span className="text-amber-500">Đã lưu: {stats.scannerCount} bản quét</span>
                </div>
              </div>

              {/* BENTO FIFTH: TIMELINE AGGREGATOR OF RECENT PROJECT RUNS (col-span-4) */}
              <div className="md:col-span-4 bg-[#121216]/50 border border-slate-800/80 rounded-3xl p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/50">
                  <div className="flex items-center gap-1 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Dự án gần đây</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Mới nhất</span>
                </div>

                {recentProjects.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <FolderOpen className="w-8 h-8 text-slate-700 mb-2" />
                    <p className="text-[11px] text-slate-500 max-w-[180px]">
                      Chưa ghi nhận dữ liệu tại các ứng dụng con. Lịch sử của bạn sẽ tự quy tụ tại đây.
                    </p>
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col gap-2.5 overflow-y-auto max-h-[148px] pr-1">
                    {recentProjects.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setActiveTab(p.appId)}
                        className="flex flex-col p-2.5 bg-slate-900/60 border border-slate-800/60 rounded-xl hover:border-slate-700 transition cursor-pointer"
                        title={`Bấm để chuyển nhanh qua ứng dụng: ${p.appName}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-bold tracking-tight truncate line-clamp-1 text-white">
                            {p.title}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1 text-[8px] text-slate-500 font-medium">
                          <span className={`px-1 rounded ${p.badgeColor}`}>
                            {p.appName}
                          </span>
                          <span>
                            {new Date(p.createdAt).toLocaleDateString("vi-VN", { month: "numeric", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* EXPANDING SEGMENT FOOTER: MULTIPLATFORM STATS BOX */}
            <div className="bg-[#121216] border border-slate-800 rounded-3xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">Học Viện Kinh Doanh Affiliate Pro & Tài Liệu Link</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400">
                <div className="p-3 bg-slate-900/40 rounded-2xl border border-slate-800">
                  <span className="font-bold text-slate-200 block mb-1">1. Bộ lọc TikTok Shop 2026</span>
                  <p className="leading-relaxed">Tránh cam kết 100%, tránh từ ngữ chuẩn đoán tương đương bác sĩ chuyên khoa hoặc bòn rút danh tiếng nhãn hàng khác.</p>
                </div>
                <div className="p-3 bg-slate-900/40 rounded-2xl border border-slate-800">
                  <span className="font-bold text-slate-200 block mb-1">2. Thuật toán quét trùng lặp</span>
                  <p className="leading-relaxed">Tiktok đánh giá Audio đè (Voice-over) rất nặng. Nên sửa kịch bản có ít nhất 40% câu thoại nói khác hẳn mẫu thô nhà cung cấp đưa ra.</p>
                </div>
                <div className="p-3 bg-slate-900/40 rounded-2xl border border-slate-800">
                  <span className="font-bold text-slate-200 block mb-1">3. Định dạng giỏ hàng mượt</span>
                  <p className="leading-relaxed">Không ghim link trực tiếp thô bạo. Hãy khéo léo lồng ghép: "Toàn bộ món đồ này mình cập nhật trong góc nhỏ bên trái màn hình nha".</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB APP SCREEN WRAPPERS */}
        {activeTab === "brand-builder" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 text-xs font-bold uppercase text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> 
                Đang mở: Xây dựng thương hiệu mới
              </span>
              <button 
                onClick={() => setActiveTab("home")} 
                className="hover:text-indigo-400 flex items-center gap-1 transition"
              >
                Quay về trang chủ ➡
              </button>
            </div>
            <BrandBuilder customApiKey={customApiKey} onSaveApiKey={handleSaveApiKey} />
          </div>
        )}

        {activeTab === "script-writer" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 text-xs font-bold uppercase text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span> 
                Đang mở: Viết kịch bản TikTok Affiliate
              </span>
              <button 
                onClick={() => setActiveTab("home")} 
                className="hover:text-indigo-400 flex items-center gap-1 transition"
              >
                Quay về trang chủ ➡
              </button>
            </div>
            <ScriptWriter customApiKey={customApiKey} onSaveApiKey={handleSaveApiKey} />
          </div>
        )}

        {activeTab === "script-optimizer" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 text-xs font-bold uppercase text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span> 
                Đang mở: Sửa kịch bản cũ
              </span>
              <button 
                onClick={() => setActiveTab("home")} 
                className="hover:text-indigo-400 flex items-center gap-1 transition"
              >
                Quay về trang chủ ➡
              </button>
            </div>
            <ScriptOptimizer customApiKey={customApiKey} onSaveApiKey={handleSaveApiKey} />
          </div>
        )}

        {activeTab === "content-scanner" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 text-xs font-bold uppercase text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> 
                Đang mở: Đo quét chính sách mờ & trùng lặp
              </span>
              <button 
                onClick={() => setActiveTab("home")} 
                className="hover:text-indigo-400 flex items-center gap-1 transition"
              >
                Quay về trang chủ ➡
              </button>
            </div>
            <ContentScanner customApiKey={customApiKey} onSaveApiKey={handleSaveApiKey} />
          </div>
        )}

        {/* BOTTOM METADATA FOOTER STATUS */}
        <footer className="mt-16 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-wider gap-4">
          <div className="flex flex-wrap items-center gap-4 justify-center">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span> 
              Đang hoạt động: {activeTab === "home" ? "Home Overview" : activeTab}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span> 
              Tác giả: HỒ QUANG HIỂN
            </span>
          </div>
          <div className="flex items-center gap-4 text-[10px] tracking-normal font-sans text-slate-500">
            <span className="hover:text-slate-400 cursor-pointer transition">Chính sách bảo mật</span>
            <span className="hover:text-slate-400 cursor-pointer transition hidden sm:inline">Tài liệu API Collab</span>
            <span className="text-indigo-600 font-extrabold">BẢN QUYỀN HỆ THỐNG BY HỒ QUANG HIỂN &#169; 2026</span>
          </div>
        </footer>

      </main>

      {/* GLOBAL API KEY CONFIGURATION MODAL */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            onClick={() => setIsApiKeyModalOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          ></div>
          
          {/* Content panel */}
          <div className="bg-[#121216] border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md relative z-10 shadow-2xl animate-fade-in">
            <button 
              onClick={() => setIsApiKeyModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition cursor-pointer p-1.5 bg-slate-900/50 hover:bg-slate-900 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800/80">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                  <Key className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cấu Hình API Key Gemini</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Xây dựng tương lai sáng tạo nội dung của riêng bạn</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Thiết lập API Key Gemini cá nhân để tăng dung lượng xử lý và độ tin cậy. Khóa được lưu trực tiếp trên thiết bị (Local Storage) và không truyền phát tới bên thứ ba nào khác ngoài Google.
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Khoá API của bạn:</label>
                  <div className="relative">
                    <input
                      type={showHomeKey ? "text" : "password"}
                      value={homeKeyInput}
                      onChange={(e) => setHomeKeyInput(e.target.value)}
                      placeholder="Nhập API Key Gemini (AIzaSy...)"
                      className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowHomeKey(!showHomeKey)}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                    >
                      {showHomeKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    onClick={() => {
                      handleSaveApiKey(homeKeyInput);
                      setIsApiKeyModalOpen(false);
                    }}
                    className="flex-grow cursor-pointer bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg hover:shadow-indigo-500/15 transition-all text-center"
                  >
                    Lưu cấu hình
                  </button>
                  {customApiKey && (
                    <button
                      onClick={() => {
                        setHomeKeyInput("");
                        handleSaveApiKey("");
                        setIsApiKeyModalOpen(false);
                      }}
                      className="cursor-pointer bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white text-xs font-bold py-2.5 px-3.5 rounded-xl transition"
                      title="Xóa khóa tùy chỉnh"
                    >
                      Xóa key
                    </button>
                  )}
                </div>

                {customApiKey ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-emerald-500/5 p-2 border border-emerald-500/10 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Hệ thống đang chạy API Key tùy chỉnh của bạn</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-950 p-2 border border-slate-900 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-slate-700" />
                    <span>Mặc định bám theo tài khoản Google hệ thống</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
