import React from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { 
  Trash2, 
  Pencil, 
  Utensils, 
  Car, 
  ShoppingBag, 
  Receipt, 
  Film, 
  HeartPulse, 
  GraduationCap, 
  Banknote, 
  Trophy, 
  TrendingUp, 
  Gift, 
  CircleEllipsis,
  HelpCircle
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
}

const getCategoryIcon = (categoryName: string) => {
  switch (categoryName) {
    // Expense Categories
    case Category.FOOD: return Utensils;
    case Category.TRANSPORT: return Car;
    case Category.SHOPPING: return ShoppingBag;
    case Category.BILLS: return Receipt;
    case Category.ENTERTAINMENT: return Film;
    case Category.HEALTH: return HeartPulse;
    case Category.EDUCATION: return GraduationCap;
    
    // Income Categories
    case Category.SALARY: return Banknote;
    case Category.BONUS: return Trophy;
    case Category.INVESTMENT: return TrendingUp;
    case Category.GIFT: return Gift;
    
    // Other
    case Category.OTHER: return CircleEllipsis;
    default: return HelpCircle;
  }
};

const TransactionList: React.FC<Props> = ({ transactions, onDelete, onEdit }) => {
  // Group transactions by date
  const groupedTransactions = transactions.reduce((acc, transaction) => {
    const date = transaction.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (transactions.length === 0) {
    return (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
            <p>Chưa có giao dịch nào.</p>
        </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedDates.map((date) => (
        <div key={date} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
          <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 flex justify-between">
            <span>{new Date(date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {groupedTransactions[date].map((t) => {
              const IconComponent = getCategoryIcon(t.category);
              
              return (
                <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-full ${t.type === TransactionType.INCOME ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{t.category}</p>
                      {t.note && <p className="text-xs text-gray-500 dark:text-gray-400">{t.note}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className={`font-semibold ${t.type === TransactionType.INCOME ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'}{t.amount.toLocaleString('vi-VN')} ₫
                    </span>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {onEdit && (
                            <button 
                              onClick={() => onEdit(t)}
                              className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-md transition-colors"
                              title="Sửa"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                        )}
                        <button 
                          onClick={() => onDelete(t.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;