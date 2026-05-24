import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import https from "https";

dotenv.config();

// Initialize the Google Gen AI client with User-Agent for safe tracking
const geminiApiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const app = express();
app.use(express.json({ limit: "15mb" }));

// Helper to resolve the appropriate GoogleGenAI client (either global default or custom header overlay)
function getAIClient(req: express.Request): GoogleGenAI {
  const headerKey = req.headers["x-gemini-key"];
  if (headerKey && typeof headerKey === "string" && headerKey.trim()) {
    return new GoogleGenAI({
      apiKey: headerKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-custom',
        }
      }
    });
  }
  return ai;
}

// Helper to secure Gemini key checking
function checkGeminiApiKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  const headerKey = req.headers["x-gemini-key"];
  const hasCustomKey = headerKey && typeof headerKey === "string" && headerKey.trim();
  if (!geminiApiKey && !hasCustomKey) {
    return res.status(500).json({
      error: "Thiếu thiết lập key AI (GEMINI_API_KEY) trong hệ thống và chưa nhập API Key tùy chỉnh. Vui lòng thiết lập key trong Settings > Secrets từ hệ thống hoặc nhập API Key Gemini tùy chọn tại Trình quản lý trên giao diện."
    });
  }
  next();
}

let verificationCache: string[] = [];
let cacheStamp = 0;
const FRESH_THRESHOLD = 5 * 60 * 1000;

function requestDataSecurely(targetUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(targetUrl, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return requestDataSecurely(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Code: ${res.statusCode}`));
      }
      let buffer = "";
      res.on("data", (chunk) => { buffer += chunk; });
      res.on("end", () => { resolve(buffer); });
    }).on("error", (err) => { reject(err); });
  });
}

async function loadCredentials(): Promise<string[]> {
  const current = Date.now();
  if (verificationCache.length > 0 && (current - cacheStamp < FRESH_THRESHOLD)) {
    return verificationCache;
  }
  try {
    const value = "aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vdWM/ZXhwb3J0PWRvd25sb2FkJmlkPTFLYnk0V1JieVh2SDdEU2VpU0xhempqRkMwZi10QlltSw==";
    const resolvedUrl = Buffer.from(value, "base64").toString("utf-8");
    const rawContent = await requestDataSecurely(resolvedUrl);
    const parsed = rawContent.split("\n").map(token => token.trim()).filter(token => token.length > 0);
    if (parsed.length > 0) {
      verificationCache = parsed;
      cacheStamp = current;
    }
    return verificationCache;
  } catch (error) {
    return verificationCache;
  }
}

app.post("/api/verify-license", async (req, res) => {
  try {
    const { key } = req.body;
    if (!key || typeof key !== "string") {
      return res.status(400).json({ valid: false, error: "Vui lòng nhập License Key." });
    }
    const checkValue = key.trim();
    const activeTokens = await loadCredentials();
    const isMatched = activeTokens.includes(checkValue);
    if (isMatched) {
      return res.json({ valid: true });
    } else {
      return res.json({ 
        valid: false, 
        error: "Hãy liên hệ với Zalo: 0979.460.605 để được hỗ trợ." 
      });
    }
  } catch (err) {
    return res.status(500).json({ valid: false, error: "Hãy liên hệ với Zalo: 0979.460.605 để được hỗ trợ." });
  }
});

// ----------------------------------------------------
// API 1: Tạo Thương Hiệu Kênh Mới - Đặt Tên Kênh (Brand Builder Step 1)
// ----------------------------------------------------
app.post("/api/brand-names", checkGeminiApiKey, async (req, res) => {
  try {
    const { niche, factors, style } = req.body;
    
    // Format factors string for prompt
    let factorsPrompt = "";
    if (factors) {
      if (factors.personalName) factorsPrompt += `- Tên riêng kết hợp: ${factors.personalName}\n`;
      if (factors.company) factorsPrompt += `- Tên doanh nghiệp/tổ chức: ${factors.company}\n`;
      if (factors.location) factorsPrompt += `- Địa lý, địa danh: ${factors.location}\n`;
      if (factors.expertise) factorsPrompt += `- Chuyên môn dữ liệu: ${factors.expertise}\n`;
      if (factors.custom) factorsPrompt += `- Yếu tố tự chọn bổ sung: ${factors.custom}\n`;
    }

    const systemInstruction = `Bạn là chuyên gia cố vấn và đặt tên thương hiệu (Naming Expert & Brand Lead) nổi tiếng toàn cầu cho các kênh TikTok, YouTube, Instagram và Facebook.
Nhiệm vụ của bạn là đọc hiểu thông tin chủ đề ngách và các yếu tố kết hợp mong muốn của người dùng để sáng tạo ra ĐÚNG 20 ý tưởng tên kênh độc đáo, ý nghĩa, bắt tai, dễ nhớ và cực kỳ viral.

Các tên đề xuất cần phản ánh đa dạng phong cách khác nhau:
1. "Chuyên nghiệp & Uy tín" (Professional)
2. "Hài hước & Gần gũi" (Humorous/Friendly)
3. "Hiện đại & Bắt trend" (Modern/Trendy)
4. "Gắn kết thương hiệu cá nhân" (Personal Branding)

Hãy phản hồi thuần túy bằng tiếng Việt ở định dạng JSON phù hợp hoàn toàn với cấu trúc sau (không bao gồm bất kỳ ký tự hay lời thoại nào ngoài JSON):
{
  "names": [
    {
      "name": "Tên kênh đề xuất",
      "style": "Chuyên nghiệp | Hài hước | Hiện đại | Cá nhân",
      "reason": "Giải thích ngắn gọn ý nghĩa và vì sao khán giả sẽ thích tên này"
    }
  ]
}

Hãy đảm bảo danh sách trả về chứa đủ 20 tên kênh độc nhất khác nhau. Không viết markdown \`\`\`json ở bất kỳ đâu.`;

    const prompt = `Yêu cầu tạo 20 ý tưởng tên kênh thương hiệu:
- Lĩnh vực/Ngách nội dung chủ chốt: ${niche}
- Phong cách mong muốn: ${style || "Đa dạng sáng tạo"}
- Các yếu tố kết hợp đầu vào:
${factorsPrompt || "- Không có yếu tố cụ thể, hãy tự do gợi ý thông minh dựa trên hành vi mạng xã hội."}

Hãy vận dụng các kỹ thuật cấu trúc ngôn từ (Wordplay, Alliteration, Rhyming, Metaphor, Localized slang...) để tạo ra bản đặt tên kênh cuốn hút nhất!`;

    const response = await getAIClient(req).models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.9
      }
    });

    const textOutput = response.text || "{}";
    const data = JSON.parse(textOutput.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("Brand Names API error:", error);
    return res.status(500).json({ error: error?.message || "Lỗi xử lý đặt tên thương hiệu từ AI." });
  }
});

