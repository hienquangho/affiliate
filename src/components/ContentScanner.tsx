import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldAlert, 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  HelpCircle,
  Play,
  RotateCw,
  User,
  Heart,
  Upload,
  FileText,
  FileCode,
  Check,
  Copy,
  Plus,
  Trash2,
  History,
  X,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Clipboard,
  Sliders,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  BookOpen,
  Settings,
  Layout,
  Filter,
  Layers,
  FileSpreadsheet
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ContentScannerProps {
  customApiKey: string;
  onSaveApiKey: (key: string) => void;
}

// Sub-app 4 Custom Local Project Structure
interface ScriptItem {
  id: string;
  text: string;
}

interface ScannedScriptResult {
  id: string;
  originalText: string;
  optimizedText: string;
  isDuplicate: boolean;
  originalHook: string;
  newHook: string;
  explanation?: string;
}

interface LocalScannerProject {
  id: string;
  name: string;
  createdAt: string;
  scripts: ScriptItem[];
  scanResult?: {
    duplicateCount: number;
    findingsMsg: string;
    scripts: ScannedScriptResult[];
  };
}

const LOCAL_STORAGE_KEY = "local-content-scanner-projects-v1";

// Helper function to smartly separate input blocks into distinct scripts
function parseTextToScripts(rawText: string): string[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split("\n");

  // Helper matching lines that contain ONLY delimiter characters like -, =, _, *, ~ (min length 2)
  const isSeparatorLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return false;
    // Check if consists solely of repeating separators: - = _ * ~ +
    const isSymbolsOnly = /^[-=_*~+]+$/.test(trimmed);
    return isSymbolsOnly && trimmed.length >= 2;
  };

  const hasSeparator = lines.some(isSeparatorLine);

  if (hasSeparator) {
    const scripts: string[] = [];
    let currentBlockLines: string[] = [];

    for (const line of lines) {
      if (isSeparatorLine(line)) {
        const text = currentBlockLines.join("\n").trim();
        if (text) {
          scripts.push(text);
        }
        currentBlockLines = [];
      } else {
        currentBlockLines.push(line);
      }
    }
    const lastText = currentBlockLines.join("\n").trim();
    if (lastText) {
      scripts.push(lastText);
    }
    return scripts;
  } else {
    // If no explicit separators, fallback to simple line-by-line split
    return lines
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }
}

