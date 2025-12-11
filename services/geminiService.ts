import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, TransactionType, Category } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) {
    return "Bạn chưa có giao dịch nào để phân tích. Hãy thêm một vài khoản thu chi nhé!";
  }

  // Filter last 30 days for relevance
  const recentTransactions = transactions.slice(0, 50); // Limit to last 50 to save tokens

  const prompt = `
    Đóng vai trò là một chuyên gia tài chính cá nhân thân thiện và sắc sảo.
    Dưới đây là danh sách các giao dịch gần đây của tôi (định dạng JSON):
    ${JSON.stringify(recentTransactions)}

    Hãy phân tích thói quen chi tiêu của tôi và đưa ra lời khuyên ngắn gọn, thiết thực (dưới 150 từ).
    Hãy tập trung vào:
    1. Tôi đang tiêu nhiều tiền nhất vào đâu?
    2. Có khoản chi nào bất thường không?
    3. Một lời khuyên cụ thể để tiết kiệm tốt hơn trong tháng tới.
    
    Sử dụng định dạng Markdown, dùng tiếng Việt tự nhiên, khuyến khích.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "Xin lỗi, hiện tại tôi không thể phân tích dữ liệu.";
  } catch (error) {
    console.error("Lỗi khi gọi Gemini:", error);
    return "Đã xảy ra lỗi khi kết nối với trợ lý ảo. Vui lòng thử lại sau.";
  }
};

export const suggestCategory = async (note: string): Promise<string | null> => {
  if (!note || note.length < 3) return null;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Phân loại ngắn gọn giao dịch này vào 1 trong các mục sau: 'Ăn uống', 'Di chuyển', 'Mua sắm', 'Hóa đơn', 'Giải trí', 'Sức khỏe', 'Giáo dục', 'Lương', 'Thưởng', 'Đầu tư', 'Quà tặng', 'Khác'. Chỉ trả về tên danh mục, không giải thích. Giao dịch: "${note}"`,
    });
    const text = response.text?.trim();
    return text || null;
  } catch (e) {
      return null;
  }
}

export const analyzeReceipt = async (base64Image: string): Promise<{ amount?: number; date?: string; category?: string; note?: string } | null> => {
  try {
    // Remove header if present (e.g., "data:image/jpeg;base64,")
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
          { text: `Phân tích hình ảnh hóa đơn/biên lai này để trích xuất thông tin giao dịch.
            Trả về kết quả dưới dạng JSON với các trường sau:
            - amount: Tổng số tiền (kiểu số).
            - date: Ngày giao dịch (định dạng YYYY-MM-DD). Nếu không thấy năm, giả định năm hiện tại.
            - category: Một chuỗi khớp chính xác với một trong các giá trị sau: ${Object.values(Category).join(', ')}. Nếu không chắc, chọn 'Khác'.
            - note: Tóm tắt ngắn gọn các mặt hàng hoặc nội dung chi tiêu (tiếng Việt).
            ` 
          }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Error analyzing receipt:", error);
    return null;
  }
};

export const generateGoalImage = async (prompt: string, aspectRatio: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};