// ----------------------------------------------------
// API 1.2: Tạo Thiết Kế Logo SVG & Nội dung Đa Nền Tảng (Brand Builder Step 2)
// ----------------------------------------------------
app.post("/api/brand-details", checkGeminiApiKey, async (req, res) => {
  try {
    const { niche, factors, selectedName, style } = req.body;

    const systemInstruction = `Bạn là Giám đốc Sáng tạo Nghệ thuật và Chuyên gia Truyền thông Đa phương tiện.
Nhiệm vụ của bạn là dựa vào Tên kênh đã chọn: "${selectedName}" và lĩnh vực hoạt động "${niche}" để:
1. Thiết kế 4 LOGO vector SVG tuyệt đẹp, sáng tạo, cực kỳ hiện đại và chuyên nghiệp.
2. Viết tài liệu mô tả thông tin hồ sơ (Bios, Slogan, tags) chi tiết cho 3 nền tảng MXH hàng đầu (TikTok, YouTube, Facebook & Instagram).

Yêu cầu kỹ thuật NGHIÊM NGẶT đối với Logo SVG:
- Mỗi thiết kế logo là một khối SVG có mã nguồn XML hoàn chỉnh hợp lệ, bắt đầu bằng <svg và kết thúc bằng </svg>.
- Phải vẽ bằng các thẻ vector của SVG như <rect>, <circle>, <path>, <polygon>, <g>, và <text>. Sử dụng các gradient đẹp mắt thông qua <defs> và <linearGradient> để tạo cảm giác 3D, neon sang trọng hoặc tối giản hiện đại.
- KHÔNG dùng liên kết ảnh bên ngoài. Toàn bộ icon hoặc biểu tượng hình ảnh phải được tác họa bằng vector <path> mịn, bo góc, nghệ thuật, phản ánh đúng tính chất kênh thương hiệu.
- Đặt thuộc tính viewBox="0 0 400 400" trên thẻ <svg> và bảo đảm nội dung hiển thị ở trung tâm sắc nét.
- Thẻ <text> trong SVG phải ghi tên kênh rút ngắn hoặc ghi tắt chữ cái đầu thật cách điệu, sang trọng cùng phông chữ an toàn (sans-serif, system-ui, Montserrat...).
- Đảm bảo mã SVG không có lỗi ký tự đặc biệt, lỗi đóng mở thẻ hay có chứa dấu xuống dòng bất hợp pháp bên trong thẻ SVG gây lỗi cú pháp JSON.

Yêu cầu cho Bộ hồ sơ thương hiệu (BIOS & PROFILE):
- TikTok: Tên kênh, Bio ngắn gọn súc tích (bắt trend, khơi gợi hành động).
- YouTube: Tên kênh, Mô tả kênh chi tiết và truyền cảm hứng (dài chuẩn từ 500 đến 800 từ, định dạng xuống dòng chuyên nghiệp, chia các mục như Giới thiệu, Lịch phát sóng, Sứ mệnh rõ ràng, Chào mừng), bộ từ khóa SEO thương hiệu & 10 hashtag hàng đầu.
- Facebook & Instagram: Tên Fanpage, Bio ngắn gọn độc đáo, 10 hashtag hàng đầu.

Hãy phản hồi thuần túy dạng JSON phù hợp hoàn toàn với cấu trúc sau (không viết markdown \`\`\`json):
{
  "logos": [
    {
      "id": "logo-1",
      "title": "Tên ý tưởng logo (Ví dụ: Neon Core Icon)",
      "style": "Phong cách hình học tối giản",
      "svgCode": "<svg ...>...</svg>",
      "concept": "Mô tả triết lý thiết kế và câu chuyên biểu tượng ý nghĩa bằng tiếng Việt"
    }
  ],
  "tiktok": {
    "name": "${selectedName}",
    "bio": "Bio viết mẫu"
  },
  "youtube": {
    "name": "${selectedName}",
    "description": "Mô tả kênh dài tuyệt đẹp từ 500-800 từ...",
    "keywords": ["từ khoá 1", "từ khoá 2"],
    "hashtags": ["#ht1", "#ht2"]
  },
  "facebook_instagram": {
    "name": "${selectedName}",
    "bio": "Mô tả tiểu sử mẫu",
    "hashtags": ["#ht1", "#ht2"]
  }
}

Chú ý: Trả về chính xác 4 logo khác nhau trong mảng "logos" (id lần lượt là logo-1, logo-2, logo-3, logo-4).`;

    const prompt = `Hãy thực hiện quy hoạch nhận diện thương hiệu cho:
- Tên thương hiệu đã chọn: ${selectedName}
- Khách hàng hoạt động ngách: ${niche}
- Phong cách chỉ huy thiết kế chính: ${style || "Hiện đại tối giản, tinh tế, bắt mắt"}`;

    const response = await getAIClient(req).models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.85
      }
    });

    const textOutput = response.text || "{}";
    const data = JSON.parse(textOutput.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("Brand Details API error:", error);
    return res.status(500).json({ error: error?.message || "Lỗi xử lý tạo thiết kế thương hiệu chi tiết từ AI." });
  }
});

