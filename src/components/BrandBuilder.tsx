import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  HelpCircle,
  Play,
  RotateCw,
  User,
  Heart,
  Trash2,
  Copy,
  Download,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Briefcase,
  MapPin,
  Activity,
  FileText,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { 
  BrandBuilderInputs, 
  BrandBuilderResult, 
  BrandBuilderProject, 
  SVGLogoItem 
} from "../types";
import { 
  getHistory, 
  addProjectToHistory, 
  deleteProjectFromHistory 
} from "../utils/storage";

interface BrandBuilderProps {
  customApiKey: string;
  onSaveApiKey: (key: string) => void;
}

export default function BrandBuilder({ customApiKey, onSaveApiKey }: BrandBuilderProps) {
  // Current step state: "input" | "names-list" | "assets-result"
  const [step, setStep] = useState<"input" | "names-list" | "assets-result">("input");
  
  // History list
  const [historyList, setHistoryList] = useState<BrandBuilderProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Input states
  const [nicheInput, setNicheInput] = useState("");
  const [stylePreset, setStylePreset] = useState("Đa dạng sáng tạo");
  
  // Combined factors state
  const [enablePersonalName, setEnablePersonalName] = useState(false);
  const [personalNameInput, setPersonalNameInput] = useState("");

  const [enableCompany, setEnableCompany] = useState(false);
  const [companyInput, setCompanyInput] = useState("");

  const [enableLocation, setEnableLocation] = useState(false);
  const [locationInput, setLocationInput] = useState("");

  const [enableExpertise, setEnableExpertise] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState("Review"); // Custom expertise preset defaults

  const [enableCustom, setEnableCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");

  // Step 1 names suggestion states
  const [loadingNames, setLoadingNames] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Suggestion list from Step 1 API
  const [suggestedNames, setSuggestedNames] = useState<{
    name: string;
    style: string;
    reason: string;
    isFavorite?: boolean;
  }[]>([]);

  // Step 2 brand details states
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [brandResult, setBrandResult] = useState<BrandBuilderResult | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<"tiktok" | "youtube" | "facebook">("tiktok");

  // Logo loading states for single regeneration
  const [loadingLogoId, setLoadingLogoId] = useState<string | null>(null);
  const [logoStyleRegen, setLogoStyleRegen] = useState("Hiện đại tối giản");

  // Visual toast status
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load history list on startup
  useEffect(() => {
    refreshHistory();
  }, []);

  const refreshHistory = () => {
    const list = getHistory<BrandBuilderProject>("brand-builder");
    setHistoryList(list);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép ${label} thành công!`);
  };

  // Preset quick-fills
  const handleApplyPreset = (niche: string, personal: string, location: string, expertise: string) => {
    setNicheInput(niche);
    
    if (personal) {
      setEnablePersonalName(true);
      setPersonalNameInput(personal);
    } else {
      setEnablePersonalName(false);
    }

    if (location) {
      setEnableLocation(true);
      setLocationInput(location);
    } else {
      setEnableLocation(false);
    }

    if (expertise) {
      setEnableExpertise(true);
      setExpertiseInput(expertise);
    } else {
      setEnableExpertise(false);
    }

    showToast("Đã tải dòng sản phẩm gợi ý!");
  };

  // Generation Step 1: Call API to suggest 20 channel names
  const handleGenerateNames = async () => {
    if (!nicheInput.trim()) {
      setApiError("Vui lòng cung cấp mô tả lĩnh vực hoặc sản phẩm muốn xây dựng.");
      return;
    }

    setLoadingNames(true);
    setApiError(null);
    setSuggestedNames([]);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (customApiKey) {
        headers["x-gemini-key"] = customApiKey;
      }

      const factors: Record<string, string> = {};
      if (enablePersonalName && personalNameInput.trim()) factors.personalName = personalNameInput.trim();
      if (enableCompany && companyInput.trim()) factors.company = companyInput.trim();
      if (enableLocation && locationInput.trim()) factors.location = locationInput.trim();
      if (enableExpertise && expertiseInput.trim()) factors.expertise = expertiseInput.trim();
      if (enableCustom && customInput.trim()) factors.custom = customInput.trim();

      const response = await fetch("/api/brand-names", {
        method: "POST",
        headers,
        body: JSON.stringify({
          niche: nicheInput.trim(),
          style: stylePreset,
          factors
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Lỗi phản hồi từ AI (${response.status})`);
      }

      const data = await response.json();
      if (data && data.names && Array.isArray(data.names)) {
        setSuggestedNames(data.names);
        setStep("names-list");
        showToast("Đã đề xuất 20 tên kênh thành công!");
      } else {
        throw new Error("Không thể phân tích dữ liệu dạng tên do AI trả về.");
      }
    } catch (err: any) {
      setApiError(err.message || "Gặp sự cố khi đề xuất tên kênh. Hãy thử kiểm tra lại kết nối mạng.");
    } finally {
      setLoadingNames(false);
    }
  };

  // Triggering Step 2: Grabbing selection (even if manual modified) and calling backend details API
  const handleSelectNameAndContinue = async (rawName: string, index: number) => {
    if (!rawName.trim()) {
      showToast("Tên kênh không được bỏ trống.");
      return;
    }

    setSelectedName(rawName);
    setLoadingDetails(true);
    setApiError(null);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (customApiKey) {
        headers["x-gemini-key"] = customApiKey;
      }

      const factors: Record<string, string> = {};
      if (enablePersonalName) factors.personalName = personalNameInput;
      if (enableCompany) factors.company = companyInput;
      if (enableLocation) factors.location = locationInput;
      if (enableExpertise) factors.expertise = expertiseInput;
      if (enableCustom) factors.custom = customInput;

      const response = await fetch("/api/brand-details", {
        method: "POST",
        headers,
        body: JSON.stringify({
          niche: nicheInput,
          factors,
          selectedName: rawName,
          style: stylePreset
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Lỗi cấu trúc từ AI (${response.status})`);
      }

      const data = await response.json();
      
      // Update result structure
      const finalResult: BrandBuilderResult = {
        namesSuggestions: suggestedNames.map(item => ({
          name: item.name,
          style: item.style,
          reason: item.reason
        })),
        selectedName: rawName,
        logos: data.logos || [],
        tiktok: data.tiktok,
        youtube: data.youtube,
        facebook_instagram: data.facebook_instagram
      };

      setBrandResult(finalResult);
      
      // Save project info directly to local storage
      const projectId = currentProjectId || "proj_" + Date.now();
      setCurrentProjectId(projectId);

      const savedProj: BrandBuilderProject = {
        id: projectId,
        title: rawName,
        createdAt: new Date().toISOString(),
        inputs: {
          niche: nicheInput,
          factors: {
            personalName: enablePersonalName ? personalNameInput : undefined,
            company: enableCompany ? companyInput : undefined,
            location: enableLocation ? locationInput : undefined,
            expertise: enableExpertise ? expertiseInput : undefined,
            custom: enableCustom ? customInput : undefined
          },
          style: stylePreset
        },
        result: finalResult
      };

      addProjectToHistory<BrandBuilderProject>("brand-builder", savedProj);
      refreshHistory();

      setStep("assets-result");
      showToast(`Đã thiết lập thành công kênh "${rawName}"!`);
    } catch (err: any) {
      setApiError(err.message || "Gặp sự cố khi quy hoạch nhận diện. Vui lòng kết nối lại.");
    } finally {
      setLoadingDetails(false);
    }
  };

  // Re-generate individual logo
  const handleRegenerateLogo = async (logoId: string, styleDesc: string) => {
    setLoadingLogoId(logoId);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (customApiKey) {
        headers["x-gemini-key"] = customApiKey;
      }

      const response = await fetch("/api/brand-logo-single", {
        method: "POST",
        headers,
        body: JSON.stringify({
          niche: nicheInput,
          selectedName,
          logoStyle: styleDesc,
          logoId
        })
      });

      if (!response.ok) {
        throw new Error("Lỗi kết nối từ Endpoint vẽ logo.");
      }

      const freshLogo: SVGLogoItem = await response.json();
      
      if (brandResult && brandResult.logos) {
        const updatedLogos = brandResult.logos.map(l => l.id === logoId ? freshLogo : l);
        const updatedResult = { ...brandResult, logos: updatedLogos };
        setBrandResult(updatedResult);

        // Update project history instantly
        if (currentProjectId) {
          const currentProj = historyList.find(p => p.id === currentProjectId);
          if (currentProj) {
            const updatedProj: BrandBuilderProject = {
              ...currentProj,
              result: updatedResult
            };
            addProjectToHistory("brand-builder", updatedProj);
            refreshHistory();
          }
        }
        showToast("Đã làm mới lại Logo vector thành công!");
      }
    } catch (err: any) {
      showToast("Không thể làm mới Logo. Vui lòng thử lại sau.");
    } finally {
      setLoadingLogoId(null);
    }
  };

  // File download vector SVG
  const handleDownloadSVG = (logo: SVGLogoItem) => {
    try {
      const blob = new Blob([logo.svgCode], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `logo_${selectedName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${logo.id}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("Tải xuống mã nguồn SVG Logo thành công!");
    } catch (e) {
      showToast("Tải logo thất bại.");
    }
  };

  // Load a project from history
  const handleLoadProject = (project: BrandBuilderProject) => {
    setCurrentProjectId(project.id);
    setNicheInput(project.inputs.niche);
    setStylePreset(project.inputs.style || "Đa dạng sáng tạo");
    
    // Factors
    setEnablePersonalName(!!project.inputs.factors.personalName);
    setPersonalNameInput(project.inputs.factors.personalName || "");

    setEnableCompany(!!project.inputs.factors.company);
    setCompanyInput(project.inputs.factors.company || "");

    setEnableLocation(!!project.inputs.factors.location);
    setLocationInput(project.inputs.factors.location || "");

    setEnableExpertise(!!project.inputs.factors.expertise);
    setExpertiseInput(project.inputs.factors.expertise || "Review");

    setEnableCustom(!!project.inputs.factors.custom);
    setCustomInput(project.inputs.factors.custom || "");

    // Result
    setBrandResult(project.result);
    setSelectedName(project.result.selectedName || project.title);
    
    if (project.result.namesSuggestions) {
      setSuggestedNames(project.result.namesSuggestions);
    }

    setStep("assets-result");
    showToast(`Đã mở dự án: ${project.title}`);
  };

  // Delete a project from history
  const handleDeleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xoá vĩnh viễn dự án này khỏi bộ nhớ?")) {
      deleteProjectFromHistory("brand-builder", id);
      refreshHistory();
      if (currentProjectId === id) {
        handleResetNewProject();
      }
      showToast("Đã xóa dự án thành công.");
    }
  };

  // New Project Button: reset state
  const handleResetNewProject = () => {
    setCurrentProjectId(null);
    setNicheInput("");
    setStylePreset("Đa dạng sáng tạo");
    setEnablePersonalName(false);
    setPersonalNameInput("");
    setEnableCompany(false);
    setCompanyInput("");
    setEnableLocation(false);
    setLocationInput("");
    setEnableExpertise(false);
    setExpertiseInput("Review");
    setEnableCustom(false);
    setCustomInput("");
    setSuggestedNames([]);
    setBrandResult(null);
    setSelectedName("");
    setStep("input");
    setApiError(null);
    showToast("Sẵn sàng khởi tạo dự án thương hiệu mới!");
  };

  // Toggle inline items of step 1 names as favorite
  const handleToggleFavoriteName = (idx: number) => {
    const updated = [...suggestedNames];
    updated[idx].isFavorite = !updated[idx].isFavorite;
    setSuggestedNames(updated);
    showToast(updated[idx].isFavorite ? "Đã thêm vào danh sách yêu thích!" : "Đã bỏ yêu thích");
  };

  // Modify sug name manual
  const handleEditSugNameName = (idx: number, newVal: string) => {
    const updated = [...suggestedNames];
    updated[idx].name = newVal;
    setSuggestedNames(updated);
  };

  return (
    <div className="space-y-6 animate-fade-in w-full text-slate-100">
      
      {/* GLOBAL TOAST BANNER */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gradient-to-r from-emerald-600 to-teal-600 border border-emerald-400/20 text-white font-bold text-xs px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-100" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP COMPONENT APP TITLE */}
      <div className="bg-[#121216] border border-slate-800/80 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">XÂY DỰNG KÊNH THƯƠNG HIỆU</h2>
                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500 bg-slate-900 px-3 py-1 border border-slate-800 rounded-full w-max mt-1">
                  <User className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                  <span>By HỒ QUANG HIỂN</span>
                </div>
              </div>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl">
              Hệ thống chuyên sâu đề xuất tên thương hiệu, thiết kế Logo Vector SVG tự động và tối ưu hóa hồ sơ đa nền tảng (TikTok, YouTube, Facebook, Instagram).
            </p>
          </div>
          <div className="flex items-center gap-2shrink-0">
            <button
              onClick={handleResetNewProject}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/10 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Dự án mới</span>
            </button>
            {step !== "input" && (
              <button
                onClick={() => setStep("input")}
                className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium rounded-xl transition"
              >
                Quay lại
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* MAIN PANEL CONTENT (col-span-9 or 12) */}
        <div className="xl:col-span-9 space-y-6">

          {/* INTERNAL ERROR SHOW */}
          {apiError && (
            <div className="bg-pink-950/30 border border-pink-500/30 text-pink-400 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm">Gặp lỗi xử lý từ hệ thống AI</h4>
                <p className="text-xs text-pink-400/90 leading-relaxed font-mono whitespace-pre-wrap">{apiError}</p>
              </div>
            </div>
          )}

          {/* STEP 1: INPUT GATHERING LAYOUT */}
          {step === "input" && (
            <div className="bg-[#121216] border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
              <div className="border-b border-slate-800/80 pb-4">
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-md">BƯỚC 1: NHẬP DỮ LIỆU ĐẦU VÀO</span>
                <h3 className="text-lg font-bold text-white mt-2">Xây dựng ý tưởng và phong cách</h3>
              </div>

              {/* Niche quick recommendations */}
              <div className="space-y-2">
                <label className="text-xs text-slate-500 block uppercase tracking-wider font-bold">Gợi ý nhanh một số ngách/xu hướng:</label>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => handleApplyPreset("Gia dụng thông minh, review tiện ích sinh hoạt gia đình", "Anh Bốn Bếp", "Sài Gòn", "Đào Tạo")}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-300 transition text-left cursor-pointer"
                  >
                    🏡 Gia dụng thông minh
                  </button>
                  <button 
                    onClick={() => handleApplyPreset("Mỹ phẩm trang điểm và skincare nội địa trung giá học sinh sinh viên", "Trang Trang", "Hà Nội", "Review")}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-300 transition text-left cursor-pointer"
                  >
                    💄 Mỹ phẩm Trung Nội Địa
                  </button>
                  <button 
                    onClick={() => handleApplyPreset("Sản phẩm công nghệ số, phụ kiện setup góc làm việc tối giản", "Quang Setup", "Đà Nẵng", "So Sánh")}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-300 transition text-left cursor-pointer"
                  >
                    💻 Đồ chơi Công Nghệ Setup
                  </button>
                  <button 
                    onClick={() => handleApplyPreset("Quần áo Unisex oversized cá tính cho gen Z hoạt động thể thao", "Hải Đồ Hiệu", "Sài Gòn", "Thống Kê")}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-300 transition text-left cursor-pointer"
                  >
                    👕 Unisex Oversized GenZ
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                
                {/* INPUT 1 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Đầu vào 1: Mô tả lĩnh vực, sản phẩm hoặc chủ đề muốn xây dựng <span className="text-pink-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={nicheInput}
                    onChange={(e) => setNicheInput(e.target.value)}
                    placeholder="Ví dụ: Đồ ăn vặt nội địa, Phụ kiện chụp ảnh vintage, Mỹ phẩm thuần chay..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-2xl p-4 text-xs text-slate-100 placeholder-slate-700 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none transition leading-relaxed"
                  />
                </div>

                {/* INPUT 2: COMBINED FACTORS */}
                <div className="space-y-3.5 pt-2">
                  <div className="border-t border-slate-900 pt-4 pb-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Đầu vào 2: Yếu tố kết hợp (Chọn và nhập 1 hoặc nhiều yếu tố)
                    </label>
                    <p className="text-[10px] text-slate-500 mt-1">Kết hợp linh hoạt các tham số dưới đây giúp tên kênh mang tính độc quyền và cá nhân hóa cao.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* FACTOR A: PERSONAL NAME */}
                    <div className={`p-4 rounded-2xl border transition-all ${enablePersonalName ? "bg-slate-900/30 border-emerald-500/20" : "bg-slate-950/20 border-slate-800/80"}`}>
                      <label className="flex items-center gap-2 cursor-pointer pb-2">
                        <input
                          type="checkbox"
                          checked={enablePersonalName}
                          onChange={(e) => setEnablePersonalName(e.target.checked)}
                          className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/25 bg-slate-950 cursor-pointer"
                        />
                        <User className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-200">Gắn với tên riêng cá nhân</span>
                      </label>
                      {enablePersonalName && (
                        <input
                          type="text"
                          value={personalNameInput}
                          onChange={(e) => setPersonalNameInput(e.target.value)}
                          placeholder="Ví dụ: Quang, Lan, Hải, Bếp Bố Hải..."
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none transition mt-1"
                        />
                      )}
                    </div>

                    {/* FACTOR B: COMPANY NAME */}
                    <div className={`p-4 rounded-2xl border transition-all ${enableCompany ? "bg-slate-900/30 border-emerald-500/20" : "bg-slate-950/20 border-slate-800/80"}`}>
                      <label className="flex items-center gap-2 cursor-pointer pb-2">
                        <input
                          type="checkbox"
                          checked={enableCompany}
                          onChange={(e) => setEnableCompany(e.target.checked)}
                          className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/25 bg-slate-950 cursor-pointer"
                        />
                        <Briefcase className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-200">Tên Doanh Nghiệp / Tổ Chức</span>
                      </label>
                      {enableCompany && (
                        <input
                          type="text"
                          value={companyInput}
                          onChange={(e) => setCompanyInput(e.target.value)}
                          placeholder="Ví dụ: Shopee Mall, VTC Group, Lotus..."
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none transition mt-1"
                        />
                      )}
                    </div>

                    {/* FACTOR C: GEOGRAPHY */}
                    <div className={`p-4 rounded-2xl border transition-all ${enableLocation ? "bg-slate-900/30 border-emerald-500/20" : "bg-slate-950/20 border-slate-800/80"}`}>
                      <label className="flex items-center gap-2 cursor-pointer pb-2">
                        <input
                          type="checkbox"
                          checked={enableLocation}
                          onChange={(e) => setEnableLocation(e.target.checked)}
                          className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/25 bg-slate-950 cursor-pointer"
                        />
                        <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-200">Yếu tố địa lý, địa danh</span>
                      </label>
                      {enableLocation && (
                        <input
                          type="text"
                          value={locationInput}
                          onChange={(e) => setLocationInput(e.target.value)}
                          placeholder="Ví dụ: Sài Gòn, Hà Nội, Tây Bắc, Đà Lạt..."
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none transition mt-1"
                        />
                      )}
                    </div>

                    {/* FACTOR D: EXPERTISE */}
                    <div className={`p-4 rounded-2xl border transition-all ${enableExpertise ? "bg-slate-900/30 border-emerald-500/20" : "bg-slate-950/20 border-slate-800/80"}`}>
                      <label className="flex items-center gap-2 cursor-pointer pb-2">
                        <input
                          type="checkbox"
                          checked={enableExpertise}
                          onChange={(e) => setEnableExpertise(e.target.checked)}
                          className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/25 bg-slate-950 cursor-pointer"
                        />
                        <Activity className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-200">Dữ liệu Chuyên Môn / Định hướng</span>
                      </label>
                      {enableExpertise && (
                        <select
                          value={expertiseInput}
                          onChange={(e) => setExpertiseInput(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-slate-200 cursor-pointer focus:outline-none mt-1"
                        >
                          <option value="Review">Review / Đánh giá khách quan</option>
                          <option value="Phân Tích">Phân Tích chuyên sâu</option>
                          <option value="Đào Tạo">Đào Tạo / Hướng dẫn thực tế</option>
                          <option value="So Sánh">So Sánh / Cân đo giá cả</option>
                          <option value="Thống Kê">Thống Kê / Tổng hợp số liệu</option>
                        </select>
                      )}
                    </div>

                    {/* FACTOR E: ADVANCED CUSTOM */}
                    <div className={`sm:col-span-2 p-4 rounded-2xl border transition-all ${enableCustom ? "bg-slate-900/30 border-emerald-500/20" : "bg-slate-950/20 border-slate-800/80"}`}>
                      <label className="flex items-center gap-2 cursor-pointer pb-2">
                        <input
                          type="checkbox"
                          checked={enableCustom}
                          onChange={(e) => setEnableCustom(e.target.checked)}
                          className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/25 bg-slate-950 cursor-pointer"
                        />
                        <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-200">Yếu tố sáng tạo khác đề xuất của riêng bạn</span>
                      </label>
                      {enableCustom && (
                        <input
                          type="text"
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          placeholder="Ví dụ: Tây hóa, Thêm chữ 'Review', Thêm mạo từ 'The', Cách điệu tiếng Anh..."
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none transition mt-1"
                        />
                      )}
                    </div>

                  </div>
                </div>

                {/* PRESET CHOOSE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 block uppercase font-bold">Phong cách đặt tên kỳ vọng:</label>
                    <select
                      value={stylePreset}
                      onChange={(e) => setStylePreset(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-xs text-slate-200 cursor-pointer focus:outline-none"
                    >
                      <option value="Đa dạng sáng tạo">Đa dạng sáng tạo kết hợp</option>
                      <option value="Hiện đại, tối giản và đột phá">Hiện đại, tối giản và đột phá</option>
                      <option value="Cực kỳ chuyên nghiệp, uy tín doanh nghiệp">Chuyên nghiệp, uy tín doanh nghiệp</option>
                      <option value="Vui nhộn, hài hước, gần gũi tiếng mẹ đẻ">Gần gũi, vui nhộn & hài hước</option>
                      <option value="Tây hóa, sử dụng từ lai tiếng Anh">Sang trọng, Tây hóa độc lạ</option>
                    </select>
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="pt-6 border-t border-slate-900 flex justify-end">
                  <button
                    onClick={handleGenerateNames}
                    disabled={loadingNames}
                    className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-sm font-black rounded-2xl shadow-xl hover:shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    {loadingNames ? (
                      <>
                        <RotateCw className="w-5 h-5 animate-spin text-emerald-300" />
                        <span>Đang phân tích và gợi ý 20 tên kênh độc quyền...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-yellow-300" />
                        <span>ĐẶT TÊN KÊNH CHUYÊN NGHIỆP</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* STEP 1.5: SUGGESTED NAMES GRID (20 ITEMS) */}
          {step === "names-list" && (
            <div className="bg-[#121216] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
              <div className="border-b border-slate-800/80 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-md">BƯỚC 1.5: CHỌN TÊN KÊNH & SỬA ĐỔI</span>
                  <h3 className="text-lg font-bold text-white mt-2">Đề xuất 20 lựa chọn tên kênh cho ngách</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Bạn có thể nhấp trực tiếp vào text để thay đổi tự do tên kênh trước khi bấm chọn.</p>
                </div>
                <button
                  onClick={() => setStep("input")}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-400 hover:text-white rounded-xl transition cursor-pointer shrink-0"
                >
                  ◀ Quay về biểu mẫu
                </button>
              </div>

              {loadingDetails ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <RotateCw className="w-12 h-12 text-emerald-400 animate-spin" />
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white">Đang quy hoạch nhận diện cho kênh "{selectedName}"</h4>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed">AI đang vẽ 4 Logo vector SVG chất lượng cao, viết mô tả TikTok Bio, YouTube Channel Description (500-800 từ) và Hashtags...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Grid suggestions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestedNames.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="bg-slate-950/60 hover:bg-[#15151e] border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4.5 transition-all flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-3">
                          {/* Name header item and badge */}
                          <div className="flex justify-between items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] h-max shrink-0 uppercase tracking-widest font-mono font-bold bg-[#1a1a24] text-emerald-400 border border-emerald-500/10">
                              {item.style}
                            </span>
                            
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Favorite Toggle button */}
                              <button
                                onClick={() => handleToggleFavoriteName(idx)}
                                className="p-1 px-1.5 hover:bg-slate-900 rounded-lg text-slate-500 hover:text-pink-500 transition-colors cursor-pointer"
                                title="Yêu thích thiết kế"
                              >
                                <Heart className={`w-4 h-4 ${item.isFavorite ? "text-pink-500 fill-pink-500" : ""}`} />
                              </button>
                            </div>
                          </div>

                          {/* Editable Box input field */}
                          <div className="relative">
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">Edit:</label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleEditSugNameName(idx, e.target.value)}
                              className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 font-bold focus:outline-none transition"
                            />
                          </div>

                          {/* Reason */}
                          <p className="text-slate-400 text-xs leading-relaxed min-h-[32px]">
                            {item.reason}
                          </p>
                        </div>

                        {/* SELECT ACTION BUTTON */}
                        <div className="pt-2.5 border-t border-slate-900 flex items-center justify-end">
                          <button
                            onClick={() => handleSelectNameAndContinue(item.name, idx)}
                            className="w-full cursor-pointer bg-slate-900 border border-slate-800 hover:bg-emerald-600 hover:border-emerald-500 text-slate-300 hover:text-white text-xs font-bold py-2 px-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                          >
                            <span>Dùng tên này & Thiết kế ➡</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}
            </div>
          )}

          {/* STEP 2: GENERATED BRAND ASSETS EXPOSE (LOGOS + PROFILES) */}
          {step === "assets-result" && brandResult && (
            <div className="space-y-6 animate-fade-in">

              {/* BRAND CARD HEADER SUMMARY */}
              <div className="bg-gradient-to-r from-[#121216] to-[#121220] border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-3xl rounded-full"></div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-1 rounded-md">THƯƠNG HIỆU HOÀN THÀNH</span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-2 leading-tight uppercase tracking-tight">{selectedName}</h3>
                    <p className="text-xs text-slate-400">Ngách hoạt động: <strong className="text-slate-200">{nicheInput}</strong> | Preset: <strong className="text-slate-200">{stylePreset}</strong></p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleResetNewProject}
                      className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Xây dựng Kênh mới</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ASSET #1: DYNAMIC LOGOS DRAW WITH REGENT & SVG VIEWER */}
              <div className="bg-[#121216] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base sm:text-lg font-bold text-white">#1. Logo Thương Hiệu Đề Xuất (04 Bản Vẽ Vector SVG)</h3>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">
                    Bản vẽ Vector SVG sắc nét tuyệt đối, không vỡ lập mờ khi phóng to. Bạn có thể tự chọn phong cách để tạo lại từng logo riêng biệt hoặc tải trực tiếp về máy (.svg).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {brandResult.logos && brandResult.logos.map((logo, index) => (
                    <div 
                      key={logo.id} 
                      className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between gap-5"
                    >
                      <div>
                        {/* Logo header style */}
                        <div className="flex justify-between items-center gap-2 mb-3.5">
                          <div>
                            <h4 className="font-bold text-sm text-slate-100">{logo.title || `Bố cục logo #${index + 1}`}</h4>
                            <span className="text-[10px] text-slate-500 italic block">{logo.style || "Thiết kế cao cấp"}</span>
                          </div>
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold uppercase">
                            {logo.id}
                          </span>
                        </div>

                        {/* Vector representation area */}
                        <div className="aspect-square bg-[#0b0b0f] rounded-xl flex items-center justify-center p-6 border border-slate-900 shadow-inner relative max-w-[280px] mx-auto group">
                          {loadingLogoId === logo.id ? (
                            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4">
                              <RotateCw className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
                              <span className="text-[10px] text-slate-400">Đang vẽ lại SVG...</span>
                            </div>
                          ) : null}
                          <div 
                            className="w-full h-full text-center flex items-center justify-center pointer-events-auto"
                            dangerouslySetInnerHTML={{ __html: logo.svgCode }}
                          />
                        </div>

                        {/* Concept logic */}
                        <p className="text-xs text-slate-400 leading-relaxed mt-4 bg-[#121216]/50 p-3 rounded-xl border border-slate-900">
                          <strong>Triết lý:</strong> {logo.concept}
                        </p>
                      </div>

                      {/* Reload & Download tools */}
                      <div className="pt-3 border-t border-slate-900/60 flex flex-col gap-2">
                        <div className="flex items-center gap-1.5">
                          <input 
                            type="text" 
                            placeholder="Nhập phong cách muốn vẽ lại (vd: Neon cyberpunk)..." 
                            defaultValue={logoStyleRegen}
                            onChange={(e) => setLogoStyleRegen(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none flex-grow"
                          />
                          <button
                            disabled={loadingLogoId !== null}
                            onClick={() => handleRegenerateLogo(logo.id, logoStyleRegen)}
                            className="p-1.5 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-emerald-400 rounded-lg flex items-center gap-1 shrink-0 cursor-pointer transition disabled:opacity-50"
                            title="Tạo lại duy nhất logo này"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Vẽ lại</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleDownloadSVG(logo)}
                          className="w-full cursor-pointer bg-slate-900/40 border border-slate-800 text-slate-300 hover:text-white hover:bg-indigo-600 text-[11px] py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Tải tệp SVG về máy</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ASSET #2: PROFILE MULTI-PLATFORM BIOS & DIRECT COPY CONTROLS */}
              <div className="bg-[#121216] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                
                <div className="border-b border-slate-800/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-base sm:text-lg font-bold text-white">#2. Bộ Hồ Sơ Thương Hiệu & Slogan Đa Nền Tảng</h3>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">Tiêu chuẩn mô tả hồ sơ sáng tạo giúp bùng nổ chuyển đổi Affiliate.</p>
                  </div>

                  {/* Tabs platform slider */}
                  <div className="p-1 bg-slate-950 rounded-xl border border-slate-900 flex shrink-0">
                    <button
                      onClick={() => setActiveResultTab("tiktok")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
                        activeResultTab === "tiktok" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/10" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      TikTok
                    </button>
                    <button
                      onClick={() => setActiveResultTab("youtube")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
                        activeResultTab === "youtube" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/10" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      YouTube
                    </button>
                    <button
                      onClick={() => setActiveResultTab("facebook")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
                        activeResultTab === "facebook" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/10" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      Facebook & Insta
                    </button>
                  </div>
                </div>

                {/* TAB 1: TIKTOK */}
                {activeResultTab === "tiktok" && brandResult.tiktok && (
                  <div className="space-y-5 animate-fade-in text-xs sm:text-sm">
                    
                    {/* Channel name copy board */}
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2 relative">
                      <div className="flex justify-between items-center pb-1">
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Tên Kênh:</label>
                        <button
                          onClick={() => handleCopyText(brandResult.tiktok?.name || "", "Tên kênh TikTok")}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Copy</span>
                        </button>
                      </div>
                      <div className="text-white font-extrabold text-base">{brandResult.tiktok.name}</div>
                    </div>

                    {/* Bio templates */}
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2 relative">
                      <div className="flex justify-between items-center pb-1">
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">TikTok Bio / Slogan ngắn gọn:</label>
                        <button
                          onClick={() => handleCopyText(brandResult.tiktok?.bio || "", "Slogan Bio TikTok")}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Copy</span>
                        </button>
                      </div>
                      <p className="text-slate-300 italic whitespace-pre-wrap leading-relaxed">{brandResult.tiktok.bio}</p>
                    </div>

                  </div>
                )}

                {/* TAB 2: YOUTUBE */}
                {activeResultTab === "youtube" && brandResult.youtube && (
                  <div className="space-y-5 animate-fade-in text-xs sm:text-sm">
                    
                    {/* YouTube Channel name */}
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center pb-1">
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Tên Kênh:</label>
                        <button
                          onClick={() => handleCopyText(brandResult.youtube?.name || "", "Tên Kênh YouTube")}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Copy</span>
                        </button>
                      </div>
                      <div className="text-white font-extrabold text-base">{brandResult.youtube.name}</div>
                    </div>

                    {/* YouTube Desc (500-800 words scrollable) */}
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center pb-1">
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Mô Tả Kênh (SEO 500-800 từ):</label>
                        <button
                          onClick={() => handleCopyText(brandResult.youtube?.description || "", "Mô tả kênh YouTube")}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Copy</span>
                        </button>
                      </div>
                      <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-2 bg-slate-950 p-4 border border-slate-900 rounded-xl text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {brandResult.youtube.description}
                      </div>
                      <div className="text-[10px] text-slate-500 italic text-right mt-1">Dung lượng: ~{brandResult.youtube.description.split(/\s+/).length} từ - Thỏa mãn điều kiện SEO.</div>
                    </div>

                    {/* YouTube keywords */}
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center pb-1">
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Danh sách từ khoá kênh:</label>
                        <button
                          onClick={() => handleCopyText(brandResult.youtube?.keywords.join(", ") || "", "Từ khóa SEO YouTube")}
                          className="p-1.5 bg-slate-905 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Copy</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {brandResult.youtube.keywords.map((kw, i) => (
                          <span key={i} className="px-2.5 py-1 bg-slate-900 text-slate-400 border border-slate-800 rounded-md text-[11px] font-mono">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* YouTube Hashtags */}
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center pb-1">
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">10 Hashtag phổ biến nhất:</label>
                        <button
                          onClick={() => handleCopyText(brandResult.youtube?.hashtags.join(" ") || "", "Hashtags YouTube")}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Copy</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {brandResult.youtube.hashtags.map((ht, i) => (
                          <span key={i} className="px-2.5 py-1 bg-red-500/5 text-red-400 border border-red-500/10 rounded-md text-[11px] font-bold">
                            {ht}
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* TAB 3: FACEBOOK / INSTAGRAM */}
                {activeResultTab === "facebook" && brandResult.facebook_instagram && (
                  <div className="space-y-5 animate-fade-in text-xs sm:text-sm">
                    
                    {/* Facebook Account name */}
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center pb-1">
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Tên tài khoản Page:</label>
                        <button
                          onClick={() => handleCopyText(brandResult.facebook_instagram?.name || "", "Tên Fanpage")}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Copy</span>
                        </button>
                      </div>
                      <div className="text-white font-extrabold text-base">{brandResult.facebook_instagram.name}</div>
                    </div>

                    {/* Slogan */}
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center pb-1">
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Slogan & Bio ngắn gọn (Sologent):</label>
                        <button
                          onClick={() => handleCopyText(brandResult.facebook_instagram?.bio || "", "Slogan Fanpage")}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Copy</span>
                        </button>
                      </div>
                      <p className="text-slate-300 italic whitespace-pre-wrap leading-relaxed">{brandResult.facebook_instagram.bio}</p>
                    </div>

                    {/* FB Hashtags */}
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center pb-1">
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">10 Hashtag phổ biến nhất:</label>
                        <button
                          onClick={() => handleCopyText(brandResult.facebook_instagram?.hashtags.join(" ") || "", "Hashtags Facebook")}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Copy</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {brandResult.facebook_instagram.hashtags.map((ht, i) => (
                          <span key={i} className="px-2.5 py-1 bg-blue-500/5 text-blue-400 border border-blue-500/10 rounded-md text-[11px] font-bold">
                            {ht}
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

              </div>

            </div>
          )}

        </div>

        {/* RECENT HISTORIC SIDEBAR PANEL (col-span-3) */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-[#121216] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-300">Lịch sử Dự Án</h4>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 font-bold">
                {historyList.length}
              </span>
            </div>

            {historyList.length === 0 ? (
              <div className="py-8 text-center text-slate-500 space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-700 mx-auto" />
                <p className="text-[11px] leading-relaxed">Chưa có dự án xây dựng thương hiệu được lưu nào.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-1">
                {historyList.map(proj => (
                  <div
                    key={proj.id}
                    onClick={() => handleLoadProject(proj)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex justify-between items-start gap-2 group ${
                      currentProjectId === proj.id 
                        ? "bg-slate-950 border-emerald-500/30 ring-1 ring-emerald-500/10" 
                        : "bg-slate-950/45 hover:bg-slate-950 border-slate-800/85 hover:border-slate-700"
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <h5 className="font-bold text-xs text-white truncate uppercase group-hover:text-emerald-400 transition-colors">
                        {proj.title}
                      </h5>
                      <p className="text-[10px] text-slate-500 truncate">
                        {proj.inputs.niche}
                      </p>
                      <span className="text-[9px] text-slate-600 font-mono block">
                        {new Date(proj.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteProject(e, proj.id)}
                      className="p-1 text-slate-600 hover:text-pink-600 hover:bg-slate-900 rounded opacity-0 group-hover:opacity-100 transition shrink-0 cursor-pointer"
                      title="Xoá vĩnh viễn"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {historyList.length > 0 && (
              <button
                onClick={handleResetNewProject}
                className="w-full text-center py-2 bg-slate-950 hover:bg-slate-900 border border-slate-900 rounded-xl text-[11px] text-slate-400 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Thiết lập dự án mới</span>
              </button>
            )}

          </div>
        </div>

      </div>

      {/* FOOTER attribution */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-700 py-4 border-t border-slate-900 font-mono">
        <span>BẢN QUYỀN THIẾT KẾ</span>
        <Heart className="w-3 h-3 text-pink-700 fill-pink-700" />
        <span>BY HỒ QUANG HIỂN</span>
      </div>

    </div>
  );
}
