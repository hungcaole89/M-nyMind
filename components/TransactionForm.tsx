import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, Wallet, TrendingDown, Loader2, Sparkles, Camera, Save, Pencil, Coins } from 'lucide-react';
import { Transaction, TransactionType, Category, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';
import { suggestCategory, analyzeReceipt } from '../services/geminiService';

interface Props {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction?: (transaction: Transaction) => void;
  initialData?: Transaction | null;
  onClose: () => void;
}

const formatPreviewCurrency = (val: string) => {
    if (!val) return '0 ₫';
    const num = parseFloat(val);
    if (isNaN(num)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

const QUICK_AMOUNTS = [
    { label: '+50k', value: 50000 },
    { label: '+100k', value: 100000 },
    { label: '+500k', value: 500000 },
    { label: '+1Tr', value: 1000000 },
];

const TransactionForm: React.FC<Props> = ({ onAddTransaction, onUpdateTransaction, initialData, onClose }) => {
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState<string>(Category.FOOD);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount.toString());
      setType(initialData.type);
      setCategory(initialData.category);
      setDate(initialData.date);
      setNote(initialData.note);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    if (initialData && onUpdateTransaction) {
        // Update existing
        onUpdateTransaction({
            id: initialData.id,
            amount: parseFloat(amount),
            type,
            category,
            date,
            note
        });
    } else {
        // Add new
        onAddTransaction({
            amount: parseFloat(amount),
            type,
            category,
            date,
            note
        });
    }
    onClose();
  };

  const handleSuggestCategory = async () => {
    if (!note) return;
    setIsSuggesting(true);
    const suggested = await suggestCategory(note);
    if (suggested) {
        setCategory(suggested);
        if (INCOME_CATEGORIES.includes(suggested as Category)) {
            setType(TransactionType.INCOME);
        } else if (EXPENSE_CATEGORIES.includes(suggested as Category)) {
            setType(TransactionType.EXPENSE);
        }
    }
    setIsSuggesting(false);
  }

  const handleTypeChange = (newType: TransactionType) => {
      setType(newType);
      if (newType === TransactionType.EXPENSE) {
          setCategory(EXPENSE_CATEGORIES[0]);
      } else {
          setCategory(INCOME_CATEGORIES[0]);
      }
  };

  const handleQuickAdd = (valueToAdd: number) => {
      setAmount(prev => {
          const current = prev ? parseFloat(prev) : 0;
          return (current + valueToAdd).toString();
      });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const result = await analyzeReceipt(base64String);
        
        if (result) {
          if (result.amount) setAmount(result.amount.toString());
          if (result.date) setDate(result.date);
          if (result.category) setCategory(result.category);
          if (result.note) setNote(result.note);
          setType(TransactionType.EXPENSE); 
        }
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing image:", error);
      setIsAnalyzing(false);
    }
  };

  const currentCategories = type === TransactionType.EXPENSE ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-300 transition-colors">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
        {initialData ? <Pencil className="w-6 h-6 text-primary-600 dark:text-primary-400" /> : <PlusCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />}
        {initialData ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch mới'}
      </h2>
      
      {!initialData && (
          <div className="mb-6">
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="w-full py-3 px-4 border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:border-primary-300 transition-all flex items-center justify-center gap-2"
            >
                {isAnalyzing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang quét hóa đơn...
                    </>
                ) : (
                    <>
                        <Camera className="w-5 h-5" />
                        Quét hóa đơn để nhập tự động
                    </>
                )}
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
            />
          </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selection */}
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg transition-colors">
          <button
            type="button"
            onClick={() => handleTypeChange(TransactionType.EXPENSE)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              type === TransactionType.EXPENSE
                ? 'bg-white dark:bg-gray-600 text-red-600 dark:text-red-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingDown className="w-4 h-4" /> Chi tiêu
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange(TransactionType.INCOME)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              type === TransactionType.INCOME
                ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
            }`}
          >
             <div className="flex items-center justify-center gap-2">
              <Wallet className="w-4 h-4" /> Thu nhập
            </div>
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số tiền (VNĐ)</label>
          <div className="relative">
             <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-xl font-bold text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                placeholder="0"
                required
                autoFocus={!initialData}
              />
              {/* Formatted Preview Inside Input Area */}
              {amount && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 dark:text-gray-300 bg-white/80 dark:bg-gray-700/80 px-2 py-1 rounded pointer-events-none">
                      {formatPreviewCurrency(amount)}
                  </div>
              )}
          </div>
          
          {/* Quick Add Buttons */}
          <div className="flex flex-wrap gap-2 mt-2">
            {QUICK_AMOUNTS.map((item) => (
                <button
                    key={item.label}
                    type="button"
                    onClick={() => handleQuickAdd(item.value)}
                    className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs font-semibold rounded-full border border-primary-100 dark:border-primary-800 transition-colors flex items-center gap-1"
                >
                    <PlusCircle className="w-3 h-3" /> {item.label}
                </button>
            ))}
          </div>
        </div>

        {/* Note & AI Suggestion */}
        <div className="relative">
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú</label>
             <div className="flex gap-2">
                <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="VD: Ăn trưa bún bò"
                />
                <button 
                    type="button"
                    onClick={handleSuggestCategory}
                    disabled={isSuggesting || !note}
                    className="p-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 disabled:opacity-50 transition-colors"
                    title="Tự động chọn danh mục bằng AI"
                >
                    {isSuggesting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5"/>}
                </button>
             </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Danh mục ({type === TransactionType.EXPENSE ? 'Chi tiêu' : 'Thu nhập'})</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
          >
            {currentCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div className="pt-2 flex gap-3">
             <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
                Hủy
            </button>
            <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-md transition-colors flex items-center justify-center gap-2"
            >
                {initialData ? <Save className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                {initialData ? 'Cập nhật' : 'Lưu giao dịch'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;