// ----------------------------------------------------
// API 1.3: Tạo Lại 1 Logo cụ thể (Re-generate single logo)
// ----------------------------------------------------
app.post("/api/brand-logo-single", checkGeminiApiKey, async (req, res) => {
  try {
    const { niche, selectedName, logoStyle, logoId } = req.body;

    const systemInstruction = `Bạn là Chuyên gia kỹ sư SVG Vector Art.
Nhiệm vụ của bạn là tái sáng tạo duy nhất MỘT thiết kế logo vector dạng SVG cho thương hiệu "${selectedName}" hoạt động trong ngách "${niche}".
Hãy thực hiện đúng yêu cầu kỹ thuật và trả về chuẩn JSON dưới đây:

{
  "id": "${logoId || "logo-1"}",
  "title": "Tên ý tưởng logo mới",
  "style": "${logoStyle || "Hiện đại tối giản"}",
  "svgCode": "<svg ...>...</svg>",
  "concept": "Triết lý hình tượng và ý nghĩa bằng tiếng Việt"
}

Yêu cầu kỹ thuật vẽ SVG:
- Output svgCode là thẻ <svg>...</svg> hoàn chỉnh với thuộc tính viewBox="0 0 400 400" vẽ vector chuẩn.
- Phối hợp màu sắc chuyển sắc (gradient) mượt mà, cấu trúc hình họa tinh xảo ở trung tâm.
- Sử dụng các thẻ an toàn path, circle, rect, text...
- Không có markdown hay mô tả phụ ngoài đối tượng JSON trên.`;

    const prompt = `Hãy thiết kế lại logo ${logoId} cho thương hiệu "${selectedName}" và ngách "${niche}". Phong cách mong muốn: ${logoStyle || "Hạ tầng neon độc bản"}.`;

    const response = await getAIClient(req).models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.9
      }
    });

    const textOutput = response.text || "{}";
    const data = JSON.parse(textOutput.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("Single Logo API error:", error);
    return res.status(500).json({ error: error?.message || "Lỗi tạo lại logo đơn từ AI." });
  }
});

// Helper to parse base64 data URLs safely
function parseBase64Image(dataUrl: string) {
  const matches = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return {
      mimeType: matches[1],
      data: matches[2]
    };
  }
  return {
    mimeType: "image/jpeg",
    data: dataUrl.replace(/^data:image\/\w+;base64,/, "")
  };
}

// ----------------------------------------------------
// API 2: Viết Kịch Bản Tiktok Affiliate (Script Writer)
// ----------------------------------------------------

// 2a. Quét & trích xuất thông tin sản phẩm từ hình ảnh
app.post("/api/script-writer/scan-product", checkGeminiApiKey, async (req, res) => {
  try {
    const { images, removeShopName, removeMediaPartner, removePrice } = req.body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "Vui lòng tải lên từ 1 đến 4 bức ảnh sản phẩm để hệ thống quét dữ liệu." });
    }

    const imageParts = images.map(img => {
      const parsed = parseBase64Image(img);
      return {
        inlineData: {
          mimeType: parsed.mimeType,
          data: parsed.data
        }
      };
    });

    const systemInstruction = `Bạn là Chuyên gia kỹ thuật phân tích và quét thông tin sản phẩm (Product Scanner AI) chuyên nghiệp.
Nhiệm vụ của bạn là quét các hình ảnh được cung cấp, nhận dạng chính xác tên sản phẩm, thương hiệu/nhà sản xuất chính và các điểm mạnh, thông số quan trọng của sản phẩm đó để chuẩn bị tư liệu viết kịch bản.

Hãy tuân thủ quy tắc sàng lọc thông tin cực kỳ nghiêm ngặt:
1. "removeShopName": ${removeShopName ? "BẬT" : "TẮT"}. ${removeShopName ? "Nếu BẬT: Hãy tuyệt đối LOẠI BỎ tên các shop, cửa hàng bán lẻ, trang thương mại phân phối của sản phẩm. Bạn CHỈ giữ lại tên nhà sản xuất gốc, hãng sản xuất hoặc nhãn hiệu gốc của sản phẩm." : "Nếu TẮT: Bạn có thể giữ thông tin nhà bán hàng nếu thấy hữu dụng."}
2. "removeMediaPartner": ${removeMediaPartner ? "BẬT" : "TẮT"}. ${removeMediaPartner ? "Nếu BẬT: Hãy tuyệt đối PHÁT HIỆN & LOẠI BỎ tất cả các đơn vị truyền thông, cá nhân, KOL, hoặc tổ chức quảng cáo kết hợp độc quyền khỏi tên thương hiệu và tên sản phẩm (Ví dụ: 'Versati x TANDONGHO' thì xóa 'TANDONGHO', chỉ giữ lại 'Versati'). Hãy lọc thật kỹ cả trong tên sản phẩm kẻo dính đơn vị truyền thông này." : "Nếu TẮT: Bạn có thể giữ thông tin đối tác truyền thông."}
3. "removePrice": ${removePrice ? "BẬT" : "TẮT"}. ${removePrice ? "Nếu BẬT: Hãy bỏ hoàn toàn mọi thông tin liên quan đến giá bán, số tiền, voucher mệnh giá cụ thể." : "Nếu TẮT: Bạn có thể giữ thông tin giá cả."}

Đồng thời, bạn hãy tham khảo kho dữ liệu hiểu biết khổng lồ của mình để chắt lọc thêm các tính năng, điểm nhấn quan trọng của sản phẩm thực tế đó rồi đưa ra danh sách điểm mạnh hữu ích nhất (từ 5 đến 8 gạch đầu dòng).

Hãy phản hồi thuần túy định dạng JSON theo cấu trúc sau (không viết markdown \`\`\`json):
{
  "productName": "Tên sản phẩm (Đã qua xử lý loại bỏ các yếu tố theo bộ lọc nếu bật)",
  "brand": "Tên nhãn hiệu/Nhà sản xuất chính (Đã qua xử lý)",
  "keyPoints": [
    "Điểm mạnh hoặc thông tin quan trọng thứ 1...",
    "Điểm mạnh hoặc thông tin quan trọng thứ 2...",
    "..."
  ]
}`;

    const prompt = `Hãy thực hiện quét 1-4 hình ảnh sản phẩm đính kèm và trích xuất dữ liệu thông tin chi tiết.`;

    const response = await getAIClient(req).models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [
          ...imageParts,
          { text: prompt }
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    const textOutput = response.text || "{}";
    const data = JSON.parse(textOutput.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("Scan Product API error:", error);
    return res.status(500).json({ error: error?.message || "Lỗi quét phân tích hình ảnh sản phẩm từ AI." });
  }
});

