import React, { useState } from 'react';
import { Image as ImageIcon, Loader2, Download, Sparkles, AlertCircle } from 'lucide-react';
import { generateImageWithOpenAI } from '../services/openaiImageService';

const ASPECT_RATIOS = [
  { label: '1:1', value: '1:1', desc: 'Vuông' },
  { label: '16:9', value: '16:9', desc: 'Ngang rộng' },
  { label: '9:16', value: '9:16', desc: 'Dọc' },
];

const QUALITY_OPTIONS = [
  { value: 'standard', label: 'Standard', desc: 'Nhanh hơn' },
  { value: 'hd', label: 'HD', desc: 'Chi tiết hơn' },
];

const PROMPT_SUGGESTIONS = [
  'Một ngôi nhà hiện đại bên bờ biển lúc hoàng hôn',
  'Chiếc xe hơi thể thao màu đỏ trên đường cao tốc',
  'Du lịch Paris, tháp Eiffel lúc ban đêm',
  'Vườn rau sạch xanh mướt tại nhà',
  'Văn phòng làm việc sang trọng hiện đại',
];

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setGeneratedImage(null);
    setError(null);

    const result = await generateImageWithOpenAI(prompt, aspectRatio, quality);

    if (result) {
      setGeneratedImage(result);
    } else {
      setError('Không thể tạo ảnh. Vui lòng kiểm tra API key hoặc thử lại sau.');
    }
    setIsLoading(false);
  };

  const handleSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-none dark:border dark:border-gray-700 border border-gray-100 p-6 min-h-[500px] transition-colors">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <ImageIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Tạo ảnh với AI</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Powered by OpenAI DALL-E 3</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        {/* Controls */}
        <div className="space-y-5">
          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mô tả hình ảnh bạn muốn tạo
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ví dụ: Một ngôi nhà hiện đại bên bờ biển lúc hoàng hôn, phong cách kiến trúc Nhật Bản..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none h-32 resize-none text-sm"
                required
              />
            </div>

            {/* Suggestions */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Gợi ý nhanh:
              </p>
              <div className="flex flex-wrap gap-2">
                {PROMPT_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSuggestion(s)}
                    className="text-xs px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-700 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tỷ lệ khung hình
              </label>
              <div className="flex gap-2">
                {ASPECT_RATIOS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setAspectRatio(r.value)}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                      aspectRatio === r.value
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-bold">{r.label}</div>
                    <div className="text-[10px] opacity-70">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chất lượng
              </label>
              <div className="flex gap-2">
                {QUALITY_OPTIONS.map((q) => (
                  <button
                    key={q.value}
                    type="button"
                    onClick={() => setQuality(q.value as 'standard' | 'hd')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                      quality === q.value
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-bold">{q.label}</div>
                    <div className="text-[10px] opacity-70">{q.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang tạo ảnh...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Tạo hình ảnh
                </>
              )}
            </button>
          </form>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 flex items-center justify-center min-h-[320px] overflow-hidden relative group">
          {isLoading ? (
            <div className="text-center text-purple-600 dark:text-purple-400 p-6">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium">DALL-E 3 đang sáng tạo...</p>
              <p className="text-xs text-gray-400 mt-1">Có thể mất 10-30 giây</p>
            </div>
          ) : error ? (
            <div className="text-center p-6">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            </div>
          ) : generatedImage ? (
            <>
              <img
                src={generatedImage}
                alt="DALL-E Generated"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <a
                  href={generatedImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="dalle-image.png"
                  className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" /> Tải về
                </a>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-400 dark:text-gray-500 p-6">
              <ImageIcon className="w-14 h-14 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Hình ảnh sẽ xuất hiện ở đây</p>
              <p className="text-xs mt-1 opacity-70">Nhập mô tả và nhấn "Tạo hình ảnh"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