export default function ContentScanner({ customApiKey, onSaveApiKey }: ContentScannerProps) {
  // ----------------------------------------------------
  // States
  // ----------------------------------------------------
  
  // Project list state
  const [projects, setProjects] = useState<LocalScannerProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Active Project States
  const [projectName, setProjectName] = useState<string>("Dự án Masati N068");
  const [scriptsList, setScriptsList] = useState<ScriptItem[]>([]);
  const [scanResult, setScanResult] = useState<LocalScannerProject["scanResult"] | undefined>(undefined);

  // Popups & Modal controls
  const [showFileUploadModal, setShowFileUploadModal] = useState<boolean>(false);
  const [showDirectInputModal, setShowDirectInputModal] = useState<boolean>(false);
  
  // Temporary input state
  const [directInputText, setDirectInputText] = useState<string>("");
  const [shouldSplitByLines, setShouldSplitByLines] = useState<boolean>(true);

  // Scan execution states
  const [scanningStatus, setScanningStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanProgressMsg, setScanProgressMsg] = useState<string>("");
  const [scanErrorMsg, setScanErrorMsg] = useState<string | null>(null);

  // UI state
  const [activeLayoutTab, setActiveLayoutTab] = useState<"edit" | "result">("edit");
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showHistoryPane, setShowHistoryPane] = useState<boolean>(false);

  // Ref for manual file input element
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [isParsingDoc, setIsParsingDoc] = useState<boolean>(false);
  const [docParseMsg, setDocParseMsg] = useState<string>("");

  // Copy feedbacks
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSttId, setCopiedSttId] = useState<string | null>(null);
  const [copiedAllFeedback, setCopiedAllFeedback] = useState<boolean>(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number | "All">("All");

  // ----------------------------------------------------
  // Initialize and LocalStorage Synchronization
  // ----------------------------------------------------
  useEffect(() => {
    // Load from LocalStorage on mount
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as LocalScannerProject[];
        setProjects(parsed);
        if (parsed.length > 0) {
          // Select newest or first
          loadProjectIntoState(parsed[0]);
        } else {
          // Setup a default initial project
          setupDefaultProject();
        }
      } else {
        setupDefaultProject();
      }
    } catch (err) {
      console.error("Error standardizing local projects:", err);
      setupDefaultProject();
    }
  }, []);

  const setupDefaultProject = () => {
    const defaultProj: LocalScannerProject = {
      id: "scanner-proj-default",
      name: "Masati N068",
      createdAt: new Date().toISOString(),
      scripts: [
        {
          id: "s1",
          text: "Hôm nay shop mang đến mẫu giày thể thao Masati tuyệt đẹp phù hợp cho cả đi làm lẫn đi chơi. Sản phẩm có đế cao su êm ái, bám đường tốt, thiết kế hiện đại hợp xu hướng."
        },
        {
          id: "s2",
          text: "Hôm nay shop mang đến mẫu giày thể thao Masati tuyệt đẹp và bám đường nhất quả đất. Hãy cùng chiêm ngưỡng đế nâng chiều cao cao cấp này nhé mng."
        },
        {
          id: "s3",
          text: "Khai xuân rực rỡ cùng mẫu giày thể thao Masati trẻ trung độc quyền năm mới 2026. Đây là dòng sản phẩm limited vừa ra mắt của nhà sản xuất, chất da mềm mại và thoáng khí."
        }
      ]
    };
    setProjects([defaultProj]);
    loadProjectIntoState(defaultProj);
  };

  const loadProjectIntoState = (proj: LocalScannerProject) => {
    setActiveProjectId(proj.id);
    setProjectName(proj.name);
    setScriptsList(proj.scripts || []);
    setScanResult(proj.scanResult);
    setScanningStatus(proj.scanResult ? "done" : "idle");
    setCurrentPage(1);
    
    // Auto switch tab if scanned
    if (proj.scanResult) {
      setActiveLayoutTab("result");
    } else {
      setActiveLayoutTab("edit");
    }
  };

  // Save projects change to local storage and update corresponding list
  const persistProjectsList = (updatedList: LocalScannerProject[]) => {
    setProjects(updatedList);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (err) {
      console.error("Failed to persist content scanner projects:", err);
    }
  };

  // Auto save current project changes when scripts or results mutated
  useEffect(() => {
    if (!activeProjectId) return;
    
    setProjects(prev => {
      const idx = prev.findIndex(p => p.id === activeProjectId);
      if (idx === -1) return prev;
      
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        name: projectName,
        scripts: scriptsList,
        scanResult: scanResult
      };
      
      // Save to localStorage
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Local sync error:", err);
      }

      return updated;
    });
  }, [projectName, scriptsList, scanResult, activeProjectId]);

  // ----------------------------------------------------
  // Operations & Actions
  // ----------------------------------------------------

  // RESET / NEW PROJECT ACTION
  const handleCreateNewProject = () => {
    const newId = `proj-${Date.now()}`;
    const newProj: LocalScannerProject = {
      id: newId,
      name: `Kịch bản Quét ${projects.length + 1}`,
      createdAt: new Date().toISOString(),
      scripts: []
    };

    const updatedList = [newProj, ...projects];
    persistProjectsList(updatedList);
    loadProjectIntoState(newProj);
    setActiveLayoutTab("edit");
    setScanningStatus("idle");
    setScanResult(undefined);
  };

  // RENAME ACTIVE PROJECT
  const handleRenameProject = (newName: string) => {
    setProjectName(newName);
  };

  // DELETE HISTORICAL PROJECT
  const handleDeleteProject = (projId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn dự án quét này?")) {
      const updated = projects.filter(p => p.id !== projId);
      persistProjectsList(updated);
      
      if (activeProjectId === projId) {
        if (updated.length > 0) {
          loadProjectIntoState(updated[0]);
        } else {
          setupDefaultProject();
        }
      }
    }
  };

  // ADD INDIVIDUAL SCRIPT
  const handleAddSingleEmptyScript = () => {
    const newId = `script-node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setScriptsList(prev => [
      ...prev,
      { id: newId, text: "" }
    ]);
  };

  const handleUpdateScriptText = (id: string, text: string) => {
    setScriptsList(prev => prev.map(item => item.id === id ? { ...item, text } : item));
    // Reset scan result since inputs changed to avoid dirty states
    if (scanResult) {
      setScanResult(undefined);
      setScanningStatus("idle");
    }
  };

  const handleDeleteScriptFromList = (id: string) => {
    setScriptsList(prev => prev.filter(item => item.id !== id));
    if (scanResult) {
      setScanResult(undefined);
      setScanningStatus("idle");
    }
  };

  // POPUP POPULATION: DIRECT INSERT
  const handleDirectInputSubmit = () => {
    if (!directInputText.trim()) {
      alert("Vui lòng nhập nội dung kịch bản.");
      return;
    }

    if (shouldSplitByLines) {
      // Smart split by newline or custom separator lines (like ---, ===, etc.)
      const parsedScripts = parseTextToScripts(directInputText);

      const parsedItems = parsedScripts.map((textStr, idx) => ({
        id: `script-direct-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
        text: textStr
      }));

      setScriptsList(prev => [...prev, ...parsedItems]);
    } else {
      // Treat entire input as 1 script box
      const newId = `script-direct-single-${Date.now()}`;
      setScriptsList(prev => [...prev, { id: newId, text: directInputText.trim() }]);
    }

    setDirectInputText("");
    setShowDirectInputModal(false);
    if (scanResult) {
      setScanResult(undefined);
      setScanningStatus("idle");
    }
  };

  // DOCUMENT IMPORT READER via backend or text extraction
  const handleParseLocalFile = async (file: File) => {
    setIsParsingDoc(true);
    setDocParseMsg(`Đang trích xuất dữ liệu từ: ${file.name}...`);
    
    try {
      const fileReader = new FileReader();

      // Read text based immediately on frontend
      if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".csv")) {
        fileReader.onload = (e) => {
          if (e.target?.result) {
            const rawBody = e.target.result as string;
            // Smart split of plain text or dividers (like ---, ===, etc.)
            const parsedScripts = parseTextToScripts(rawBody);
            const parsedItems = parsedScripts.map((textStr, idx) => ({
              id: `script-file-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
              text: textStr
            }));
            
            setScriptsList(prev => [...prev, ...parsedItems]);
            setIsParsingDoc(false);
            setShowFileUploadModal(false);
          }
        };
        fileReader.readAsText(file);
        return;
      }

      // PDF, Word via backend
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
            throw new Error(err.error || "Không thể nạp dọc tệp thông tin.");
          }

          const resData = await response.json();
          if (resData.text) {
            // Smart split of plain text or dividers (like ---, ===, etc.)
            const parsedScripts = parseTextToScripts(resData.text);
            const parsedItems = parsedScripts.map((textStr: string, idx: number) => ({
              id: `script-file-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
              text: textStr
            }));

            setScriptsList(prev => [...prev, ...parsedItems]);
            setShowFileUploadModal(false);
          } else {
            throw new Error("Không lấy được chuỗi thô từ AI.");
          }
        } catch (subErr: any) {
          alert("Lỗi đọc tài liệu: " + subErr.message);
        } finally {
          setIsParsingDoc(false);
        }
      };
      fileReader.readAsDataURL(file);
    } catch (err: any) {
      alert("Đọc tệp tin thất bại: " + err.message);
      setIsParsingDoc(false);
    }
  };

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

  // ----------------------------------------------------
  // ENGINE: EXECUTE MULTI-SCRIPT DUPLICATE DUPLICATION SCAN
  // ----------------------------------------------------
  const handleStartDuplicationScan = async () => {
    // Filter and sanitize scripts
    const filteredScripts = scriptsList.filter(s => s.text.trim().length > 0);
    if (filteredScripts.length === 0) {
      alert("Vui lòng nạp tối thiểu 1 kịch bản có nội dung để rà soát.");
      return;
    }

    setScanningStatus("running");
    setScanProgress(10);
    setScanProgressMsg("Đang chuẩn bị danh sách kịch bản...");
    setScanErrorMsg(null);

    try {
      // Simulate progress stages to feel incredibly premium
      const timer1 = setTimeout(() => {
        setScanProgress(30);
        setScanProgressMsg("Đang chiết tách Hook dẫn nhập (1-3 câu đầu)...");
      }, 800);

      const timer2 = setTimeout(() => {
        setScanProgress(60);
        setScanProgressMsg("Đang đối chiếu mức độ tương đồng câu từ (>60%)...");
      }, 1800);

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customApiKey) {
        headers["x-gemini-key"] = customApiKey;
      }

      // Convert into standard payload structure
      const payloadScripts = filteredScripts.map(s => ({
        id: s.id,
        text: s.text
      }));

      const response = await fetch("/api/content-scanner/scan", {
        method: "POST",
        headers,
        body: JSON.stringify({
          projectName,
          scripts: payloadScripts
        })
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Lỗi máy chủ (${response.status})`);
      }

      const data = await response.json();
      
      setScanProgress(100);
      setScanProgressMsg("Quét trực quan kết thúc!");

      // Map back to guarantee no script loss!
      // If server returned fewer scripts for any reason, auto-fill standard entries 
      const mappedResults: ScannedScriptResult[] = filteredScripts.map((orig, index) => {
        const returnedResult = data.scripts?.find((r: any) => r.id === orig.id);
        if (returnedResult) {
          return {
            id: orig.id,
            originalText: orig.text,
            optimizedText: returnedResult.optimizedText || orig.text,
            isDuplicate: !!returnedResult.isDuplicate,
            originalHook: returnedResult.originalHook || orig.text.substring(0, 50),
            newHook: returnedResult.newHook || returnedResult.originalHook || orig.text.substring(0, 50),
            explanation: returnedResult.explanation || ""
          };
        } else {
          // Fallback if missing
          return {
            id: orig.id,
            originalText: orig.text,
            optimizedText: orig.text,
            isDuplicate: false,
            originalHook: orig.text.substring(0, 50),
            newHook: orig.text.substring(0, 50)
          };
        }
      });

      // Compute duplicate occurrences exactly
      const duplicatesCount = mappedResults.filter(r => r.isDuplicate).length;
      const findingsSummary = `Đã quét xong - Phát hiện ${duplicatesCount} Kịch bản bị trùng lặp Hook đầu, đã tiến hành viết lại sáng tạo thành công!`;

      setScanResult({
        duplicateCount: duplicatesCount,
        findingsMsg: findingsSummary,
        scripts: mappedResults
      });

      setScanningStatus("done");
      setActiveLayoutTab("result");
    } catch (err: any) {
      console.error(err);
      setScanErrorMsg(err.message || "Gặp sự cố khi tương tác phân tách AI.");
      setScanningStatus("error");
    }
  };

  // ----------------------------------------------------
  // Copy Helpers
  // ----------------------------------------------------
  
  // Copy a single script content
  const handleCopySingleScriptContent = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy sequence header formatted as "Tên_Dự_Án_STT"
  const handleCopySerialHeader = (index: number) => {
    // Tên dự án: Dường như cần bọc kí tự trống bằng dấu gạch dưới
    const encodedProjectName = projectName.trim().replace(/\s+/g, "_");
    
    // Đảm bảo số thứ tự dưới 10 có tiền tố 0
    const serialText = (index + 1) < 10 ? `0${index + 1}` : `${index + 1}`;
    
    const formattedCode = `${encodedProjectName}_${serialText}`;
    
    navigator.clipboard.writeText(formattedCode);
    setCopiedSttId(formattedCode);
    setTimeout(() => setCopiedSttId(null), 2000);
  };

  // Copy all scripts concatenated
  const handleCopyAllCompleteScripts = () => {
    if (!scanResult || !scanResult.scripts) return;
    
    // Concatenate all script contents with neat separators
    const fullCopiedText = scanResult.scripts
      .map((item, idx) => `=== Kịch bản #${idx + 1} ===\n${item.optimizedText}\n`)
      .join("\n");

    navigator.clipboard.writeText(fullCopiedText);
    setCopiedAllFeedback(true);
    setTimeout(() => setCopiedAllFeedback(false), 2000);
  };

  // ----------------------------------------------------
  // Pagination & Filtering Slices
  // ----------------------------------------------------
  const getPaginatedScripts = () => {
    if (!scanResult || !scanResult.scripts) return [];
    
    if (pageSize === "All") {
      return scanResult.scripts;
    }

    const startIdx = (currentPage - 1) * pageSize;
    return scanResult.scripts.slice(startIdx, startIdx + pageSize);
  };

  const getTotalPages = () => {
    if (!scanResult || !scanResult.scripts || pageSize === "All") return 1;
    return Math.ceil(scanResult.scripts.length / pageSize);
  };

  const handleNextPage = () => {
    const total = getTotalPages();
    if (currentPage < total) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <div className={`space-y-6 w-full text-slate-100 transition-all duration-300 ${isFullScreen ? "fixed inset-0 bg-[#07070a] p-8 overflow-y-auto z-45" : ""}`}>
      
      {/* HEADER SECTION FOR APPLET #4 */}
      <div className="bg-[#121216] border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 blur-3xl rounded-full"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-600/15 border border-amber-500/20 text-amber-400 rounded-2xl">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-black">CHUYÊN BIỆT</span>
                <h2 className="text-xl font-bold text-white tracking-tight">Dò Quét Trùng Lặp & Từ Cấm TikTok</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tự động đối chiếu trích xuất Hook mở đầu (1-3 câu đầu), rà quét tương đồng &gt;60% nhóm nội dung chéo và sửa kịch bản.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Project mới button - completely resets current state to start fresh */}
            <button
              onClick={handleCreateNewProject}
              className="px-4 py-2 cursor-pointer bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-amber-500/20 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              title="Khởi tạo dự án kịch bản quét mới"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Project mới</span>
            </button>
            
            <button
              onClick={() => setShowHistoryPane(!showHistoryPane)}
              className={`px-4 py-2 cursor-pointer border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                showHistoryPane 
                  ? "bg-amber-600/15 border-amber-500/30 text-amber-300"
                  : "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-400"
              }`}
            >
              <History className="w-4 h-4" />
              <span>Sổ tay dự án ({projects.length})</span>
            </button>
            
            {/* FULL SCREEN TOGGLE (3.4) */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 cursor-pointer bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-white rounded-xl text-slate-400 transition"
              title={isFullScreen ? "Thu nhỏ giao diện" : "Chuẩn hóa toàn màn hình"}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4 text-emerald-400" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </div>

      {/* INDEPENDENT PROJECT HISTORY SHEET */}
      {showHistoryPane && (
        <div className="bg-[#121216] border border-slate-800 rounded-3xl p-5 shadow-2xl animate-fade-in space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <History className="w-4 h-4" /> Danh sách dự án quét trùng lặp lưu trữ
            </span>
            <button 
              onClick={() => setShowHistoryPane(false)} 
              className="text-slate-500 hover:text-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {projects.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Không phát hiện dữ liệu ghi nhớ.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {projects.map(p => (
                <div
                  key={p.id}
                  onClick={() => loadProjectIntoState(p)}
                  className={`p-3 bg-slate-900/60 hover:bg-slate-900 border cursor-pointer rounded-2xl transition flex items-center justify-between text-left ${
                    activeProjectId === p.id 
                      ? "border-amber-500/60 bg-amber-950/10" 
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-bold text-white truncate">{p.name || "Chưa đặt tên"}</p>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 mt-1">
                      <span>{p.scripts?.length || 0} kịch bản</span>
                      <span>•</span>
                      <span>{p.scanResult ? "Đã Quét" : "Nháp"}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteProject(p.id, e)}
                    className="text-slate-600 hover:text-red-400 rounded p-1 hover:bg-slate-800 transition"
                    title="Xóa dự án lưu"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CORE WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: SCAN-CONTROLS & PROJECT CONFIG */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* PROJECT IDENTITY SETTING (Tên dự án) */}
          <div className="bg-[#121216] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-amber-400" />
                Dự án hiện hành
              </span>
              <span className="text-[9px] font-mono text-slate-650 bg-slate-950 px-2 py-0.5 border border-slate-850 rounded">
                ID: {activeProjectId?.substring(0, 8)}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 block font-semibold uppercase">Tên Dự Án (Quyết định cú pháp copy code):</label>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 focus-within:border-amber-500/50 rounded-xl px-3 py-1 transition">
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => handleRenameProject(e.target.value)}
                  placeholder="Vd: Masati N068, Giày_Z79,..."
                  className="w-full bg-transparent text-xs text-white placeholder-slate-650 focus:outline-none py-1.5 font-bold"
                />
              </div>
              <span className="text-[9.5px] text-slate-550 leading-relaxed block">
                * Tên dự án sẽ dùng tự động tạo cú pháp copy STT: <strong className="text-slate-350">{projectName.trim().replace(/\s+/g, "_")}_08</strong>.
              </span>
            </div>
          </div>

          {/* INPUT PORTAL SELECTORS PANEL */}
          <div className="bg-[#121216] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div>
              <span className="text-xs font-bold uppercase text-slate-300 tracking-wider">
                1. NẠP TÀI LIỆU KỊCH BẢN
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Nạp hoặc tải kịch bản lỗi lên để hệ thống tự bóc tách đối chiếu.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* UPLOAD FILE BUTTON */}
              <button
                onClick={() => setShowFileUploadModal(true)}
                className="p-4 bg-slate-900 hover:bg-amber-600/10 border border-slate-850 hover:border-amber-500/40 rounded-2xl transition flex flex-col items-center gap-2 cursor-pointer text-center group"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-200">Tải File</span>
                <span className="text-[9px] text-slate-500 font-sans leading-none">TXT, Word, PDF...</span>
              </button>

              {/* DIRECT INPUT / PASTE BUTTON */}
              <button
                onClick={() => {
                  setDirectInputText("");
                  setShowDirectInputModal(true);
                }}
                className="p-4 bg-slate-900 hover:bg-yellow-600/10 border border-slate-850 hover:border-yellow-500/40 rounded-2xl transition flex flex-col items-center gap-2 cursor-pointer text-center group"
              >
                <div className="w-9 h-9 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center group-hover:scale-105 transition">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-200">Nhập trực tiếp</span>
                <span className="text-[9px] text-slate-500 font-sans leading-none">Dán hàng loạt siêu tiện</span>
              </button>
            </div>
          </div>

          {/* LAUNCH ENGINE TRIGGER PANEL */}
          <div className="bg-[#121216] border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">2. ĐIỀU KHIỂN QUÉT TRÙNG</span>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-mono px-2 py-0.5 rounded-full font-bold">
                {scriptsList.length} kịch bản nạp
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-normal font-sans">
              Hệ thống sẽ bóc tách và đối chiếu 1-3 câu đầu (Hook) của tất cả kịch bản vừa nạp. 
              Mức trùng khớp từ 60% trở lên sẽ được viết lại ngay lập tức và giữ nguyên kịch bản gốc đầu tiên.
            </p>

            <button
              onClick={handleStartDuplicationScan}
              disabled={scanningStatus === "running" || scriptsList.length === 0}
              className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 disabled:from-amber-950 disabled:to-yellow-950 disabled:text-slate-550 text-white font-extrabold text-xs py-3.5 px-6 rounded-2xl shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {scanningStatus === "running" ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-white" />
                  <span>ĐANG ĐỐI CHIẾU SỐ LIỆU...</span>
                </>
              ) : (
                <>
                  <Sliders className="w-4 h-4 text-white" />
                  <span>BẮT ĐẦU QUÉT TRÙNG LẶP</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* RIGHT PANEL: MAIN SCRIPT VIEWS & INTERACTIVE OUTCOMES */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* TAB BAR FOR SWITCHING BETWEEN INPUT SCENARIOS & SCAN RESULTS */}
          <div className="flex bg-slate-900/60 p-1.5 border border-slate-805 rounded-2xl gap-1">
            <button
              onClick={() => setActiveLayoutTab("edit")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeLayoutTab === "edit"
                  ? "bg-slate-800 text-white shadow-lg border border-slate-700/60"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Nội dung kịch bản gốc ({scriptsList.length})</span>
            </button>
            <button
              onClick={() => {
                if (!scanResult) {
                  alert("Vui lòng kích hoạt Bắt đầu quét trùng để xem kết quả hoàn chỉnh.");
                  return;
                }
                setActiveLayoutTab("result");
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeLayoutTab === "result"
                  ? "bg-amber-600/15 text-amber-300 border border-amber-500/25 shadow-lg"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kết quả hoàn chỉnh {scanResult ? `(${scanResult.scripts.length})` : ""}</span>
            </button>
          </div>

          {/* ACTIVE STATUS & PROGRESS BAR DISPLAY (Bổ sung 3) */}
          {scanningStatus === "running" && (
            <div className="bg-[#121216] border border-amber-500/20 rounded-3xl p-6 shadow-xl space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  {scanProgressMsg}
                </span>
                <span className="text-xs text-slate-400 font-mono font-bold">{scanProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {scanningStatus === "done" && scanResult && (
            <div className="bg-[#121216]/90 border border-emerald-500/25 rounded-3xl p-4 shadow-xl flex items-center justify-between text-left animate-fade-in gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Tiến trình quét hoàn tất</h4>
                  <p className="text-[11px] text-emerald-400 font-sans mt-0.5 font-bold">
                    {scanResult.findingsMsg}
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono italic shrink-0 whitespace-nowrap">Hồ Quang Hiển CRO v1</span>
            </div>
          )}

          {scanningStatus === "error" && scanErrorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-5 flex items-start gap-3 shadow-xl">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-red-405 uppercase block">Gặp sự cố lỗi quét kịch bản</span>
                <p className="text-[11px] text-slate-350 font-mono">{scanErrorMsg}</p>
              </div>
            </div>
          )}

          {/* VIEW TAB A: SCRIPT EDITOR LIST */}
          {activeLayoutTab === "edit" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Danh Sách Kịch Bản Gốc</h3>
                  <p className="text-[10px] text-slate-550">Tách biệt từng ô kịch bản độc lập phía dưới để dễ chỉnh lý chi tiết.</p>
                </div>
                <button
                  onClick={handleAddSingleEmptyScript}
                  className="px-3 py-1.5 cursor-pointer bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[11px] font-bold text-amber-400 hover:text-amber-300 transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Kịch bản lẻ</span>
                </button>
              </div>

              {scriptsList.length === 0 ? (
                <div className="bg-[#121216]/40 border border-dashed border-slate-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <FileCode className="w-12 h-12 text-slate-600 mb-3 opacity-50" />
                  <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                    Chưa nạp kịch bản nào. Hãy tải tệp kịch bản quảng cáo cũ lên hoặc click "Nhập trực tiếp" để dán hàng loạt.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setShowDirectInputModal(true)}
                      className="px-4 py-2 cursor-pointer bg-slate-900 border border-slate-820 hover:border-amber-500/30 text-xs font-bold rounded-xl text-slate-300"
                    >
                      Dán ngay kịch bản thô
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {scriptsList.map((script, index) => (
                    <div key={script.id} className="bg-[#121216] border border-slate-850 rounded-2xl p-4 space-y-2 relative group hover:border-slate-800 transition">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
                        <span className="text-[10px] font-bold font-mono tracking-widest text-slate-500 uppercase">
                          KỊCH BẢN #{index + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteScriptFromList(script.id)}
                            className="p-1 px-1.5 bg-slate-950 text-slate-650 hover:text-red-400 border border-slate-850 rounded-lg hover:border-red-500/20 text-[10px] font-semibold transition"
                            title="Xóa kịch bản này"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={script.text}
                        onChange={(e) => handleUpdateScriptText(script.id, e.target.value)}
                        rows={3}
                        placeholder={`Mẫu lời thoại kịch bản dẫn thứ ${index + 1}...`}
                        className="w-full bg-slate-950 border border-slate-900 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none transition leading-relaxed font-mono"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW TAB B: SCANNED COMPREHENSIVE OUTCOMES (Bổ sung 1) */}
          {activeLayoutTab === "result" && scanResult && (
            <div className="space-y-5 animate-fade-in">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900/60 p-4 border border-slate-850 rounded-3xl gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Kết Quả Đầy Đủ</span>
                  <p className="text-[11px] text-slate-450 leading-tight">
                    Tổng số {scanResult.scripts.length} bài đã dệt đối chiếu. Kích vào các dòng tiêu đề hoặc nội dung ô để kích hoạt sao chép tự động tức thì.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopyAllCompleteScripts}
                    className="px-4 py-2 cursor-pointer bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-extrabold text-[11px] tracking-wide rounded-xl shadow-lg transition flex items-center gap-1.5 uppercase"
                  >
                    {copiedAllFeedback ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Đã chép sạch!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy All kịch bản</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* PAGINATION PANEL AT THE TOP (3.5) */}
              <div className="bg-[#121216] border border-slate-850 p-3 rounded-2xl flex items-center justify-between gap-4 select-none">
                {/* Trang trước left-aligned */}
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-black rounded-lg transition-all flex items-center gap-1 text-slate-300 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Trang trước</span>
                </button>

                {/* Page sizes selector in the center */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Hiển thị:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPageSize(val === "All" ? "All" : parseInt(val));
                      setCurrentPage(1); // reset page
                    }}
                    className="bg-slate-950 border border-slate-800 text-[11px] font-bold text-amber-400 px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500/60"
                  >
                    <option value="2">2 kịch bản / trang</option>
                    <option value="3">3 kịch bản / trang</option>
                    <option value="4">4 kịch bản / trang</option>
                    <option value="5">5 kịch bản / trang</option>
                    <option value="10">10 kịch bản / trang</option>
                    <option value="20">20 kịch bản / trang</option>
                    <option value="All">Tất Cả</option>
                  </select>
                  
                  {pageSize !== "All" && (
                    <span className="text-[11px] text-slate-400 font-mono font-bold ml-1">
                      Trang {currentPage} / {getTotalPages()}
                    </span>
                  )}
                </div>

                {/* Trang sau right-aligned */}
                <button
                  onClick={handleNextPage}
                  disabled={pageSize === "All" || currentPage === getTotalPages()}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-black rounded-lg transition-all flex items-center gap-1 text-slate-300 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Trang sau</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* RENDERED CARDS IN LIST */}
              <div className="space-y-4">
                {getPaginatedScripts().map((item, index) => {
                  // Find relative total index
                  const actualIdx = pageSize === "All" ? index : ((currentPage - 1) * pageSize) + index;
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`border rounded-3xl p-5 shadow-md relative transition duration-150 ${
                        item.isDuplicate 
                          // Optimized duplicated scripts mapped color standouts (Bổ sung 1)
                          ? "bg-gradient-to-br from-amber-600/10 to-[#14120a] border-amber-500/35" 
                          : "bg-slate-950/60 border-slate-850"
                      }`}
                    >
                      {/* HEADER ELEMENT OF CONTAINER - CLICK TO COPY STT AS "Tên_Dự_Án_STT" (3.3) */}
                      <div 
                        onClick={() => handleCopySerialHeader(actualIdx)}
                        className="flex justify-between items-center pb-2.5 border-b border-slate-800/60 mb-3 cursor-pointer group/header select-none"
                        title="Click để copy mã định danh serial: TênDựÁn_SốThứTự"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`text-[11px] font-black uppercase tracking-wider flex items-center transition ${
                            item.isDuplicate ? "text-amber-400 hover:text-amber-300" : "text-slate-400 hover:text-slate-200"
                          }`}>
                            <span>#{actualIdx + 1} — </span>
                            <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] bg-slate-900 border border-slate-800 font-bold">
                              {item.isDuplicate ? "ĐÃ TỐI ƯU HOÀN CHỈNH" : "GIỮ NGUYÊN BẢN GỐC"}
                            </span>
                          </div>
                          
                          {/* Copy indicator */}
                          <div className="opacity-0 group-hover/header:opacity-100 transition duration-150 text-[10px] text-amber-500 flex items-center gap-1">
                            <Clipboard className="w-3 h-3" />
                            <span>Sao chép mã {projectName.trim().replace(/\s+/g, "_")}_0{actualIdx + 1}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[9px] text-slate-550 font-mono">
                          {copiedSttId === `${projectName.trim().replace(/\s+/g, "_")}_${(actualIdx + 1) < 10 ? `0${actualIdx + 1}` : actualIdx + 1}` ? (
                            <span className="text-emerald-400 font-bold">Đã chép mã!</span>
                          ) : (
                            <span>Kích để sao mã STT</span>
                          )}
                        </div>
                      </div>

                      {/* DETAILED ORIGINAL AND COMPARED INFO BOX */}
                      {item.isDuplicate && item.explanation && (
                        <div className="mb-3.5 p-3 bg-amber-950/20 border border-amber-500/10 rounded-xl text-[10.5px] text-slate-400 leading-normal flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-amber-300 block">Lý do điều chỉnh (Hook trùng lặp &gt;60%):</span>
                            <p className="mt-0.5">{item.explanation}</p>
                          </div>
                        </div>
                      )}

                      {/* MAIN CONTENT AREA - FIXED HEIGHT (200px) & CLICK TO COPY BODY (3.1 & 3.2) */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center bg-slate-950/40 px-2 py-1.5 rounded-lg border border-slate-900/60">
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            {item.isDuplicate ? "Kịch bản mẫu mới tối ưu (sao chép trực tiếp)" : "Kịch bản nguyên gốc an toàn"}
                          </span>
                          
                          <div className="text-[10.5px] text-slate-500">
                            {copiedId === item.id ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" /> Đã chép kịch bản!
                              </span>
                            ) : (
                              <span className="text-[9.5px] font-mono tracking-wide">Nhấn vào ô để Copy nhanh</span>
                            )}
                          </div>
                        </div>

                        {/* Interactive Click-To-Copy scrollable textbox (3.1 & 3.2) */}
                        <div 
                          onClick={() => handleCopySingleScriptContent(item.optimizedText, item.id)}
                          className="w-full h-[200px] overflow-y-auto bg-slate-950 border border-slate-900 focus:border-amber-500/40 rounded-2xl p-4 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed cursor-pointer hover:bg-slate-900/40 transition active:scale-[0.99] select-text relative group/body"
                          title="Click vào bất kỳ chỗ nào trong ô để Copy toàn bộ kịch bản hoàn chỉnh"
                        >
                          {/* Inner float icon */}
                          <div className="absolute right-4.5 bottom-4.5 p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 opacity-0 group-hover/body:opacity-100 hover:text-white transition cursor-pointer">
                            <Copy className="w-3.5 h-3.5" />
                          </div>

                          {item.optimizedText}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* BOTTOM CONTROL PAGE BACKUP */}
              {pageSize !== "All" && getTotalPages() > 1 && (
                <div className="flex justify-center items-center gap-3 pt-3">
                  <button 
                    onClick={handlePrevPage} 
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-705 flex items-center justify-center disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-slate-400">
                    Trang {currentPage} của {getTotalPages()}
                  </span>
                  <button 
                    onClick={handleNextPage} 
                    disabled={currentPage === getTotalPages()}
                    className="w-8 h-8 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-705 flex items-center justify-center disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* ==================== POPUP 1: FILE UPLOAD MODAL ==================== */}
      <AnimatePresence>
        {showFileUploadModal && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setShowFileUploadModal(false)}
                className="absolute top-4 right-4 text-slate-550 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-1">
                <span className="p-3 bg-amber-500/10 border border-indigo-500/10 text-amber-500 rounded-2xl inline-block mb-2">
                  <FileSpreadsheet className="w-6 h-6" />
                </span>
                <h3 className="text-base font-extrabold text-white">Tải kịch bản gốc lên</h3>
                <p className="text-[11px] text-slate-450">
                  Phân tích nội dung và tách dòng tự động (gồm cả Word, Excel, Txt, PDF...)
                </p>
              </div>

              <div
                onDragOver={handleDragOverFile}
                onDragLeave={handleDragLeaveFile}
                onDrop={handleDropFile}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition py-12 ${
                  isDraggingFile 
                    ? "border-amber-500 bg-amber-500/5 text-amber-300"
                    : "border-slate-800 hover:border-amber-500/40 bg-slate-900/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.docx,.pdf,.doc,.csv,.xlsx,.xls"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleParseLocalFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <Upload className="w-10 h-10 text-amber-400 mb-2.5 animate-bounce" />
                <span className="text-xs text-slate-300 font-extrabold mb-1">Thả tài liệu của bạn vào đây</span>
                <span className="text-[10px] text-slate-500 max-w-xs leading-normal">
                  Chèn tệp tin Word, PDF, Excel hoặc tệp văn bản thô. Trợ lý AI sẽ tự động giải mã cấu trúc dòng an toàn.
                </span>
              </div>

              {isParsingDoc && (
                <div className="p-3 bg-amber-950/15 border border-amber-500/10 rounded-xl text-center space-y-2 animate-pulse">
                  <RotateCw className="w-4 h-4 animate-spin text-amber-400 mx-auto" />
                  <p className="text-[10px] text-amber-300 font-mono tracking-wide">{docParseMsg}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowFileUploadModal(false)}
                  className="flex-1 cursor-pointer py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-bold text-slate-400"
                >
                  Đóng/Hủy
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== POPUP 2: DIRECT INPUT MODAL ==================== */}
      <AnimatePresence>
        {showDirectInputModal && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setShowDirectInputModal(false)}
                className="absolute top-4 right-4 text-slate-550 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-1">
                <h3 className="text-base font-extrabold text-white">Nhập kịch bản trực tiếp</h3>
                <p className="text-[11px] text-slate-450 leading-relaxed max-w-md mx-auto">
                  Dán hoặc soạn thảo văn bản kịch bản gốc của bạn vào khung bên dưới.
                </p>
              </div>

              {/* TOGGLING AUTOSPLIT ACCORDING TO LINE FEED "Cứ xuống hàng là kết thúc 1 kịch bản" */}
              <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">Nhận biết xuống hàng:</span>
                  <p className="text-[9.5px] text-slate-450 leading-none">Mỗi dòng văn bản tự động chia vào 1 ô kịch bản độc lập.</p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={shouldSplitByLines}
                    onChange={(e) => setShouldSplitByLines(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-350 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <textarea
                value={directInputText}
                onChange={(e) => setDirectInputText(e.target.value)}
                rows={11}
                placeholder={
                  shouldSplitByLines 
                    ? "Nhập hoặc dán danh sách của bạn tại đây.\nDòng 1: Kịch bản số 1 của sản phẩm...\nDòng 2: Kịch bản số 2 của sản phẩm...\nDòng 3: Kịch bản số 3 của sản phẩm..."
                    : "Nhập hoặc dán toàn bộ văn bản kịch bản (không tách dòng)..."
                }
                className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-650 focus:outline-none transition leading-relaxed font-mono"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowDirectInputModal(false)}
                  className="flex-1 cursor-pointer py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleDirectInputSubmit}
                  className="flex-1 cursor-pointer py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-extrabold text-xs rounded-xl transition shadow-lg"
                >
                  Xác nhận đưa vào khung
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER attribution */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-700 py-4 border-t border-slate-900 font-mono">
        <span>BẢN QUYỀN THIẾT KẾ</span>
        <Heart className="w-3 h-3 text-pink-700 fill-pink-700" />
        <span>BY HỒ QUANG HIỂN</span>
      </div>

    </div>
  );
}