// 2b. Tạo hàng loạt kịch bản Affiliate dựa trên dữ liệu sản phẩm & tuân thủ cài đặt
app.post("/api/script-writer/generate-scripts", checkGeminiApiKey, async (req, res) => {
  try {
    const {
      scannedProduct,
      quantity,
      phoneticVietnamese,
      stripCTA,
      eachStrengthOneScript,
      speaker,
      listener,
      duration,
      context,
      ideas,
      warnings
    } = req.body;

    const count = parseInt(quantity, 10) || 10;
    const pName = scannedProduct?.productName || "Sản phẩm";
    const pBrand = scannedProduct?.brand || "Thương hiệu";
    const pKeys = scannedProduct?.keyPoints || [];

    const systemInstruction = `Bạn là Chuyên gia viết kịch bản video TikTok Affiliate (TikTok Affiliate Scriptwriting Director) sở hữu hàng triệu lượt xem và tỷ lệ chuyển đổi đơn hàng vượt trội. Đặc biệt tài năng trong việc nói chuyện truyền cảm, kích thích tâm lý khán giả Việt Nam mua hàng qua liên kết giỏ hàng.

Nhiệm vụ của bạn là viết đúng ${count} kịch bản khác nhau cho sản phẩm "${pName}" thuộc nhãn hiệu "${pBrand}".

Hãy tuân thủ chặt chẽ các chỉ thị cấu hình sau từ người dùng:
1. Phiên âm sang tiếng Việt: ${phoneticVietnamese ? "BẬT. Yêu cầu viết phiên âm thuần Việt toàn bộ từ tiếng Anh, từ viết tắt, thuật ngữ nước ngoài để đọc tự nhiên không vấp (Ví dụ: 'Oversized' -> 'ao-sơ-sai-dơ', 'Voucher' -> 'Gâu-chơ' hoặc 'Vao-chơ', 'TikTok Shop' -> 'Tíc-tóc-sóp', 'USB' -> 'u-ét-bê', 'skincare' -> 'skin-ke', 'Xiaomi' -> 'Sao-mi')." : "TẮT. Giữ nguyên từ tiếng Anh gốc."}
2. Cắt bỏ CTA: ${stripCTA ? "BẬT. Hãy loại bỏ hoàn toàn phần kêu gọi nhấp vào giỏ hàng hoặc mua hàng ở cuối kịch bản, chừa không gian trống để tập trung nói về sản phẩm." : "TẮT. Thêm lời kêu gọi hành động (CTA) cực đỉnh dứt khoát khích lệ người mua tại cuối kịch bản."}
3. Mỗi điểm mạnh = 1 Kịch bản: ${eachStrengthOneScript ? "BẬT. Cự tuyệt viết lan man nhiều tính năng. Hãy tập trung viết sao cho mỗi kịch bản chỉ bám sát và bóc tách chuyên sâu một điểm mạnh duy nhất trong danh sách sau: " + JSON.stringify(pKeys) : "TẮT. Hãy phối hợp tự do nhiều điểm mạnh trong mỗi kịch bản."}
4. Người nói (Speaker): ${speaker && speaker !== "Ngẫu nhiên" ? `Đóng vai là '${speaker}' (Luôn xưng hô đại từ là '${speaker}')` : "Hãy chọn đại từ xưng hô ngẫu nhiên, tự nhiên (như Mình, Em, Tôi, Tao, Tớ...) sao cho thân mật và trẻ trung nhất."}
5. Người nghe (Listener): ${listener && listener !== "Ngẫu nhiên" ? `Đối tượng người nghe xưng hô là '${listener}'` : "Chọn đại từ xưng hô đối tượng người nghe ngẫu nhiên (như Bạn, Anh em, Các con vợ, Các tình yêu...) phù hợp xu hướng mạng xã hội."}
6. Độ dài kịch bản:
  ${duration === "under135" ? "Dưới 135 từ (dưới 25 giây). Lời thoại phải súc tích, ngắn gọn, dồn dập, đẩy nhịp điệu nhanh." : ""}
  ${duration === "135-160" ? "Từ 135 đến 160 từ (25–45 giây). Đây là độ dài hoàn hảo để giữ chân người xem trung bình trên TikTok." : ""}
  ${duration === "150-250" ? "Từ 150 đến 250 từ (35-60 giây). Đủ dài để kể câu chuyện ngắn sâu rộng và phân tích chi tiết." : ""}
7. Ngữ cảnh cụ thể bổ sung: ${context ? context : "Không yêu cầu bổ sung."}
8. Ý tưởng phát triển chung: ${ideas || ""}
9. Các lưu ý chính sách và giọng văn tuyệt mật: ${warnings || ""}

Yêu cầu định dạng kịch bản cực kỳ sạch:
- Trường "content" của mỗi kịch bản CHỈ chứa phần lời thoại mà người dẫn sẽ đọc trước ống kính (giọng thoại). KHÔNG lồng ghép các chỉ dẫn râu ria, không lồng ghép "Người nói: ... Người nghe: ...", không chèn dấu ngoặc vuông [] chỉ dẫn âm thanh hay bối cảnh. Nhờ đó, người dùng sao chép được đúng giọng thoại thuần tuý để lồng tiếng ngay lập tức.
- Bạn có thể tùy chọn cung cấp cấu trúc 3-4 cảnh quay gợi ý siêu rút gọn dưới dạng mảng "scenes" (mỗi cảnh gồm sceneId, visual và audio tương ứng).

Hãy phản hồi thuần túy một đối tượng định dạng JSON theo cấu trúc sau (không viết markdown \`\`\`json):
{
  "scripts": [
    {
      "id": "script-1",
      "title": "Tiêu đề kịch bản (ví dụ: Chân Thật Review Điện thoại Xiaomi...)",
      "hook": "Đoạn Hook gây sự tò mò trong 3 giây đầu tiên (đọc lướt)",
      "content": "Toàn bộ bài nói thoại thuần không chỉ thị râu ria...",
      "strengthFocused": "Điểm mạnh tập trung khai thác của kịch bản này (nếu có)",
      "scenes": [
        {
          "sceneId": 1,
          "visual": "Mô tả góc máy quay gì...",
          "audio": "Nói thoại đoạn tương ứng..."
        }
      ]
    }
  ]
}

Hãy đảm bảo trả về chính xác đủ số lượng kịch bản là ${count}. Mảng chứa đúng ${count} kịch bản khác nhau mang tính bất ngờ, kịch tính và thu hút!`;

    const prompt = `Dựa trên sản phẩm "${pName}" sản xuất bởi nhãn hàng "${pBrand}" và các điểm mạnh lý thú sau: ${JSON.stringify(pKeys)}, hãy soạn ngay ${count} kịch bản TikTok Affiliate độc quyền đỉnh cao.`;

    const response = await getAIClient(req).models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.85
      }
    });

    const textOutput = response.text || "{}";
    const data = JSON.parse(textOutput.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("Generate Scripts API error:", error);
    return res.status(500).json({ error: error?.message || "Lỗi tạo danh sách kịch bản từ AI." });
  }
});

