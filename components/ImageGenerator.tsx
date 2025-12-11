import React, { useState } from 'react';
import { Image as ImageIcon, Loader2, Download } from 'lucide-react';
import { generateGoalImage } from '../services/geminiService';

const ASPECT_RATIOS = [
  "1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"
];

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;

    setIsLoading(true);
    setGeneratedImage(null);
    const result = await generateGoalImage(prompt, aspectRatio);
    setGeneratedImage(result);
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
                <ImageIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-800">Minh họa mục tiêu</h2>
                <p className="text-sm text-gray-500">Hình dung mục tiêu tài chính của bạn bằng AI</p>
            </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
            <div className="space-y-6">
                <form onSubmit={handleGenerate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả mục tiêu của bạn</label>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ví dụ: Một ngôi nhà hiện đại bên bờ biển lúc hoàng hôn, hoặc một chiếc xe hơi thể thao màu đỏ..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none h-32 resize-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tỷ lệ khung hình</label>
                        <div className="grid grid-cols-4 gap-2">
                            {ASPECT_RATIOS.map(ratio => (
                                <button
                                    key={ratio}
                                    type="button"
                                    onClick={() => setAspectRatio(ratio)}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                                        aspectRatio === ratio 
                                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                                    }`}
                                >
                                    {ratio}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading || !prompt}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                        {isLoading ? 'Đang vẽ...' : 'Tạo hình ảnh'}
                    </button>
                </form>
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center min-h-[300px] overflow-hidden relative group">
                {isLoading ? (
                    <div className="text-center text-purple-600">
                        <Loader2 className="w-10 h-10 animate-spin mx-auto mb-2" />
                        <p className="text-sm font-medium">AI đang sáng tạo...</p>
                    </div>
                ) : generatedImage ? (
                    <>
                        <img src={generatedImage} alt="Generated Goal" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a 
                                href={generatedImage} 
                                download="money-mind-goal.png"
                                className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors"
                            >
                                <Download className="w-4 h-4" /> Tải về
                            </a>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-gray-400 p-6">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Hình ảnh sẽ xuất hiện ở đây</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ImageGenerator;