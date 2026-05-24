import React, { useState, useEffect, useRef } from "react";
import { 
  Wand2, 
  Upload, 
  FileText, 
  Check, 
  Copy, 
  Plus, 
  Trash2, 
  History, 
  X, 
  AlertTriangle, 
  RotateCw, 
  Sparkles, 
  Undo,
  FileCode,
  Heart,
  User,
  CheckCircle2,
  Minimize2,
  RefreshCw
} from "lucide-react";
import { 
  getHistory, 
  addProjectToHistory, 
  deleteProjectFromHistory 
} from "../utils/storage";
import { 
  ScriptOptimizerProject
} from "../types";

interface ScriptOptimizerProps {
  customApiKey: string;
  onSaveApiKey: (key: string) => void;
}

export default function ScriptOptimizer({ customApiKey, onSaveApiKey }: ScriptOptimizerProps) {
  // Local states for custom API keys
  const [apiKeyInput, setApiKeyInput] = useState(customApiKey);

  // Core Editor State: contains the text in the right-column editor
  const [scriptText, setScriptText] = useState<string>(
    `[Phân cảnh 1 - Quay cận đế giày]
Nam thoại: Hôm nay Shop Thể Thao Masati Hùng Vương xin giới thiệu mẫu giày chạy bộ Masati Pro Max giá chỉ 350k rẻ nhất thị trường.

[Phân cảnh 2 - Quay toàn cảnh xỏ chân]
Nữ thoại: Mua ngay tại giỏ hàng bên dưới của Shop Thể Thao Masati Hùng Vương để nhận ưu đãi cực hời nhé các tình yêu ơi.`
  );
  
  // Previous Text State (for Undo functionality)
  const [prevScriptText, setPrevScriptText] = useState<string | null>(null);

  // Edit Prompt (Yêu cầu chỉnh sửa:)
  const [currentIssues, setCurrentIssues] = useState<string>(
    "Loại bỏ các yếu tố như tên shop bán hàng, Tên đơn vị truyền thông hợp tác quảng bá sản phẩm, chỉ dữ lại tên Nhãn hiệu/ Nhà sản xuất + Mã sản phẩm. // Đọc hiểu và nhận dạng 3 nhóm thương hiệu này và loại bỏ các phần yêu cầu chỉ dữ lại Nhãn hiệu/ Nhà sản xuất + Mã sản phẩm."
  );

  // Modals for Loading Data
  const [showFileUploadModal, setShowFileUploadModal] = useState<boolean>(false);
  const [showDirectInputModal, setShowDirectInputModal] = useState<boolean>(false);
  const [directInputTemp, setDirectInputTemp] = useState<string>("");

  // History and Saved Projects representation
  const [historyList, setHistoryList] = useState<ScriptOptimizerProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showHistoryPane, setShowHistoryPane] = useState<boolean>(false);

  // File Uploading & Parsing states
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [fileParsingMsg, setFileParsingMsg] = useState<string>("");
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Running Control states
  const [processingState, setProcessingState] = useState<"idle" | "running" | "error">("idle");
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Copy indicator
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Find & Replace state
  const [findText, setFindText] = useState<string>("");
  const [replaceText, setReplaceText] = useState<string>("");

  // Sync customApiKey
  useEffect(() => {
    setApiKeyInput(customApiKey);
  }, [customApiKey]);

  // Load history list with namespace "script-optimizer"
  const loadHistory = () => {
    const list = getHistory<ScriptOptimizerProject>("script-optimizer");
    setHistoryList(list);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSelectProject = (project: ScriptOptimizerProject) => {
    setActiveProjectId(project.id);
    const loadedText = project.result?.optimizedScript || project.inputs?.originalScript || "";
    setPrevScriptText(scriptText);
    setScriptText(loadedText);
    setCurrentIssues(project.inputs?.currentIssues || "");
    setProcessingState("idle");
    setErrorStatus(null);
    setSuccessMessage("Đã tải dự án từ lịch sử!");
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleResetNewProject = () => {
    setActiveProjectId(null);
    setPrevScriptText(scriptText);
    setScriptText("");
    setCurrentIssues(
      "Loại bỏ các yếu tố như tên shop bán hàng, Tên đơn vị truyền thông hợp tác quảng bá sản phẩm, chỉ dữ lại tên Nhãn hiệu/ Nhà sản xuất + Mã sản phẩm. // Đọc hiểu và nhận dạng 3 nhóm thương hiệu này và loại bỏ các phần yêu cầu chỉ dữ lại Nhãn hiệu/ Nhà sản xuất + Mã sản phẩm."
    );
    setProcessingState("idle");
    setErrorStatus(null);
    setSuccessMessage("Trình soạn thảo đã được dọn sạch.");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteHistoryProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa dự án kịch bản lịch sử này?")) {
      const updated = deleteProjectFromHistory<ScriptOptimizerProject>("script-optimizer", id);
      setHistoryList(updated);
      if (activeProjectId === id) {
        setActiveProjectId(null);
      }
    }
  };

  // Direct Input Submit: Pushes the workspace content into the right column (scriptText)
  const handleDirectInputSubmit = () => {
    if (!directInputTemp.trim()) {
      alert("Vui lòng nhập nội dung kịch bản hợp lý.");
      return;
    }
    setPrevScriptText(scriptText);
    setScriptText(directInputTemp);
    setShowDirectInputModal(false);
    setSuccessMessage("Đã chuyển nội dung của bạn vào màn hình biên tập bên phải.");
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Undo Functionality
  const handleUndo = () => {
    if (prevScriptText !== null) {
      const current = scriptText;
      setScriptText(prevScriptText);
      setPrevScriptText(current);
      setSuccessMessage("Đã phục hồi phiên bản trước!");
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Find and replace text
  const handleFindReplace = (replaceAll = true) => {
    if (!findText) {
      alert("Vui lòng nhập từ khóa cần tìm.");
      return;
    }
    if (!scriptText) {
      alert("Khung soạn thảo hiện đang trống.");
      return;
    }

    setPrevScriptText(scriptText);
    
    // Escaping search string for regex
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    let newText = "";
    if (replaceAll) {
      const regex = new RegExp(escaped, 'g');
      newText = scriptText.replace(regex, replaceText);
    } else {
      const regex = new RegExp(escaped);
      newText = scriptText.replace(regex, replaceText);
    }

    if (scriptText === newText) {
      setSuccessMessage(`Không tìm thấy từ khóa "${findText}" trong kịch bản.`);
    } else {
      setScriptText(newText);
      setSuccessMessage(`Đã thay thế "${findText}" thành "${replaceText}" thành công!`);
    }
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Drag-and-drop file helpers
  const handleDragOverFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeaveFile = () => {
    setIsDraggingFile(false);
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleParseLocalFile(e.dataTransfer.files[0]);
    }
  };

  // File uploading parser
  const handleParseLocalFile = async (file: File) => {
    setIsParsingFile(true);
    setFileParsingMsg(`Đang trích xuất nội dung từ tệp: ${file.name}...`);
    
    try {
      const fileReader = new FileReader();

      // For plain txt or csv files
      if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".csv")) {
        fileReader.onload = (e) => {
          if (e.target?.result) {
            setPrevScriptText(scriptText);
            setScriptText(e.target.result as string);
            setIsParsingFile(false);
            setShowFileUploadModal(false);
            setSuccessMessage(`Đã nạp văn bản từ: ${file.name}`);
            setTimeout(() => setSuccessMessage(null), 4000);
          }
        };
        fileReader.readAsText(file);
        return;
      }

      // Base64 backend decoder for PDF, Docx
      fileReader.onloadend = async () => {
        const base64Data = fileReader.result as string;
        try {
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (customApiKey) {
            headers["x-gemini-key"] = customApiKey;
          }

          const response = await fetch("/api/script-optimizer/parse-file", {
            method: "POST",
            headers,
            body: JSON.stringify({
              fileData: base64Data,
              fileName: file.name,
              mimeType: file.type || "application/pdf"
            })
          });

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Không thể phân tích tệp qua AI");
          }

          const resData = await response.json();
          if (resData.text) {
            setPrevScriptText(scriptText);
            setScriptText(resData.text);
            setShowFileUploadModal(false);
            setSuccessMessage(`Đã nạp văn bản từ: ${file.name}`);
            setTimeout(() => setSuccessMessage(null), 4000);
          } else {
            throw new Error("Không giải tách được văn bản từ file...");
          }
        } catch (subErr: any) {
          alert("Lỗi đọc file: " + subErr.message);
        } finally {
          setIsParsingFile(false);
        }
      };
      fileReader.readAsDataURL(file);
    } catch (err: any) {
      alert("Gặp sự cố đọc tệp: " + err.message);
      setIsParsingFile(false);
    }
  };

  // Trigger Gemini Simple Edit
  const handleStartOptimization = async () => {
    if (!scriptText.trim()) {
      setErrorStatus("Vui lòng tải tệp kịch bản hoặc viết văn bản ở khung soạn thảo bên phải trước khi nhấn nút.");
      return;
    }

    setProcessingState("running");
    setErrorStatus(null);
    setSuccessMessage(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customApiKey) {
        headers["x-gemini-key"] = customApiKey;
      }

      const response = await fetch("/api/script-optimizer/simple-edit", {
        method: "POST",
        headers,
        body: JSON.stringify({
          scriptText,
          instructions: currentIssues
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Lỗi phản hồi hệ thống (${response.status})`);
      }

      const resultData = await response.json();
      if (!resultData.text) {
        throw new Error("Không nhận được kết quả kịch bản chỉnh sửa từ AI.");
      }

      // Commit changes to workspace
      setPrevScriptText(scriptText);
      setScriptText(resultData.text);
      setSuccessMessage("Đã sửa đổi & tối ưu kịch bản trực tiếp thành công!");

      // Save to local storage history tracking
      const savedProjId = activeProjectId || `script-optim-${Date.now()}`;
      const savedProject: ScriptOptimizerProject = {
        id: savedProjId,
        title: `Biên tập: ${resultData.text.substring(0, 25).trim()}...`,
        createdAt: new Date().toISOString(),
        inputs: {
          originalScript: scriptText,
          currentIssues,
          improvementFocus: "{}"
        },
        result: {
          optimizedScript: resultData.text,
          explanationOfChanges: [],
          ctaEnhancement: "",
          predictedImpact: ""
        }
      };

      addProjectToHistory<ScriptOptimizerProject>("script-optimizer", savedProject);
      setActiveProjectId(savedProjId);
      loadHistory();
      
      setProcessingState("idle");

      // Clear standard success notify
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Kết nối AI hoặc máy chủ bị thất bại.");
      setProcessingState("error");
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in w-full text-slate-200" id="script-optimizer-app">
      
      {/* 1. APP HEADER AREA */}
      <div className="bg-[#121216] border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md" id="header-container">
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 blur-2xl rounded-full"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-600/10 border border-pink-500/20 text-pink-400 rounded-2xl">
              <Wand2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Tối Ưu & Sửa Kịch Bản <span className="text-[10px] bg-pink-500/10 border border-pink-500/20 text-pink-400 px-2 py-0.5 rounded">TEXT PRO</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhập kịch bản hặc tài liệu, điền yêu cầu chỉnh sửa và sửa đổi trực tiếp trên một văn bản duy nhất.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleResetNewProject}
              className="px-4 py-2 cursor-pointer bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              id="btn-new-proj"
            >
              <Plus className="w-4 h-4 text-pink-400" />
              <span>Dọn dẹp / Viết mới</span>
            </button>
            <button
              onClick={() => setShowHistoryPane(!showHistoryPane)}
              className={`px-4 py-2 cursor-pointer border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                showHistoryPane 
                  ? "bg-pink-600/15 border-pink-500/30 text-pink-300"
                  : "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-450"
              }`}
              id="btn-toggle-history"
            >
              <History className="w-4 h-4" />
              <span>Lịch sử ({historyList.length})</span>
            </button>
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500 bg-slate-900 px-3 py-2 border border-slate-800 rounded-xl" id="by-author-tag">
              <User className="w-3.5 h-3.5 text-pink-400 mr-1" />
              <span>By HỒ QUANG HIỂN</span>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS POPUP OR FLOATING NOTIFICATION BANNER */}
      {successMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs animate-fade-in" id="notification-success-banner">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* HISTORY ACCORDION CONTAINER */}
        {showHistoryPane && (
          <div className="lg:col-span-12 bg-[#121216] border border-slate-800/80 rounded-3xl p-5 shadow-xl animate-fade-in" id="history-box-extended">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-bold text-pink-400 uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4" /> Các kịch bản lịch sử lưu trữ
              </span>
              <button 
                onClick={() => setShowHistoryPane(false)} 
                className="text-slate-500 hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {historyList.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">Chưa có lịch sử sửa đổi nào được lưu lại.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {historyList.map(proj => (
                  <div
                    key={proj.id}
                    onClick={() => handleSelectProject(proj)}
                    className={`p-3 bg-slate-900/60 hover:bg-slate-900/100 border rounded-2xl cursor-pointer transition flex items-center justify-between text-left ${
                      activeProjectId === proj.id ? "border-pink-500 bg-pink-950/10" : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="text-xs font-bold text-white truncate">{proj.title}</p>
                      <span className="text-[10px] text-slate-550">
                        {new Date(proj.createdAt).toLocaleDateString("vi-VN")} - {new Date(proj.createdAt).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteHistoryProject(proj.id, e)}
                      className="text-slate-600 hover:text-red-400 rounded p-1 hover:bg-slate-800 transition"
                      title="Xóa kịch bản"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LEFT COLUMN: SOURCE DATA LOADERS & USER REQUIREMENTS (col-span-5) */}
        <div className="lg:col-span-5 flex flex-col gap-6" id="left-column-control">
          
          {/* A. WORKSPACE LOAD COMPONENT (NỘP / NHẬP LIỆU) */}
          <div className="bg-[#121216] border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4 flex-1">
            <div>
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                1. NẠP DỮ LIỆU KỊCH BẢN GỐC
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Nhập văn bản mới hoặc dán file kịch bản của bạn dồn thẳng xuống trình soạn thảo kịch bản kề bên.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Load File Button */}
              <button
                type="button"
                onClick={() => setShowFileUploadModal(true)}
                className="p-4 bg-slate-900/80 hover:bg-indigo-600/10 border border-slate-800 hover:border-indigo-500/40 rounded-2xl transition duration-150 flex flex-col items-center gap-2 cursor-pointer text-center group"
                id="btn-upload-file-trigger"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition duration-150">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-200 block">Tải File Lên</span>
                <span className="text-[9px] text-slate-500 font-mono">Word, PDF, TXT...</span>
              </button>

              {/* Direct Input Panel */}
              <button
                type="button"
                onClick={() => {
                  setDirectInputTemp(scriptText);
                  setShowDirectInputModal(true);
                }}
                className="p-4 bg-slate-900/80 hover:bg-pink-600/10 border border-slate-800 hover:border-pink-500/40 rounded-2xl transition duration-150 flex flex-col items-center gap-2 cursor-pointer text-center group"
                id="btn-direct-input-trigger"
              >
                <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center group-hover:scale-105 transition duration-150">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-200 block">Dán Văn Bản</span>
                <span className="text-[9px] text-slate-500 font-mono">Nhập nhanh / Đánh máy</span>
              </button>
            </div>

            <div className="text-[10px] text-slate-500 leading-normal bg-slate-950/30 p-3 rounded-xl border border-slate-850">
              📌 Mẹo: Bạn có thể cập nhật nội dung trực tiếp bất cứ lúc nào bằng cách đánh chữ / ghi đè ngay trên ô soạn thảo lớn ở khung bên phải cực tiện lợi.
            </div>
          </div>

          {/* B. DETAILED RE-WRITE COMMAND (3.1 YÊU CẦU CHỈNH SỬA) */}
          <div className="bg-[#121216] border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4" id="instructions-card">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-indigo-400 uppercase tracking-wide flex items-center justify-between">
                <span>3.1 YÊU CẦU CHỈNH SỬA:</span>
                <span className="text-[9px] text-slate-500 tracking-normal font-normal">Trò chuyện với lệnh duy nhất</span>
              </label>
              <textarea
                value={currentIssues}
                onChange={(e) => setCurrentIssues(e.target.value)}
                rows={5}
                placeholder="Ví dụ: Hãy sửa lỗi bớt tên shop, viết mượt hơn, hoặc sắp xếp lại CTA sinh động..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-pink-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-650 focus:outline-none transition leading-relaxed font-sans"
                id="edit-requirements-textarea"
              />
              <p className="text-[10px] text-slate-550 leading-snug">
                Hệ thống AI sẽ quét nội dung kịch bản phía cột phải và thi hành đúng chỉ thị bạn đặt tại đây để hoàn tác chỉnh sửa nâng cao trực tiếp.
              </p>
            </div>

            {/* ERROR NOTIFICATION PANEL */}
            {errorStatus && (
              <div className="bg-red-500/15 border border-red-500/25 p-3 rounded-xl flex items-start gap-2 text-xs text-red-400 animate-fade-in" id="error-status-block">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="font-mono leading-tight">{errorStatus}</span>
              </div>
            )}

            {/* MAIN SYSTEM CALL ACTION RUNNER */}
            <button
              disabled={processingState === "running" || !scriptText.trim()}
              onClick={handleStartOptimization}
              className="w-full bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 disabled:from-pink-950 disabled:to-indigo-950 text-white font-extrabold text-xs py-4 px-6 rounded-2xl shadow-xl shadow-pink-650/10 hover:shadow-indigo-550/15 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              id="btn-trigger-optimization"
            >
              {processingState === "running" ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-white" />
                  <span>AI ĐANG CHỈNH SỬA THÔNG MINH...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-white text-pink-400 animate-pulse" />
                  <span>SỬA THÔNG MINH BẰNG AI</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: THE CONTINUOUS SINGLE-TEXT SOẠN THẢO WORKSPACE (col-span-12 or col-span-7) */}
        <div className="lg:col-span-7 flex flex-col" id="right-column-text-workspace">
          
          <div className="bg-[#121216] border border-slate-800/80 rounded-3xl p-6 shadow-xl flex flex-col flex-1 relative overflow-hidden">
            
            {/* Ambient subtle light for active working editor */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/5 blur-3xl rounded-full pointer-events-none"></div>

            {/* EDITOR HEADER CONTROLS */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80 mb-4 z-10" id="editor-header">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">
                  KHUNG SOẠN THẢO / KỊCH BẢN CHÍNH
                </span>
                <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full font-mono">
                  {scriptText.length} ký tự
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Re-write undo trigger */}
                {prevScriptText !== null && (
                  <button
                    onClick={handleUndo}
                    className="p-1 px-2.5 bg-slate-900 border border-slate-800 text-pink-400 hover:text-pink-300 text-[10px] font-bold rounded-lg flex items-center gap-1 transition"
                    title="Hoàn tác về phiên bản kịch bản trước vừa được AI sửa đổi hoặc nạp"
                    id="btn-undo-action"
                  >
                    <Undo className="w-3.5 h-3.5" />
                    <span>Hoàn tác</span>
                  </button>
                )}

                {/* Clear Input Shortcut */}
                {scriptText && (
                  <button
                    onClick={() => {
                      if (confirm("Dọn trống bàn soạn thảo?")) {
                        setPrevScriptText(scriptText);
                        setScriptText("");
                      }
                    }}
                    className="p-1 px-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors"
                    title="Xóa toàn bộ văn bản kịch bản hiện tại"
                    id="btn-clear-editor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Dọn sạch</span>
                  </button>
                )}

                {/* Copy Text Shortcut */}
                <button
                  onClick={() => copyToClipboard(scriptText)}
                  disabled={!scriptText}
                  className="p-1.5 px-3 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white text-[10px] font-extrabold rounded-lg flex items-center gap-1.5 transition"
                  id="btn-copy-clipboard-main"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span className="text-emerald-300">Đã chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* GIANT EDITABLE WRITING WORKSPACE */}
            <div className="relative flex-1 flex flex-col z-10" id="editor-body">
              {processingState === "running" && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fade-in" id="running-overlay-editor">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full border-4 border-slate-900 border-t-pink-500 animate-spin flex items-center justify-center"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Wand2 className="w-5 h-5 text-pink-400 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center space-y-1 max-w-xs">
                    <p className="font-bold text-white text-sm">Hồ Quang Hiển AI đang chỉnh sửa kịch bản...</p>
                    <p className="text-[10px] text-slate-500 font-mono">Vui lòng đợi trong giây lát</p>
                  </div>
                </div>
              )}

              {/* TOOLBAR TÌM VÀ THAY THẾ */}
              <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl mb-3 flex flex-col sm:flex-row gap-2.5 items-end justify-between text-xs z-10 animate-fade-in" id="find-replace-toolbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-grow w-full">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tìm kiếm từ/ cụm từ:</span>
                    <input
                      type="text"
                      value={findText}
                      onChange={(e) => setFindText(e.target.value)}
                      placeholder="Nhập từ cần tìm..."
                      className="w-full bg-slate-950 border border-slate-800/80 focus:border-pink-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-700 outline-none transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Thay thế bằng:</span>
                    <input
                      type="text"
                      value={replaceText}
                      onChange={(e) => setReplaceText(e.target.value)}
                      placeholder="Nhập từ thay thế..."
                      className="w-full bg-slate-950 border border-slate-800/80 focus:border-pink-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-700 outline-none transition"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => handleFindReplace(false)}
                    className="flex-1 sm:flex-initial cursor-pointer py-1.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-250 text-[10px] font-bold rounded-lg transition"
                    title="Thay thế từ đầu tiên tìm thấy"
                  >
                    Thay thế đầu
                  </button>
                  <button
                    onClick={() => handleFindReplace(true)}
                    className="flex-1 sm:flex-initial cursor-pointer py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-white text-[10px] font-bold rounded-lg transition animate-pulse"
                    title="Thay thế hoàn toàn trong toàn bộ kịch bản"
                  >
                    Thay thế tất cả
                  </button>
                </div>
              </div>

              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                placeholder="Nhập hoặc dán nội dung kịch bản của bạn tại đây, hoặc bấm nạp dữ liệu ở khung bên trái. Bạn có thể tự do biên tập, viết chữ hoặc gõ phím trực tiếp trên khung này!"
                className="w-full flex-1 min-h-[480px] bg-[#0c0c0f] border border-slate-800/50 rounded-2xl p-4 text-slate-200 font-mono text-xs placeholder-slate-700 focus:outline-none focus:border-slate-700/80 focus:ring-0 leading-relaxed overflow-y-auto resize-none"
                id="main-script-textarea-editor"
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-600 font-mono border-t border-slate-900 pt-3" id="editor-footer">
              <span>TRÌNH SOẠN THẢO VĂN BẢN TRỰC TIẾP</span>
              <span>SỬ DỤNG PHÍM GÕ TỰ DO ĐỂ CHỈNH SỬA THỦ CÔNG</span>
            </div>

          </div>

        </div>

      </div>

      {/* ==================== POPUP 1: DOWNLOAD / PARSE LOCAL FILE MODAL ==================== */}
      {showFileUploadModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowFileUploadModal(false)}
              className="absolute top-4 right-4 text-slate-550 hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-white">Tải Lên Kịch Bản Tài Liệu</h3>
              <p className="text-[11px] text-slate-500 font-sans">
                Chọn file kịch bản của bạn để AI trích trực xuất thẳng vào khung soạn thảo:
              </p>
            </div>

            <div
              onDragOver={handleDragOverFile}
              onDragLeave={handleDragLeaveFile}
              onDrop={handleDropFile}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition py-12 ${
                isDraggingFile 
                  ? "border-pink-500 bg-pink-500/5 text-pink-300"
                  : "border-slate-800 hover:border-pink-500/40 bg-slate-950/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.docx,.pdf,.doc,.csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleParseLocalFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <Upload className="w-10 h-10 text-pink-400 mb-2.5 animate-bounce" />
              <span className="text-xs text-slate-200 font-extrabold mb-1">Kéo thả tài liệu của bạn vào đây</span>
              <span className="text-[10px] text-slate-500 max-w-xs leading-normal">
                Hỗ trợ đọc trích xuất tự động văn bản từ tệp Word, PDF, CSV, TXT cực nhanh qua AI.
              </span>
            </div>

            {isParsingFile && (
              <div className="p-3 bg-pink-950/15 border border-pink-500/10 rounded-xl text-center space-y-2 animate-pulse">
                <RotateCw className="w-4 h-4 animate-spin text-pink-400 mx-auto" />
                <p className="text-[10px] text-pink-300 font-mono tracking-wide">{fileParsingMsg}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowFileUploadModal(false)}
                className="flex-1 cursor-pointer py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== POPUP 2: DIRECT INPUT COPIED POPUP ==================== */}
      {showDirectInputModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowDirectInputModal(false)}
              className="absolute top-4 right-4 text-slate-550 hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-white">Dán Kịch Bản Muốn Sửa</h3>
              <p className="text-[11px] text-slate-500 font-sans">
                Dán hoặc soạn thảo nhanh văn bản kịch bản của bạn vào ô biên soạn tạm dưới đây:
              </p>
            </div>

            <textarea
              value={directInputTemp}
              onChange={(e) => setDirectInputTemp(e.target.value)}
              rows={12}
              placeholder="Dán toàn bộ kịch bản thô hoặc viết kịch bản của bạn tại đây..."
              className="w-full bg-[#0c0c0f] border border-slate-800 focus:border-pink-500 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-700 focus:outline-none transition leading-relaxed font-mono"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowDirectInputModal(false)}
                className="flex-1 cursor-pointer py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDirectInputSubmit}
                className="flex-1 cursor-pointer py-2.5 bg-pink-600 hover:bg-pink-500 rounded-xl text-xs font-extrabold text-white transition shadow-lg shadow-pink-550/10"
              >
                Nạp trực tiếp vào ô soạn thảo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER attribution */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-700 py-4 border-t border-slate-900 font-mono">
        <span>BẢN QUYỀN THIẾT KẾ</span>
        <Heart className="w-3 h-3 text-pink-700 fill-pink-700" />
        <span>BY HỒ QUANG HIỂN</span>
      </div>

    </div>
  );
}