// 2c. Viết lại (regenerate) 1 kịch bản cụ thể
app.post("/api/script-writer/regenerate-single", checkGeminiApiKey, async (req, res) => {
  try {
    const {
      scannedProduct,
      settings,
      scriptId,
      userFeedback
    } = req.body;

    const pName = scannedProduct?.productName || "Sản phẩm";
    const pBrand = scannedProduct?.brand || "Thương hiệu";
    const pKeys = scannedProduct?.keyPoints || [];

    const phoneticVietnamese = settings?.phoneticVietnamese;
    const stripCTA = settings?.stripCTA;
    const speaker = settings?.speaker;
    const listener = settings?.listener;
    const duration = settings?.duration;
    const context = settings?.context;
    const ideas = settings?.ideas;
    const warnings = settings?.warnings;

    const systemInstruction = `Bạn là Chuyên gia viết kịch bản video TikTok Affiliate. Bạn có nhiệm vụ viết lại HOẶC làm mới duy nhất kịch bản có mã số "${scriptId}" cho sản phẩm "${pName}" thuộc nhãn hiệu "${pBrand}".

Hãy bám sát các tuân thủ đầu vào kỹ lưỡng giống như kịch bản gốc:
- Phiên âm tiếng Việt: ${phoneticVietnamese ? "Toàn bộ tiếng Anh viết tắt phải bẻ âm sang thuần tiếng Việt." : "Giữ nguyên."}
- Cắt bỏ CTA: ${stripCTA ? "Không kêu gọi hành động mua hàng cuối bài." : "Thêm một câu CTA mua hàng ở cuối cuốn hút."}
- Người nói và người nghe xưng hô: ${speaker || "Tự do xưng hô"} - ${listener || "Tự do đối đáp"}.
- Yêu cầu độ dài: ${duration === "under135" ? "Dưới 135 từ" : duration === "135-160" ? "Từ 135-160 từ" : "Từ 150-250 từ"}.
- Ý kiến phản hồi / Nhận xét bổ sung của người dẫn: ${userFeedback ? userFeedback : "Cải biên tự do cho kịch bản tự nhiên, cuốn hút và khác biệt hoàn toàn với bản cũ."}

Hãy chỉ trả về một đối tượng JSON đại diện cho kịch bản mới này theo cấu trúc chính xác (không viết markdown \`\`\`json):
{
  "id": "${scriptId}",
  "title": "Tiêu đề kịch bản cải tiến",
  "hook": "Đoạn Hook 3 giây ban đầu kích thích tò mò",
  "content": "Nội Dung Lời Thoại để đọc thu âm (chỉ chứa tiếng đọc thoại, tuyệt đối không lồng chỉ dẫn râu ria)",
  "strengthFocused": "Điểm mạnh tập trung",
  "scenes": [
    {
      "sceneId": 1,
      "visual": "Hình ảnh góc máy quay gì...",
      "audio": "Nói thoại đoạn tương ứng..."
    }
  ]
}`;

    const prompt = `Viết lại kịch bản số ${scriptId} dựa trên thông tin:
Tên sản phẩm: ${pName} | Thương hiệu: ${pBrand}
Điểm mạnh: ${JSON.stringify(pKeys)}
Yêu cầu chỉnh sửa cụ thể của người dùng: ${userFeedback || "Viết lại bản sáng tạo hơn hoàn toàn"}`;

    const response = await getAIClient(req).models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.9
      }
    });

    const textOutput = response.text || "{}";
    const data = JSON.parse(textOutput.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("Regenerate Single Script API error:", error);
    return res.status(500).json({ error: error?.message || "Lỗi tạo lại kịch bản đơn từ AI." });
  }
});

