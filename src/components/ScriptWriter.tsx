import React, { useState, useEffect, useRef } from "react";
import { 
  Video, 
  UploadCloud, 
  Trash2, 
  Copy, 
  Check, 
  RotateCw, 
  Plus, 
  CheckCircle2, 
  FileText, 
  ChevronDown, 
  Sparkles, 
  User, 
  Heart,
  Volume2, 
  Settings, 
  History, 
  ChevronRight,
  RefreshCw,
  X,
  AlertTriangle,
  Lightbulb,
  CornerDownRight
} from "lucide-react";
import { 
  getHistory, 
  addProjectToHistory, 
  deleteProjectFromHistory 
} from "../utils/storage";
import { 
  ScriptWriterProject, 
  TikTokScriptItem,
  ScriptWriterInputs
} from "../types";

interface ScriptWriterProps {
  customApiKey: string;
  onSaveApiKey: (key: string) => void;
}

export default function ScriptWriter({ customApiKey, onSaveApiKey }: ScriptWriterProps) {
  // Input Settings States
  const [images, setImages] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<string>("10");
  const [customQuantity, setCustomQuantity] = useState<string>("");
  const [phoneticVietnamese, setPhoneticVietnamese] = useState<boolean>(false);
  const [stripCTA, setStripCTA] = useState<boolean>(false);
  const [removeShopName, setRemoveShopName] = useState<boolean>(true);
  const [removeMediaPartner, setRemoveMediaPartner] = useState<boolean>(true);
  const [removePrice, setRemovePrice] = useState<boolean>(true);
  const [eachStrengthOneScript, setEachStrengthOneScript] = useState<boolean>(true);
  
  const [speaker, setSpeaker] = useState<string>("Ngẫu nhiên");
  const [customSpeaker, setCustomSpeaker] = useState<string>("");
  const [listener, setListener] = useState<string>("Ngẫu nhiên");
  const [customListener, setCustomListener] = useState<string>("");
  
  const [duration, setDuration] = useState<string>("135-160");
  const [context, setContext] = useState<string>("");
  
  const [ideas, setIdeas] = useState<string>(
    "Tự do sáng tạo nhưng hãy bỏ các câu chào hỏi vô nghĩa ở đầu kịch bản. Tập trung kích thích sự tò mò hoặc gây đột phá ở 3 giây đầu (1-2 câu đầu) của kịch bản – hay còn gọi là đoạn Hook cần có sự “Gây chú ý” khiến người xem phải xem hết video."
  );
  const [warnings, setWarnings] = useState<string>(
    `- Không sử dụng các từ ngữ khẳng định, cam kết, chắc chắn.
- Tránh các từ ngữ nhạy cảm, gây hiểu lầm.
- Tránh các từ ngữ có thể gây vi phạm liên quan đến lừa đảo tài chính.
- Tránh các từ ngữ có thể gây vi phạm chính sách từ các nền tảng TMDT như Tiktok Shop.
- Tối ưu triệt để về tính cảm xúc, dẫn dắt cho các kịch bản lời thoại.`
  );

  // History & Projects Management
  const [historyList, setHistoryList] = useState<ScriptWriterProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showHistoryPane, setShowHistoryPane] = useState<boolean>(false);

  // Core Processing States
  const [processingStep, setProcessingStep] = useState<"idle" | "scanning" | "writing" | "error">("idle");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Outputs
  const [scannedProduct, setScannedProduct] = useState<{
    productName: string;
    brand: string;
    keyPoints: string[];
  } | null>(null);
  const [scripts, setScripts] = useState<TikTokScriptItem[]>([]);

  // Editing & single-item revision state
  const [isCopyAllSuccess, setIsCopyAllSuccess] = useState<boolean>(false);
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);
  const [regeneratingScriptId, setRegeneratingScriptId] = useState<string | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState<string>("");
  const [showRevisionModalForId, setShowRevisionModalForId] = useState<string | null>(null);

  // File drag & hover triggers
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load projects history initially
  const loadHistory = () => {
    const list = getHistory<ScriptWriterProject>("script-writer");
    setHistoryList(list);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Sync to loaded project
  const handleSelectProject = (project: ScriptWriterProject) => {
    setActiveProjectId(project.id);
    setImages(project.inputs.images || []);
    setQuantity(project.inputs.quantity);
    if (!["1", "3", "5", "10", "20", "30"].includes(project.inputs.quantity)) {
      setCustomQuantity(project.inputs.quantity);
    }
    setPhoneticVietnamese(project.inputs.phoneticVietnamese);
    setStripCTA(project.inputs.stripCTA);
    setRemoveShopName(project.inputs.removeShopName);
    setRemoveMediaPartner(project.inputs.removeMediaPartner);
    setRemovePrice(project.inputs.removePrice);
    setEachStrengthOneScript(project.inputs.eachStrengthOneScript);
    
    // Roles
    const spRef = project.inputs.speaker;
    if (["Ngẫu nhiên", "Mình", "Tôi", "Tớ", "Tui", "Tao", "Em"].includes(spRef)) {
      setSpeaker(spRef);
    } else {
      setSpeaker("Tự Nhập");
      setCustomSpeaker(spRef);
    }

    const lsRef = project.inputs.listener;
    if (["Ngẫu nhiên", "Bạn – Các bạn", "Anh – Chị Em", "Các con vợ", "Các tình yêu", "Tụi mày – Tụi bây", "Các cụ"].includes(lsRef)) {
      setListener(lsRef);
    } else {
      setListener("Tự Nhập");
      setCustomListener(lsRef);
    }

    setDuration(project.inputs.duration);
    setContext(project.inputs.context || "");
    setIdeas(project.inputs.ideas);
    setWarnings(project.inputs.warnings);

    // Outputs
    setScannedProduct(project.result.productSummary || null);
    setScripts(project.result.scripts || []);
    setProcessingStep("idle");
    setErrorMessage(null);
  };

  // Start fresh project
  const handleResetNewProject = () => {
    setActiveProjectId(null);
    setImages([]);
    setQuantity("10");
    setCustomQuantity("");
    setPhoneticVietnamese(false);
    setStripCTA(false);
    setRemoveShopName(true);
    setRemoveMediaPartner(true);
    setRemovePrice(true);
    setEachStrengthOneScript(true);
    setSpeaker("Ngẫu nhiên");
    setCustomSpeaker("");
    setListener("Ngẫu nhiên");
    setCustomListener("");
    setDuration("135-160");
    setContext("");
    setScannedProduct(null);
    setScripts([]);
    setProcessingStep("idle");
    setErrorMessage(null);
  };

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Handle Drag Leave
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Convert File to Base64
  const processFiles = (fileList: FileList) => {
    const validImages = Array.from(fileList).filter(file => file.type.startsWith("image/"));
    if (validImages.length === 0) return;

    if (images.length + validImages.length > 4) {
      alert("Tối đa chỉ nhận cùng lúc 1-4 hình ảnh sản phẩm.");
      return;
    }

    validImages.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImages(prev => [...prev, reader.result as string].slice(0, 4));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  // File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== index));
  };

  // Core Orchestration: Scan -> Write
  const handleStartProcessing = async () => {
    if (images.length === 0) {
      setErrorMessage("Vui lòng tải lên ít nhất 1 hình ảnh sản phẩm để AI quét thông tin chi tiết.");
      setProcessingStep("error");
      return;
    }

    let finalQuantity = quantity;
    if (quantity === "custom") {
      if (!customQuantity || parseInt(customQuantity, 10) <= 0) {
        setErrorMessage("Vui lòng nhập một số lượng kịch bản hợp lệ.");
        setProcessingStep("error");
        return;
      }
      finalQuantity = customQuantity;
    }

    setProcessingStep("scanning");
    setProgressPercent(20);
    setStatusMessage("Bước 1: Đang nộp hình ảnh sản phẩm qua kênh Gemini AI...");
    setErrorMessage(null);
    setScannedProduct(null);
    setScripts([]);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customApiKey) {
        headers["x-gemini-key"] = customApiKey;
      }

      // Step 1: Scan and clean product data
      const scanRes = await fetch("/api/script-writer/scan-product", {
        method: "POST",
        headers,
        body: JSON.stringify({
          images,
          removeShopName,
          removeMediaPartner,
          removePrice
        })
      });

      if (!scanRes.ok) {
        const err = await scanRes.json();
        throw new Error(err.error || `Lỗi bóc tách sản phẩm (${scanRes.status})`);
      }

      const scanResultData = await scanRes.json();
      setScannedProduct(scanResultData);
      
      setProgressPercent(55);
      setStatusMessage("Bước 2: Quét ảnh hoàn tất! Đang dệt ghép các yêu cầu cấu hình và bóc tách kịch bản...");

      // Step 2: Write script list
      const finalSpeaker = speaker === "Tự Nhập" ? customSpeaker : speaker;
      const finalListener = listener === "Tự Nhập" ? customListener : listener;

      const scriptRes = await fetch("/api/script-writer/generate-scripts", {
        method: "POST",
        headers,
        body: JSON.stringify({
          scannedProduct: scanResultData,
          quantity: finalQuantity,
          phoneticVietnamese,
          stripCTA,
          eachStrengthOneScript,
          speaker: finalSpeaker,
          listener: finalListener,
          duration,
          context,
          ideas,
          warnings
        })
      });

      if (!scriptRes.ok) {
        const err = await scriptRes.json();
        throw new Error(err.error || `Lỗi biên soạn kịch bản (${scriptRes.status})`);
      }

      const generatedScripts = await scriptRes.json();
      const updatedScripts = generatedScripts.scripts || [];
      setScripts(updatedScripts);
      
      setProgressPercent(100);
      setStatusMessage("Hoàn thành viết kịch bản!");

      // Save to History database local history
      const savedProject: ScriptWriterProject = {
        id: activeProjectId || `script-writer-${Date.now()}`,
        title: scanResultData.productName || `Kịch bản ${scanResultData.brand || "Sản phẩm"}`,
        createdAt: new Date().toISOString(),
        inputs: {
          images,
          quantity: finalQuantity,
          phoneticVietnamese,
          stripCTA,
          removeShopName,
          removeMediaPartner,
          removePrice,
          eachStrengthOneScript,
          speaker: finalSpeaker,
          listener: finalListener,
          duration,
          context,
          ideas,
          warnings,
          scannedProduct: scanResultData
        },
        result: {
          productSummary: scanResultData,
          scripts: updatedScripts
        }
      };

      addProjectToHistory<ScriptWriterProject>("script-writer", savedProject);
      setActiveProjectId(savedProject.id);
      loadHistory();
      
      setTimeout(() => {
        setProcessingStep("idle");
      }, 600);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Gặp sự cố kết nối với AI. Vui lòng thiết lập API Key hoặc kiểm tra mạng.");
      setProcessingStep("error");
    }
  };

  // Single Item Revision Action
  const handleRegenerateSingle = async () => {
    if (!showRevisionModalForId) return;
    const scriptId = showRevisionModalForId;
    setRegeneratingScriptId(scriptId);
    setShowRevisionModalForId(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customApiKey) {
        headers["x-gemini-key"] = customApiKey;
      }

      const finalSpeaker = speaker === "Tự Nhập" ? customSpeaker : speaker;
      const finalListener = listener === "Tự Nhập" ? customListener : listener;

      const response = await fetch("/api/script-writer/regenerate-single", {
        method: "POST",
        headers,
        body: JSON.stringify({
          scannedProduct,
          settings: {
            phoneticVietnamese,
            stripCTA,
            speaker: finalSpeaker,
            listener: finalListener,
            duration,
            context,
            ideas,
            warnings
          },
          scriptId,
          userFeedback: revisionFeedback
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Không thể làm mới kịch bản.");
      }

      const freshScript: TikTokScriptItem = await response.json();
      
      // Update the inline state
      const updatedList = scripts.map(s => s.id === scriptId ? freshScript : s);
      setScripts(updatedList);

      // Save back to project history
      if (activeProjectId) {
        const foundProj = historyList.find(p => p.id === activeProjectId);
        if (foundProj) {
          const updatedProj: ScriptWriterProject = {
            ...foundProj,
            result: {
              ...foundProj.result,
              scripts: updatedList
            }
          };
          addProjectToHistory("script-writer", updatedProj);
          loadHistory();
        }
      }
      
      setRevisionFeedback("");
    } catch (err: any) {
      alert("Sự cố viết lại: " + err.message);
    } finally {
      setRegeneratingScriptId(null);
    }
  };

  // Inline Editable scripts changer
  const handleTextareaChange = (id: string, newContent: string) => {
    const updated = scripts.map(s => s.id === id ? { ...s, content: newContent } : s);
    setScripts(updated);

    // Save changes to local database on the fly
    if (activeProjectId) {
      const foundProj = historyList.find(p => p.id === activeProjectId);
      if (foundProj) {
        const updatedProj: ScriptWriterProject = {
          ...foundProj,
          result: {
            ...foundProj.result,
            scripts: updated
          }
        };
        addProjectToHistory("script-writer", updatedProj);
        loadHistory();
      }
    }
  };

  // Copy Single card voice spoken text
  const handleCopySingle = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScriptId(id);
    setTimeout(() => {
      setCopiedScriptId(null);
    }, 1500);
  };

  // Copy full consolidated scripts
  const handleCopyAll = () => {
    const totalText = scripts.map((s, idx) => {
      return `--- KỊCH BẢN ${idx + 1}: ${s.title} ---\n${s.content}`;
    }).join("\n\n");
    
    navigator.clipboard.writeText(totalText);
    setIsCopyAllSuccess(true);
    setTimeout(() => {
      setIsCopyAllSuccess(false);
    }, 1800);
  };

  // Delete historical project
  const handleDeleteHistoryProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa dự án lịch sử này ra khỏi hệ thống?")) {
      const updated = deleteProjectFromHistory<ScriptWriterProject>("script-writer", id);
      setHistoryList(updated);
      if (activeProjectId === id) {
        handleResetNewProject();
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in w-full text-slate-200">
      
      {/* HEADER SECTION WITH ACTION CONTROLS */}
      <div className="bg-[#121216] border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
              <Video className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                TikTok Affiliate Script Writer v2.0
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bóc tách dữ liệu điểm USP từ ảnh gốc, lọc tên shop, bế tắt giá cả và tạo hàng loạt kịch bản Affiliate tùy chỉnh đa dạng.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleResetNewProject}
              className="px-4 py-2 cursor-pointer bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              title="Khởi tạo từ đầu"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Dự án mới</span>
            </button>
            <button
              onClick={() => setShowHistoryPane(!showHistoryPane)}
              className={`px-4 py-2 cursor-pointer border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                showHistoryPane 
                  ? "bg-indigo-600/15 border-indigo-500/30 text-indigo-300"
                  : "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-400"
              }`}
            >
              <History className="w-4 h-4" />
              <span>Lịch sử ({historyList.length})</span>
            </button>
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500 bg-slate-900 px-3 py-2 border border-slate-800 rounded-xl">
              <User className="w-3.5 h-3.5 text-indigo-400 mr-1" />
              <span>By HỒ QUANG HIỂN</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PANEL A: HISTORICAL PANELS DROPDOWN/PANEL */}
        {showHistoryPane && (
          <div className="lg:col-span-12 bg-[#121216] border border-slate-800/80 rounded-3xl p-5 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4" /> Lịch sử lưu trữ dự án kịch bản (By Hồ Quang Hiển)
              </span>
              <button 
                onClick={() => setShowHistoryPane(false)} 
                className="text-slate-500 hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {historyList.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">Chưa có dự án kịch bản nào được thiết lập.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {historyList.map(proj => (
                  <div
                    key={proj.id}
                    onClick={() => handleSelectProject(proj)}
                    className={`p-3 bg-slate-900/60 hover:bg-slate-900/100 border rounded-2xl cursor-pointer transition flex items-center justify-between text-left ${
                      activeProjectId === proj.id ? "border-indigo-500 bg-indigo-950/10" : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="text-xs font-bold text-white truncate">{proj.title}</p>
                      <span className="text-[10px] text-slate-500">
                        {new Date(proj.createdAt).toLocaleDateString("vi-VN")} - {proj.result.scripts.length} kịch bản
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteHistoryProject(proj.id, e)}
                      className="text-slate-600 hover:text-red-400 rounded p-1 hover:bg-slate-800 transition"
                      title="Xóa dự án"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PANEL B: LEFT CONFIG COLUMN (col-span-12 or col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#121216] border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-6 relative">
            
            {/* 1. IMAGE UPLOAD ZONE */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                1. Hình ảnh sản phẩm (Tải lên 1-4 ảnh) <span className="text-red-500">*</span>
              </span>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition duration-200 min-h-[140px] relative ${
                  isDragging 
                    ? "border-indigo-500 bg-indigo-500/5 text-indigo-300" 
                    : "border-slate-800 hover:border-indigo-500/30 bg-slate-900/20 hover:bg-slate-900/40"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <UploadCloud className="w-8 h-8 text-indigo-400/80 mb-2" />
                <span className="text-xs text-slate-300 font-bold mb-1">Nhấp kéo thả hoặc bấm để tải ảnh lên</span>
                <span className="text-[10px] text-slate-500 max-w-xs">Nhận diện điểm USP, tóm tắt và lọc nhiễu từ hình ảnh chụp thực tế.</span>
              </div>

              {/* IMAGE PREVIEWS */}
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2.5 pt-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-800 aspect-square">
                      <img src={img} alt="Product upload" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(idx);
                        }}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-red-400"
                        title="Xóa hình ảnh"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. SPECIFIC FEATURE TOGGLES (Bento style 2x3 Grid) */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                2. Thiết lập bộ lọc thông tin & Kịch bản
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                
                {/* Toggle 3.3: Remove Shop Name (bật sẵn) */}
                <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/50 transition cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={removeShopName}
                    onChange={(e) => setRemoveShopName(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-800 text-indigo-600 focus:ring-opacity-40 focus:ring-indigo-500 transition cursor-pointer"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-white block">Loại bỏ Tên Shop</span>
                    <span className="text-[9px] text-slate-500 leading-tight block mt-0.5">Chỉ giữ lại hãng sx, lọc tiệm bán nhỏ lẻ.</span>
                  </div>
                </label>

                {/* Toggle 3.4: Remove Promo collabs (bật sẵn) */}
                <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/50 transition cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={removeMediaPartner}
                    onChange={(e) => setRemoveMediaPartner(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-800 text-indigo-600 focus:ring-opacity-40 focus:ring-indigo-500 transition cursor-pointer"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-white block">Xóa Đơn vị Quảng bá</span>
                    <span className="text-[9px] text-slate-500 leading-tight block mt-0.5">Xóa KOL/Nhà tài trợ chéo x độc quyền.</span>
                  </div>
                </label>

                {/* Toggle 3.5: Remove price (bật sẵn) */}
                <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/50 transition cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={removePrice}
                    onChange={(e) => setRemovePrice(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-800 text-indigo-600 focus:ring-opacity-40 focus:ring-indigo-500 transition cursor-pointer"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-white block">Loại bỏ Giá Bán</span>
                    <span className="text-[9px] text-slate-500 leading-tight block mt-0.5">Ẩn mức giá số tiền để tăng giữ chân tò mò.</span>
                  </div>
                </label>

                {/* Toggle 3.6: Each strength = 1 script (bật sẵn) */}
                <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/50 transition cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={eachStrengthOneScript}
                    onChange={(e) => setEachStrengthOneScript(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-800 text-indigo-600 focus:ring-opacity-40 focus:ring-indigo-500 transition cursor-pointer"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-white block">1 Điểm mạnh = 1 Kịch bản</span>
                    <span className="text-[9px] text-slate-500 leading-tight block mt-0.5">Mỗi phân cảnh tập trung sâu 1 điểm USP duy nhất.</span>
                  </div>
                </label>

                {/* Toggle 3.1: Translate/phonetics */}
                <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/50 transition cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={phoneticVietnamese}
                    onChange={(e) => setPhoneticVietnamese(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-800 text-indigo-600 focus:ring-opacity-40 focus:ring-indigo-500 transition cursor-pointer"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-white block">Phiên âm tiếng Việt</span>
                    <span className="text-[9px] text-slate-500 leading-tight block mt-0.5">Viết từ tiếng Anh thô thành từ đọc thuần Việt.</span>
                  </div>
                </label>

                {/* Toggle 3.2: Strip CTA */}
                <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/50 transition cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={stripCTA}
                    onChange={(e) => setStripCTA(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-800 text-indigo-600 focus:ring-opacity-40 focus:ring-indigo-500 transition cursor-pointer"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-white block">Cắt bỏ phần CTA</span>
                    <span className="text-[9px] text-slate-500 leading-tight block mt-0.5">Xóa câu mua hàng cuối, tập trung review.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* 3. QUANTITY & DURATION & SPEAKERS GRID */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* QTY select */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-semibold text-slate-400 block uppercase">Số lượng kịch bản:</label>
                <div className="relative">
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition cursor-pointer appearance-none"
                  >
                    <option value="1">1 Kịch bản</option>
                    <option value="3">3 Kịch bản</option>
                    <option value="5">5 Kịch bản</option>
                    <option value="10">10 Kịch bản (Mặc định)</option>
                    <option value="20">20 Kịch bản</option>
                    <option value="30">30 Kịch bản</option>
                    <option value="custom">Tự nhập số...</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* DURATION preset */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-semibold text-slate-400 block uppercase">Độ dài kịch bản:</label>
                <div className="relative">
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition cursor-pointer appearance-none"
                  >
                    <option value="under135">Dưới 135 từ (&lt; 25s)</option>
                    <option value="135-160">135-160 từ (25–45s) *</option>
                    <option value="150-250">150-250 từ (35-60s)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Custom Quantity helper input */}
              {quantity === "custom" && (
                <div className="space-y-1.5 col-span-2 animate-fade-in">
                  <label className="text-[11px] font-semibold text-slate-500 block">Số lượng kịch bản mong muốn:</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={customQuantity}
                    onChange={(e) => setCustomQuantity(e.target.value)}
                    placeholder="Nhập số từ 1 đến 50..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* SPEAKER (Người nói) */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-semibold text-slate-400 block uppercase">Người Nói (Đóng vai):</label>
                <div className="relative">
                  <select
                    value={speaker}
                    onChange={(e) => setSpeaker(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition cursor-pointer appearance-none"
                  >
                    <option value="Ngẫu nhiên">Ngẫu nhiên (Default)</option>
                    <option value="Mình">Mình</option>
                    <option value="Tôi">Tôi</option>
                    <option value="Tớ">Tớ</option>
                    <option value="Tui">Tui</option>
                    <option value="Tao">Tao</option>
                    <option value="Em">Em</option>
                    <option value="Tự Nhập">-- Tự nhập vai...</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* LISTENER (Người nghe) */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-semibold text-slate-400 block uppercase">Người nghe (Người xem):</label>
                <div className="relative">
                  <select
                    value={listener}
                    onChange={(e) => setListener(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition cursor-pointer appearance-none"
                  >
                    <option value="Ngẫu nhiên">Ngẫu nhiên (Default)</option>
                    <option value="Bạn – Các bạn">Bạn – Các bạn</option>
                    <option value="Anh – Chị Em">Anh – Chị Em</option>
                    <option value="Các con vợ">Các con vợ</option>
                    <option value="Các tình yêu">Các tình yêu</option>
                    <option value="Tụi mày – Tụi bây">Tụi mày – Tụi bây</option>
                    <option value="Các cụ">Các cụ</option>
                    <option value="Tự Nhập">-- Tự nhập vai...</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Custom Speakers Inputs */}
              {speaker === "Tự Nhập" && (
                <div className="space-y-1.5 col-span-2 sm:col-span-1 animate-fade-in">
                  <label className="text-[11px] font-semibold text-slate-500 block">Danh tánh người nói:</label>
                  <input
                    type="text"
                    value={customSpeaker}
                    onChange={(e) => setCustomSpeaker(e.target.value)}
                    placeholder="ví dụ: Mẹ bỉm, Thằng tồ, Anh hai..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {listener === "Tự Nhập" && (
                <div className="space-y-1.5 col-span-2 sm:col-span-1 animate-fade-in">
                  <label className="text-[11px] font-semibold text-slate-500 block">Danh tánh người nghe:</label>
                  <input
                    type="text"
                    value={customListener}
                    onChange={(e) => setCustomListener(e.target.value)}
                    placeholder="ví dụ: Đồng bào, Team văn phòng..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

            </div>

            {/* 4. CONTEXT FIELD */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 block uppercase">
                3. Ngữ cảnh cụ thể (Tùy chọn bổ sung):
              </label>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Ví dụ: màu sản phẩm màu hồng phấn, đính kèm sticker mèo nhỏ..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition animate-duration-150"
              />
            </div>

            {/* 5. DEVELOPMENT IDEAS */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
                <label className="text-[11px] font-bold text-slate-400 block uppercase">
                  4. Ý tưởng phát triển kịch bản (Bản quyền):
                </label>
              </div>
              <textarea
                value={ideas}
                onChange={(e) => setIdeas(e.target.value)}
                rows={3}
                className="w-full bg-slate-900/85 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none leading-relaxed transition font-sans"
              />
            </div>

            {/* 6. IMPORTANT SYSTEM WARNINGS */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-indigo-400" />
                <label className="text-[11px] font-bold text-slate-400 block uppercase">
                  5. Lưu ý quan trọng (Tránh gậy khóa tài khoản):
                </label>
              </div>
              <textarea
                value={warnings}
                onChange={(e) => setWarnings(e.target.value)}
                rows={4}
                className="w-full bg-slate-900/50 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none leading-relaxed transition font-sans"
              />
            </div>

            {/* ACTION TRIGGERS BUTTONS */}
            <button
              disabled={processingStep !== "idle" && processingStep !== "error"}
              onClick={handleStartProcessing}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-indigo-900 disabled:to-violet-900 text-white font-extrabold text-sm py-4 px-6 rounded-2xl shadow-xl shadow-indigo-650/10 hover:shadow-indigo-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {processingStep === "scanning" || processingStep === "writing" ? (
                <>
                  <RotateCw className="w-5 h-5 animate-spin text-white" />
                  <span>ĐANG KIẾN TẠO LỜI THOẠI... ({progressPercent}%)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-white animate-pulse" />
                  <span>BẮT ĐẦU XỬ LÝ QUY TRÌNH</span>
                </>
              )}
            </button>
            
          </div>
        </div>

        {/* PANEL C: RIGHT WORKSPACE OUTPUT (col-span-12 or col-span-7) */}
        <div className="lg:col-span-7 space-y-6">

          {/* ACTIVE PROCESSING STATE (Progress spinner bar UI) */}
          {(processingStep === "scanning" || processingStep === "writing") && (
            <div className="bg-[#121216] border border-indigo-500/25 rounded-3xl p-8 shadow-xl flex flex-col items-center justify-center text-center space-y-5 animate-pulse">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-slate-900 border-t-indigo-500 animate-spin flex items-center justify-center"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="w-6 h-6 text-indigo-400" />
                </div>
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h4 className="font-bold text-white text-base">Bộ máy trí óc AI đang liên hoàn phân tích</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-mono">
                  {statusMessage}
                </p>
              </div>

              <div className="w-full bg-slate-900 rounded-full h-2 relative overflow-hidden max-w-md border border-slate-800">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-600 font-mono tracking-wider uppercase">Vui lòng không tắt hoặc tải lại trang</span>
            </div>
          )}

          {/* ERROR DISPLAY */}
          {processingStep === "error" && errorMessage && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 shadow-xl space-y-3 flex items-start gap-4 animate-fade-in">
              <AlertTriangle className="w-8 h-8 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-red-400 text-sm">Gặp lỗi trong quá trình thực thi kịch bản</h4>
                <p className="text-xs text-slate-300 font-mono leading-relaxed">{errorMessage}</p>
                <div className="pt-2">
                  <button 
                    onClick={() => setProcessingStep("idle")}
                    className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold cursor-pointer transition"
                  >
                    Quay lại bảng chuẩn
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUB-APP PREVIEW OUTPUT (Tóm tắt sản phẩm & Kịch bản) */}
          {processingStep === "idle" && (scannedProduct || scripts.length > 0) ? (
            <div className="space-y-6">
              
              {/* Product Summary Card (Bước 2) */}
              {scannedProduct && (
                <div className="bg-gradient-to-br from-slate-950 to-[#121216] border border-slate-800/85 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Tổng hợp dữ liệu trích xuất (Step 1 & 2)
                    </span>
                    <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold px-2 py-0.5 rounded">
                      Đã lọc nhiễu shop
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Tên sản phẩm gốc:</span>
                      <p className="text-sm font-extrabold text-white mt-0.5">{scannedProduct.productName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Thương hiệu / Nhãn Hiệu:</span>
                      <p className="text-sm font-extrabold text-indigo-300 mt-0.5">{scannedProduct.brand || "Không phát hiện (AI Tự do gợi ý)"}</p>
                    </div>
                  </div>

                  {scannedProduct.keyPoints && scannedProduct.keyPoints.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Các ưu thế, USP cốt lõi trích xuất được:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {scannedProduct.keyPoints.map((pt, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-300 font-medium">
                            <CornerDownRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Generates list of scripts section (Bước 4) */}
              {scripts.length > 0 && (
                <div className="space-y-4">
                  
                  {/* Results Topbar control with Copy All */}
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <h3 className="font-extrabold text-white text-sm uppercase tracking-wider">
                        Danh sách kịch bản kiếm tiền ({scripts.length} bản)
                      </h3>
                    </div>
                    
                    <button
                      onClick={handleCopyAll}
                      className="px-4 py-2 cursor-pointer bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-indigo-400 hover:text-indigo-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      {isCopyAllSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Đã sao chép tất cả!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép tất cả ({scripts.length})</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Multiple scripts boxes (cards) */}
                  <div className="space-y-5">
                    {scripts.map((scPath, idx) => (
                      <div 
                        key={scPath.id || idx}
                        className="bg-[#121216] border border-slate-800/80 rounded-3xl p-5 shadow-xl relative overflow-hidden group/card transition"
                      >
                        <div className="absolute top-0 left-0 w-1 bg-indigo-500 h-full group-hover/card:bg-indigo-400 transition"></div>
                        
                        {/* Box header */}
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-900 mb-4 ml-1">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">
                                KỊCH BẢN #{idx + 1}
                              </span>
                              {scPath.strengthFocused && (
                                <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                                  Trọng tâm: {scPath.strengthFocused}
                                </span>
                              )}
                            </div>
                            <h4 className="font-extrabold text-white text-sm mt-1">{scPath.title}</h4>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Copy single button (copies ONLY content voice lines) */}
                            <button
                              onClick={() => handleCopySingle(scPath.id, scPath.content)}
                              className="p-2 cursor-pointer bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-medium transition flex items-center gap-1 border border-slate-800"
                              title="Chỉ sao chép nội dung lời thoại thuần"
                            >
                              {copiedScriptId === scPath.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span className="hidden sm:inline">Sao chép thoại</span>
                            </button>

                            {/* Regenerate modal handler ("Viết lại") */}
                            <button
                              disabled={regeneratingScriptId !== null}
                              onClick={() => setShowRevisionModalForId(scPath.id)}
                              className="p-2 cursor-pointer bg-slate-900 hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-indigo-400 rounded-xl text-xs font-medium transition flex items-center gap-1 border border-slate-800 disabled:opacity-50"
                              title="Chạy AI viết lại câu kịch bản này"
                            >
                              {regeneratingScriptId === scPath.id ? (
                                <RotateCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                              )}
                              <span className="hidden sm:inline">Viết lại</span>
                            </button>
                          </div>
                        </div>

                        {/* Speech Vocal Text box area (editable) */}
                        <div className="space-y-3 ml-1 relative">
                          {regeneratingScriptId === scPath.id && (
                            <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center backdrop-blur-xs z-10 transition">
                              <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold">
                                <RotateCw className="w-4 h-4 animate-spin" />
                                <span>AI Đang sửa đổi kịch bản...</span>
                              </div>
                            </div>
                          )}

                          {scPath.hook && (
                            <div className="p-2.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-[11px] text-slate-400 font-sans leading-relaxed flex items-start gap-1.5">
                              <span className="px-1.5 py-0.5 bg-indigo-500/15 text-indigo-400 font-extrabold uppercase rounded text-[8px] tracking-widest mt-0.5">HOOK</span>
                              <div className="flex-1 italic">"{scPath.hook}"</div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Lời thoại kịch bản (Cho phép sửa trực tiếp):</span>
                            <textarea
                              rows={5}
                              value={scPath.content}
                              onChange={(e) => handleTextareaChange(scPath.id, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500/40 font-sans"
                            />
                          </div>

                          {/* Suggested scenes summary list */}
                          {scPath.scenes && scPath.scenes.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-slate-900/50">
                              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Phân luồng cảnh quay gợi ý (Bản dựng khung):</span>
                              <div className="space-y-2">
                                {scPath.scenes.map((sn, sIdx) => (
                                  <div key={sn.sceneId || sIdx} className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 flex flex-col md:flex-row gap-2 text-[11px] text-slate-400 leading-relaxed">
                                    <div className="md:w-16 font-bold text-indigo-400 uppercase tracking-widest shrink-0">CẢNH {sn.sceneId || sIdx + 1}</div>
                                    <div className="flex-1 text-slate-300">
                                      <span className="font-extrabold text-slate-500">Góc quay:</span> {sn.visual}
                                    </div>
                                    <div className="flex-1 bg-slate-900/40 rounded px-2 py-1 text-xs border border-slate-850/60 font-medium">
                                      <span className="font-extrabold text-indigo-500 text-[10px] block mb-0.5 italic">Thoại cụ thể:</span>
                                      {sn.audio}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : processingStep === "idle" ? (
            
            /* EMPTY/WELCOME PLACEHOLDER CARD (No active runs matching request requirement 9) */
            <div className="bg-[#121216]/60 border border-dashed border-slate-850 rounded-3xl p-10 flex flex-col items-center justify-center text-center min-h-[480px] transition duration-200">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500/5 to-violet-500/5 rounded-full flex items-center justify-center mb-5 text-indigo-500/40 border border-slate-800">
                <Video className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 uppercase tracking-wide">
                Bảng viết kịch bản TikTok Affiliate V2 đang đợi lệnh
              </h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
                Tải lên 1-4 hình ảnh chụp, bấm thiết kế quy tắc cấu hình rà xóa gậy, và click bắt đầu chế tác để AI dệt thành 10+ kịch bản cùng lúc.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md text-left text-[11px] text-slate-400">
                <div className="p-3.5 bg-slate-900/50 rounded-2xl border border-slate-900 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Quét ảnh USP chuyên nghiệp</span>
                    <span>Tự động phát hiện điểm USP đặc trưng từ ảnh chụp hộp, nhãn mác.</span>
                  </div>
                </div>
                <div className="p-3.5 bg-slate-900/50 rounded-2xl border border-slate-900 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Bộ lọc phòng ngừa lỗi</span>
                    <span>Ẩn tên shop nhỏ lẻ, trừ khử colab rườm rà, bóp nghẹt hiển thị giá rủi ro.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

        </div>
      </div>

      {/* REVISION FEEDBACK MODAL (Popup - "Viết lại kịch bản") */}
      {showRevisionModalForId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            onClick={() => setShowRevisionModalForId(null)}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm cursor-pointer"
          ></div>
          <div className="bg-[#121216] border border-slate-800 rounded-3xl p-6 w-full max-w-md relative z-10 shadow-2xl animate-fade-in">
            <button 
              onClick={() => setShowRevisionModalForId(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition cursor-pointer p-1.5 bg-slate-900/50 hover:bg-slate-900 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Yêu cầu AI viết lại kịch bản</h4>
                  <p className="text-[10px] text-slate-500">Yêu cầu can thiệp chỉnh sửa riêng biệt cho kịch bản này</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-bold uppercase block">Hướng sửa đổi / Yêu cầu riêng:</label>
                <textarea
                  rows={4}
                  value={revisionFeedback}
                  onChange={(e) => setRevisionFeedback(e.target.value)}
                  placeholder="Ví dụ: viết hài hước hơn lồng ca dao tục ngữ; tập trung bộc lộ tính năng nhỏ nhẹ; bỏ từ cam kết đi..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none leading-relaxed transition"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRegenerateSingle}
                  className="flex-1 cursor-pointer bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold py-2.5 rounded-xl shadow-lg transition"
                >
                  Bắt đầu viết lại kịch bản
                </button>
                <button
                  onClick={() => setShowRevisionModalForId(null)}
                  className="cursor-pointer bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-bold py-2.5 px-4 rounded-xl transition"
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER AUTHOR ATTRIBUTION */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-700 py-4 border-t border-slate-900 font-mono">
        <span>BẢN QUYỀN THIẾT KẾ</span>
        <Heart className="w-3 h-3 text-pink-700 fill-pink-700" />
        <span>BY HỒ QUANG HIỂN</span>
      </div>
      
    </div>
  );
}
