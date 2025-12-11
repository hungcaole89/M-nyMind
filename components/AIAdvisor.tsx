import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Transaction } from '../types';
import { getFinancialAdvice } from '../services/geminiService';
import ReactMarkdown from 'react-markdown'; 

// Simple markdown renderer replacement for text content
const SimpleMarkdown = ({ content }: { content: string }) => {
    return (
        <div className="prose prose-sm prose-primary dark:prose-invert text-gray-700 dark:text-gray-300 space-y-2">
            {content.split('\n').map((line, idx) => {
                if (line.startsWith('###')) return <h3 key={idx} className="font-bold text-primary-800 dark:text-primary-300 mt-2">{line.replace('###', '')}</h3>
                if (line.startsWith('**') && line.endsWith('**')) return <strong key={idx} className="block mt-1 text-gray-900 dark:text-gray-100">{line.replace(/\*\*/g, '')}</strong>
                if (line.startsWith('- ')) return <li key={idx} className="ml-4 list-disc">{line.replace('- ', '')}</li>
                if (line.trim() === '') return <br key={idx} />
                return <p key={idx}>{line}</p>
            })}
        </div>
    )
}

interface Props {
  transactions: Transaction[];
}

const AIAdvisor: React.FC<Props> = ({ transactions }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGetAdvice = async () => {
    setLoading(true);
    const result = await getFinancialAdvice(transactions);
    setAdvice(result);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-primary-100 dark:border-gray-700 relative overflow-hidden transition-colors">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="w-24 h-24 text-primary-600 dark:text-primary-400" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-primary-900 dark:text-primary-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            Trợ lý Tài chính AI
          </h3>
          <button
            onClick={handleGetAdvice}
            disabled={loading}
            className="text-xs bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-300 px-3 py-1.5 rounded-full font-medium shadow-sm border border-primary-100 dark:border-gray-600 hover:bg-primary-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
          >
            {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {advice ? 'Phân tích lại' : 'Phân tích ngay'}
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 text-primary-400 dark:text-primary-300 space-y-2">
             <div className="w-2 h-2 bg-primary-400 dark:bg-primary-300 rounded-full animate-ping"></div>
             <span className="text-sm">Đang suy nghĩ...</span>
          </div>
        ) : advice ? (
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 text-sm leading-relaxed border border-primary-50/50 dark:border-gray-700/50">
            <SimpleMarkdown content={advice} />
          </div>
        ) : (
          <p className="text-sm text-primary-700/80 dark:text-primary-200/60">
            Nhấn nút phân tích để nhận lời khuyên về thói quen chi tiêu của bạn từ AI.
          </p>
        )}
      </div>
    </div>
  );
};

export default AIAdvisor;