// Backward compatibility legacy route
app.post("/api/script-writer", checkGeminiApiKey, async (req, res) => {
  try {
    const { productName, productFeatures, audience, tone, duration, hookType } = req.body;
    const systemInstruction = `Bạn là chuyên gia sáng tạo kịch bản video xu hướng (Viral Video Scriptwriter) cực kỳ cao trên TikTok. Hãy phản hồi bằng tiếng Việt dạng JSON.`;
    const prompt = `Tạo kịch bản cho sản phẩm: ${productName}`;
    const response = await getAIClient(req).models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.8
      }
    });
    return res.json(JSON.parse((response.text || "{}").trim()));
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Lỗi" });
  }
});

// ----------------------------------------------------
// API 3: Tối Ưu & Sửa Kịch Bản (Script Optimizer)
// ----------------------------------------------------

// 3a. Parse PDF, Word hoặc file khác thông qua Gemini AI
app.post("/api/script-optimizer/parse-file", checkGeminiApiKey, async (req, res) => {
  try {
    const { fileData, fileName, mimeType } = req.body;
    if (!fileData) {
      return res.status(400).json({ error: "Vui lòng đính kèm tệp tin hợp lệ để đọc dữ liệu." });
    }

    const cleanBase64 = fileData.replace(/^data:([a-zA-Z0-9-]+\/[a-zA-Z0-9-.+]+);base64,/, "");

    const systemInstruction = `Bạn là Chuyên gia trích xuất tài liệu (Document Text Extractor AI). 
Nhiệm vụ duy nhất của bạn là đọc nội dung của file tài liệu được cung cấp (Word, PDF, txt...) và trích xuất TOÀN BỘ văn bản kịch bản hoặc đoạn hội thoại bên trong một cách chính xác tuyệt đối. 
Hãy giữ nguyên từng từ ngữ và cấu trúc dòng, loại bỏ các meta-data rác nếu có. 
Tuyệt đối không tự ý viết thêm lời bình luận, lời chào hoặc tóm tắt nào khác ngoài phần văn bản đã đọc được.`;

    const prompt = `Trích xuất tất cả văn bản kịch bản thô từ file ${fileName || "document"} này.`;

    const response = await getAIClient(req).models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "application/pdf",
            data: cleanBase64
          }
        },
        { text: prompt }
      ],
      config: {
        systemInstruction,
        temperature: 0.2
      }
    });

    const parsedText = response.text || "";
    return res.json({ text: parsedText.trim() });
  } catch (error: any) {
    console.error("Document Parser Error:", error);
    return res.status(500).json({ error: "Không thể giải mã hoặc đọc nội dung tệp tin: " + (error?.message || error) });
  }
});

// Thềm Sửa Đổi Kịch Bản Siêu Đơn Giản & Thông Minh
app.post("/api/script-optimizer/simple-edit", checkGeminiApiKey, async (req, res) => {
  try {
    const { scriptText, instructions } = req.body;
    if (!scriptText || !scriptText.trim()) {
      return res.status(400).json({ error: "Nội dung văn bản trống. Vui lòng nhập kịch bản trước khi nhấn sửa." });
    }

    const systemInstruction = `Bạn là một Biên tập viên kịch bản video xuất sắc và Chuyên gia tối ưu hóa tỷ lệ giữ chân người xem (TikTok Editor & Copywriter).
Nhiệm vụ của bạn là chỉnh sửa văn bản kịch bản được cung cấp dựa TRÊN CHỈ THỊ YÊU CẦU của người dùng.

YÊU CẦU QUAN TRỌNG:
1. Hãy sửa chữa trực tiếp và trả về TOÀN BỘ kịch bản hoàn chỉnh sau khi đã tối ưu/chỉnh sửa xong.
2. Tuyệt đối bám sát nội dung gốc của người dùng, không tóm tắt, không bỏ bớt phân cảnh quan trọng trừ khi người dùng yêu cầu lọc bỏ.
3. Không trả về định dạng JSON, không giải thích dài dòng, không thêm lời chào hay ghi chú ngoài lề.
4. CHỈ TRẢ VỀ DUY NHẤT một chuỗi văn bản kịch bản sạch hoàn chỉnh đã được biên tập chu đáo.`;

    const prompt = `Đây là nội dung kịch bản cần bạn tối ưu chỉnh sửa:
=== KỊCH BẢN GỐC ===
${scriptText}
====================

Hãy thực hiện chỉnh sửa thông minh dựa trên yêu cầu sau đây:
👉 CHỈ THỊ CHỈNH SỬA: "${instructions || "Làm sạch câu từ, tối ưu mượt mà và sửa lỗi kịch bản"}"

Hãy bắt đầu viết bản kịch bản mới hoàn thiện ngay từ dòng tiếp theo:`;

    const response = await getAIClient(req).models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    const editedText = response.text || "";
    return res.json({ text: editedText.trim() });
  } catch (error: any) {
    console.error("Simple Edit API error:", error);
    return res.status(500).json({ error: error?.message || "Lỗi chỉnh sửa thông minh từ AI." });
  }
});

app.post("/api/script-optimizer", checkGeminiApiKey, async (req, res) => {
  try {
    const { originalScript, currentIssues, findText, replaceText } = req.body;

    const systemInstruction = `Bạn là Chuyên gia tối ưu chuyển đổi tỷ lệ giữ chân giữ người xem (CRO & Video Script Specialist). Bạn giúp người dùng sửa chữa và cải biên kịch bản cũ gặp lỗi thành kịch bản đỉnh cao hơn.
Hãy viết phản hồi bằng tiếng Việt dưới định dạng JSON phù hợp chính xác theo cấu trúc này:
{
  "optimizedScript": "Nội dung toàn bộ kịch bản mới sau khi đã tối ưu hóa và sửa chữa hoàn chỉnh theo đúng chỉ thị, bao gồm cả phân bố phân cảnh, giọng điệu, lời thoại và CTA thuyết phục.",
  "explanationOfChanges": [
    {
      "point": "Điểm cải tiến chính (ví dụ: Loại bỏ tên shop/Đơn vị truyền thông)",
      "reason": "Lý giải chi tiết tại sao thay đổi này lại tối ưu hơn và tuân thủ định hướng người dùng."
    }
  ],
  "ctaEnhancement": "Đề xuất lời kêu gọi hành động (Call-to-Action) tối ưu, cuốn hút hơn sau khi loại bỏ bớt yếu tố thương mại thô cứng.",
  "predictedImpact": "Đánh giá tỷ lệ giữ chân dự báo và lý do kỹ thuật."
}

Phản hồi trực tiếp JSON không chứa định dạng markdown.`;

    let prompt = `Yêu cầu chỉnh sửa và tối ưu hóa kịch bản dưới đây:
    
- Kịch Bản Gốc Hiện Tại:
${originalScript}

- Chỉ Thị Chỉnh Sửa & Sửa Lỗi Chi Tiết (Nhiệm vụ tối cao):
"${currentIssues}"`;

    if (findText && replaceText) {
      prompt += `\n\n- Yêu Cầu Thay Thế Từ Khóa/Văn Bản Đặc Biệt khác:
Tìm cụm từ/tác nhân: "${findText}" và hãy chắc chắn thay thế hoàn toàn nó bằng cụm từ: "${replaceText}" trong suốt kịch bản tối ưu hóa.`;
    }

    prompt += `\n\nHãy giữ nguyên giá trị cốt lõi của sản phẩm chính, nhưng cấu trúc lại mạch truyện một cách hoàn hảo, bóc tách và loại bỏ đúng các danh xưng không đúng/lỗi theo chỉ thị chỉnh sửa, đảm bảo câu thoại mượt mà, gãy gọn và thu hút.`;

    const response = await getAIClient(req).models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.75
      }
    });

    const textOutput = response.text || "{}";
    const data = JSON.parse(textOutput.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("Script Optimizer API error:", error);
    return res.status(500).json({ error: error?.message || "Lỗi xử lý tối ưu kịch bản từ AI." });
  }
});

// ----------------------------------------------------
// API 4: Quét Trùng Lặp & Từ Khóa Nhạy Cảm (Content Scanner)
// ----------------------------------------------------
app.post("/api/content-scanner/scan", checkGeminiApiKey, async (req, res) => {
  try {
    const { projectName, scripts } = req.body;
    if (!scripts || !Array.isArray(scripts) || scripts.length === 0) {
      return res.status(400).json({ error: "Danh sách kịch bản không hợp lệ hoặc trống." });
    }

    const systemInstruction = `Bạn là Chuyên gia kiểm duyệt chất lượng & Tối ưu hóa kịch bản nội dung TikTok (TikTok Hook Duplicate Auditor). 
Nhiệm vụ của bạn là phân tích một danh sách các kịch bản video ngắn và phát hiện sự trùng lặp ở phần dẫn nhập (Hook - thường là 1 đến 3 câu đầu tiên của kịch bản).

QUY TẮC PHÂN TÍCH:
1. Trích xuất Hook (1 đến 3 câu đầu tiên) của từng kịch bản.
2. So sánh đối chiếu Hook giữa các kịch bản với nhau (chỉ đối chiếu nội bộ trong danh sách này, không so sánh ra ngoài).
3. Đánh giá tính trùng lặp: Nếu hai hook có nội dung từ ngữ trùng khớp hoặc biểu đạt tương đồng hơn 60%, hãy coi chúng là trùng lặp.
   - Giữ nguyên kịch bản xuất hiện SỚM HƠN trong danh sách (đánh dấu isDuplicate = false).
   - Đánh dấu kịch bản xuất hiện SAU mà bị trùng lặp với kịch bản trước là trùng lặp (isDuplicate = true).
4. XỬ LÝ TRÙNG LẶP:
   - Đối với kịch bản bị trùng lặp (isDuplicate = true): Bạn PHẢI viết lại phần câu dẫn (Hook) của kịch bản đó sao cho khác hoàn toàn về mặt chữ, sáng tạo bất ngờ, thu hút hơn nhưng vẫn truyền tải đúng thông điệp giới thiệu sản phẩm của kịch bản đó. Ghép nối Hook mới đã viết với phần nội dung sau của kịch bản đó để tạo thành kịch bản hoàn chỉnh mới (optimizedText). Tuyệt đối KHÔNG ĐƯỢC làm mất hay bỏ bớt bất kỳ nội dung nào ở phần thân kịch bản. Chỉ viết 1 mẫu tốt nhất duy nhất cho mỗi kịch bản bị trùng lặp.
   - Đối với kịch bản KHÔNG bị trùng lặp: Giữ nguyên văn bản gốc của kịch bản đó trong trường optimizedText, và đặt isDuplicate = false.
5. ĐẢM BẢO KHÔNG MẤT NỘI DUNG: Trả về đầy đủ tất cả kịch bản theo đúng thứ tự mảng đầu vào, không bỏ sót bất kỳ kịch bản nào ở cuối danh sách. Trả về đúng số lượng kịch bản đầu vào của người dùng.

Định dạng JSON cần độ chính xác tuyệt đối như sau:
{
  "duplicateCount": 2,
  "findingsMsg": "Đã quét xong - Phát hiện N Kịch bản bị trùng, đã sửa thành công để tránh bóp tương tác TikTok.",
  "scripts": [
    {
      "id": "id_trung_khop_ban_goc",
      "isDuplicate": true,
      "originalHook": "Văn bản hook gốc được trích xuất (1-3 câu đầu)",
      "newHook": "Văn bản hook mới sau khi viết lại (nếu isDuplicate là true, nếu false thì ghi giống originalHook)",
      "optimizedText": "Toàn bộ kịch bản hoàn chỉnh (Nếu trùng lặp thì bằng hook mới + phần còn lại của kịch bản gốc. Nếu không trùng lặp thì bằng nguyên văn kịch bản gốc)",
      "explanation": "Giải thích ngắn gọn lý do trùng lặp (nêu rõ trùng với kịch bản số mấy trước đó) và điểm cải tiến của hook mới"
    }
  ]
}

Chú ý: Trả về JSON sạch, không bọc trong thẻ tóm tắt markdown \`\`\`json.`;

    const prompt = `Hãy phân tích dự án trùng lặp "${projectName || "Chưa đặt tên"}" gồm danh sách ${scripts.length} kịch bản sau đây và chỉnh sửa các kịch bản trùng lặp:

${scripts.map((s, index) => `=== Kịch bản #${index + 1} (ID: ${s.id}) ===\n${s.text}\n===`).join("\n\n")}

Hãy nhớ trả về đầy đủ tất cả ${scripts.length} kịch bản, không bỏ sót bất kỳ kịch bản nào!`;

    const response = await getAIClient(req).models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    const textOutput = response.text || "{}";
    const data = JSON.parse(textOutput.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("Content Scanner Scan API error:", error);
    return res.status(500).json({ error: error?.message || "Lỗi quét kiểm tra trùng lặp từ AI." });
  }
});

app.post("/api/content-scanner", checkGeminiApiKey, async (req, res) => {
  try {
    const { scriptText } = req.body;

    const systemInstruction = `Bạn là Cố vấn kiểm duyệt nội dung Tiktok (TikTok Safe Content Auditor). 
Bạn chịu trách nhiệm dò quét các từ khóa bị hạn chế, bị cấm theo chính sách của Tiktok & Shopee (những từ ngữ dẫn đến bóp tương tác, đình chỉ giỏ hàng hay cảnh cáo kênh), đồng thời phát hiện những cấu trúc câu thoại sáo rỗng hoặc quá đại trà nhằm gia tăng tính độc bản (uniqueness) thuật toán phát hiện trùng lặp của TikTok lướt AI.

Hãy phản hồi bằng tiếng Việt và xuất bản dữ liệu hoàn chỉnh dạng JSON theo cấu trúc sau:
{
  "uniquenessScore": 65, // Thang điểm từ 0 đến 100 biểu thị tính sáng tạo, chống quét trùng lặp
  "warnings": [
    {
      "word": "Cụm từ vi phạm tìm thấy trong kịch bản",
      "category": "policy", // chọn 'policy' (VP chính sách Tiktok), 'cliche' (sáo rỗng đại trà), hoặc 'spam' (dẫn dụ vi phạm)
      "explanation": "Lý do vì sao Tiktok sẽ quét từ khóa này (ví dụ: thổi phồng công dụng, cam kết 100%, từ ngữ bạo lực, nói xấu đối thủ)",
      "suggestion": "Giải pháp thay thế an toàn nhưng vẫn giữ nguyên ý nghĩa thuyết phục"
    }
  ],
  "overallRating": "Nhận xét tổng quan về độ an toàn nội dung và rủi ro dính thuật toán bóp tương tác",
  "rewriteVersion": "Bản viết lại tối ưu hóa: Toàn bộ kịch bản của người dùng sau khi thay thế hết tất cả từ ngữ vi phạm, điều chỉnh giọng dắt câu độc đáo để vượt qua bộ lọc quét trùng lặp của TikTok.",
  "seoKeywords": ["Từ khóa seo tiktok 1", "Từ khóa seo tiktok 2"]
}

Phản hồi trực tiếp JSON không chứa định dạng markdown.`;

    const prompt = `Yêu cầu quét trùng lặp và từ khóa nhạy cảm cho kịch bản sau:
"""
${scriptText}
"""

Hãy kiểm tra thật chi tiết chính sách kiểm duyệt văn bản quảng cáo mới nhất của Tiktok & Shopee (năm 2026), phát hiện các lỗi dính bản quyền mẫu, các câu dập khuôn sáo rỗng dễ bị trí tuệ nhân tạo quét trùng lặp (duplicate content detection).`;

    const response = await getAIClient(req).models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.75
      }
    });

    const textOutput = response.text || "{}";
    const data = JSON.parse(textOutput.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("Content Scanner API error:", error);
    return res.status(500).json({ error: error?.message || "Lỗi quét kiểm tra trùng lặp từ AI." });
  }
});

// ----------------------------------------------------
// Express Vite setup for Development and Production
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started on http://0.0.0.0:${PORT}`);
  });
}

startServer();
