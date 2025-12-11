import React, { useState, useEffect, useRef } from 'react';
import { Plus, LayoutDashboard, History, Wallet, Filter, AlertTriangle, LogOut, Calendar, ArrowRight, Landmark, PiggyBank, TrendingUp, TrendingDown, Minus, Info, Target, Settings } from 'lucide-react';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import { ExpensePieChart, IncomePieChart } from './components/Charts';
import AIAdvisor from './components/AIAdvisor';
import AuthForm from './components/AuthForm';
import ThemeSelector, { THEME_PRESETS } from './components/ThemeSelector';
import { Transaction, TransactionType, User } from './types';
import { getCurrentUser, logout } from './services/authService';

// --- THEME UTILS ---
// Helper to convert Hex to HSL for CSS variables
const hexToHSL = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt("0x" + hex[1] + hex[1]);
      g = parseInt("0x" + hex[2] + hex[2]);
      b = parseInt("0x" + hex[3] + hex[3]);
    } else if (hex.length === 7) {
      r = parseInt("0x" + hex[1] + hex[2]);
      g = parseInt("0x" + hex[3] + hex[4]);
      b = parseInt("0x" + hex[5] + hex[6]);
    }
    r /= 255; g /= 255; b /= 255;
    const cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin;
    let h = 0, s = 0, l = 0;
  
    if (delta === 0) h = 0;
    else if (cmax === r) h = ((g - b) / delta) % 6;
    else if (cmax === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
  
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    l = (cmax + cmin) / 2;
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);
  
    return { h, s, l };
};

const applyTheme = (hex: string) => {
    const { h, s, l } = hexToHSL(hex);
    
    // Generate shades
    const setVar = (name: string, light: number) => {
        document.documentElement.style.setProperty(name, `${h} ${s}% ${light}%`);
    };

    setVar('--color-primary-50', 97);
    setVar('--color-primary-100', 95);
    setVar('--color-primary-200', 90);
    setVar('--color-primary-300', 82);
    setVar('--color-primary-400', 70);
    setVar('--color-primary-500', 60);
    setVar('--color-primary-600', 50); 
    setVar('--color-primary-700', 40);
    setVar('--color-primary-800', 30);
    setVar('--color-primary-900', 20);
    setVar('--color-primary-950', 10);
};
// --- END THEME UTILS ---


// Helper to format currency fully
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Component to handle compact number display with tooltip
const InteractiveBalance = ({ amount, className }: { amount: number, className?: string }) => {
    const [showFull, setShowFull] = useState(false);
    
    const formatCompact = (num: number) => {
        const absNum = Math.abs(num);
        if (absNum >= 1_000_000_000) {
            return (num / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 3 }) + ' Tỷ';
        }
        if (absNum >= 1_000_000) {
            return (num / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 3 }) + ' Tr';
        }
        return formatCurrency(num);
    };

    const isCompacted = Math.abs(amount) >= 1_000_000;
    const displayText = isCompacted ? formatCompact(amount) : formatCurrency(amount);

    return (
        <div className="relative inline-block">
            <span 
                className={`cursor-pointer select-none ${className} hover:opacity-80 transition-opacity flex items-center gap-1`}
                onClick={(e) => {
                    e.stopPropagation();
                    if(isCompacted) setShowFull(!showFull);
                }}
            >
                {displayText}
                {isCompacted && <Info className="w-3 h-3 opacity-50" />}
            </span>
            
            {showFull && (
                <div className="absolute left-0 bottom-full mb-2 z-50 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap animate-in fade-in zoom-in duration-200">
                    {formatCurrency(amount)}
                    <div className="absolute -bottom-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
                </div>
            )}
            {showFull && (
                <div className="fixed inset-0 z-40" onClick={() => setShowFull(false)}></div>
            )}
        </div>
    );
};

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

// Helper to get YYYY-MM key from a date object
const getMonthKey = (date: Date | null) => {
    if (!date) return new Date().toISOString().slice(0, 7); // Default to current month
    const d = new Date(date);
    // Use local time to determine the month key
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

type FilterType = 'THIS_WEEK' | 'LAST_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM' | 'ALL';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Custom Colors & Theme State
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});
  const [themeHex, setThemeHex] = useState<string>(THEME_PRESETS[0].hex);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Budget State: Map of "YYYY-MM" -> Percentage (number)
  const [monthlyBudgets, setMonthlyBudgets] = useState<Record<string, number>>({});

  // Filter State
  const [filterType, setFilterType] = useState<FilterType>('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Modal State
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Check login status on mount
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  // Load User Data & Preferences
  useEffect(() => {
    if (!user) {
        setTransactions([]);
        setCategoryColors({});
        setMonthlyBudgets({});
        return;
    }

    // Load Transactions
    const userKey = `money_mind_transactions_${user.username}`;
    const saved = localStorage.getItem(userKey);
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (e) {
        setTransactions([]);
      }
    } else {
         setTransactions([
            { id: '1', amount: 5000000, type: TransactionType.INCOME, category: 'Lương', date: new Date().toISOString().split('T')[0], note: 'Tạm ứng lương' },
            { id: '2', amount: 50000, type: TransactionType.EXPENSE, category: 'Ăn uống', date: new Date().toISOString().split('T')[0], note: 'Cơm trưa' },
        ]);
    }

    // Load Colors
    const colorsKey = `money_mind_colors_${user.username}`;
    const savedColors = localStorage.getItem(colorsKey);
    if (savedColors) {
        try { setCategoryColors(JSON.parse(savedColors)); } catch (e) {}
    }

    // Load Main Theme Color
    const themeKey = `money_mind_theme_${user.username}`;
    const savedTheme = localStorage.getItem(themeKey);
    if (savedTheme) {
        setThemeHex(savedTheme);
        applyTheme(savedTheme);
    } else {
        applyTheme(THEME_PRESETS[0].hex);
    }

    // Load Dark Mode
    const darkModeKey = `money_mind_darkmode_${user.username}`;
    const savedDarkMode = localStorage.getItem(darkModeKey);
    if (savedDarkMode === 'true') {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
    } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
    }

    // Load Monthly Budgets
    const budgetKey = `money_mind_monthly_budgets_${user.username}`;
    const savedBudgets = localStorage.getItem(budgetKey);
    if (savedBudgets) {
        try {
            setMonthlyBudgets(JSON.parse(savedBudgets));
        } catch (e) {
            setMonthlyBudgets({});
        }
    }

  }, [user]);

  // Persist Transactions
  useEffect(() => {
    if (user && transactions.length > 0) {
        localStorage.setItem(`money_mind_transactions_${user.username}`, JSON.stringify(transactions));
    }
  }, [transactions, user]);

  // Persist Colors
  useEffect(() => {
      if (user) {
          localStorage.setItem(`money_mind_colors_${user.username}`, JSON.stringify(categoryColors));
      }
  }, [categoryColors, user]);

  const handleLogout = () => {
    logout();
    setUser(null);
  };
  
  const handleThemeChange = (hex: string) => {
      setThemeHex(hex);
      applyTheme(hex);
      if (user) {
          localStorage.setItem(`money_mind_theme_${user.username}`, hex);
      }
  };

  const handleToggleDarkMode = () => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      if (newMode) {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
      if (user) {
          localStorage.setItem(`money_mind_darkmode_${user.username}`, String(newMode));
      }
  };

  const addTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTx,
      id: Date.now().toString(),
    };
    setTransactions(prev => [transaction, ...prev]);
  };
  
  const updateTransaction = (updatedTx: Transaction) => {
      setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
  };

  const handleEditTransaction = (tx: Transaction) => {
      setEditingTransaction(tx);
      setShowAddModal(true);
  };

  const promptDeleteTransaction = (id: string) => {
    setTransactionToDelete(id);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
        setTransactions(prev => prev.filter(t => t.id !== transactionToDelete));
        setTransactionToDelete(null);
    }
  };

  const handleCloseModal = () => {
      setShowAddModal(false);
      setEditingTransaction(null);
  };

  const handleColorChange = (category: string, color: string) => {
      setCategoryColors(prev => ({ ...prev, [category]: color }));
  };

  const getDateRange = (): { start: Date | null, end: Date | null } => {
      const now = new Date();
      now.setHours(0,0,0,0);
      let start: Date | null = null;
      let end: Date | null = null;

      if (filterType === 'THIS_WEEK') {
          const day = now.getDay();
          const diff = now.getDate() - (day === 0 ? 6 : day - 1); 
          start = new Date(now.setDate(diff));
          start.setHours(0,0,0,0);
          end = new Date(start);
          end.setDate(start.getDate() + 6);
          end.setHours(23,59,59,999);
      } else if (filterType === 'LAST_WEEK') {
          const day = now.getDay();
          const diff = now.getDate() - (day === 0 ? 6 : day - 1) - 7; 
          start = new Date(now.setDate(diff));
          start.setHours(0,0,0,0);
          end = new Date(start);
          end.setDate(start.getDate() + 6);
          end.setHours(23,59,59,999);
      } else if (filterType === 'THIS_MONTH') {
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      } else if (filterType === 'LAST_MONTH') {
          start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      } else if (filterType === 'CUSTOM') {
          if (customStartDate) {
              start = new Date(customStartDate);
              start.setHours(0,0,0,0);
          }
          if (customEndDate) {
              end = new Date(customEndDate);
              end.setHours(23,59,59,999);
          }
      }
      return { start, end };
  };

  const getFilteredTransactions = () => {
    const { start, end } = getDateRange();
    return transactions.filter(t => {
      if (filterType === 'ALL') return true;
      const tDate = new Date(t.date);
      tDate.setHours(12, 0, 0, 0); 
      if (start && tDate < start) return false;
      if (end && tDate > end) return false;
      return true;
    });
  };

  const getOpeningBalance = () => {
      const { start } = getDateRange();
      if (filterType === 'ALL' || !start) return 0;
      const startStr = start.toISOString().split('T')[0];
      return transactions
          .filter(t => t.date < startStr)
          .reduce((sum, t) => sum + (t.type === TransactionType.INCOME ? t.amount : -t.amount), 0);
  };

  if (!user) {
    return <AuthForm onLogin={setUser} />;
  }

  const { start: dateRangeStart, end: dateRangeEnd } = getDateRange();
  
  // Growth Logic
  const filteredTransactions = getFilteredTransactions();
  const openingBalance = getOpeningBalance();
  const periodIncome = filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
  const periodExpense = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
  const closingBalance = openingBalance + periodIncome - periodExpense;

  const globalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
  const globalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
  const globalBalance = globalIncome - globalExpense;

  let incomeGrowthPercent: number | null = null;
  let expenseGrowthPercent: number | null = null;
  
  if (dateRangeStart && dateRangeEnd && filterType !== 'ALL' && filterType !== 'CUSTOM') {
      const prevStart = new Date(dateRangeStart);
      const prevEnd = new Date(dateRangeEnd);
      prevStart.setMonth(prevStart.getMonth() - 1);
      prevEnd.setMonth(prevEnd.getMonth() - 1);

      const previousIncome = transactions.filter(t => {
          const tDate = new Date(t.date);
          tDate.setHours(12, 0, 0, 0); 
          return t.type === TransactionType.INCOME && tDate >= prevStart && tDate <= prevEnd;
      }).reduce((sum, t) => sum + t.amount, 0);
      
      const previousExpense = transactions.filter(t => {
          const tDate = new Date(t.date);
          tDate.setHours(12, 0, 0, 0); 
          return t.type === TransactionType.EXPENSE && tDate >= prevStart && tDate <= prevEnd;
      }).reduce((sum, t) => sum + t.amount, 0);

      if (previousIncome > 0) incomeGrowthPercent = ((periodIncome - previousIncome) / previousIncome) * 100;
      else if (periodIncome > 0) incomeGrowthPercent = 100; 
      else if (previousIncome === 0 && periodIncome === 0) incomeGrowthPercent = 0;

      if (previousExpense > 0) expenseGrowthPercent = ((periodExpense - previousExpense) / previousExpense) * 100;
      else if (periodExpense > 0) expenseGrowthPercent = 100; 
      else if (previousExpense === 0 && periodExpense === 0) expenseGrowthPercent = 0;
  }

  // --- BUDGET LOGIC (MONTHLY) ---
  const currentMonthKey = getMonthKey(dateRangeStart);
  const currentBudgetPercent = monthlyBudgets[currentMonthKey] ?? 50; // Default to 50% if not set for this month
  
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      if (val >= 0 && val <= 100) {
          const newBudgets = { ...monthlyBudgets, [currentMonthKey]: val };
          setMonthlyBudgets(newBudgets);
          if (user) {
              localStorage.setItem(`money_mind_monthly_budgets_${user.username}`, JSON.stringify(newBudgets));
          }
      }
  };

  // Label for current budget period
  const getBudgetPeriodLabel = () => {
    if (!dateRangeStart) return 'Tất cả thời gian';
    const month = dateRangeStart.getMonth() + 1;
    const year = dateRangeStart.getFullYear();
    return `Tháng ${month}/${year}`;
  };

  const budgetAmount = periodIncome > 0 ? periodIncome * (currentBudgetPercent / 100) : 0;
  const budgetUsagePercent = budgetAmount > 0 ? (periodExpense / budgetAmount) * 100 : 0;
  const isOverBudget = periodExpense > budgetAmount;
  const budgetRemaining = Math.max(0, budgetAmount - periodExpense);
  const budgetOverAmount = Math.max(0, periodExpense - budgetAmount);

  // Determine progress bar color
  let progressColor = "bg-primary-600 dark:bg-primary-500";
  if (budgetUsagePercent > 100) progressColor = "bg-red-500";
  else if (budgetUsagePercent > 80) progressColor = "bg-yellow-500";
  else if (budgetUsagePercent < 50) progressColor = "bg-green-500";


  const getFilterLabel = () => {
      switch(filterType) {
          case 'THIS_WEEK': return 'Tuần này';
          case 'LAST_WEEK': return 'Tuần trước';
          case 'THIS_MONTH': return 'Tháng này';
          case 'LAST_MONTH': return 'Tháng trước';
          case 'ALL': return 'Tất cả';
          case 'CUSTOM': 
            if (customStartDate && customEndDate) return `${formatDateDisplay(customStartDate)} - ${formatDateDisplay(customEndDate)}`;
            if (customStartDate) return `Từ ${formatDateDisplay(customStartDate)}`;
            if (customEndDate) return `Đến ${formatDateDisplay(customEndDate)}`;
            return 'Tùy chỉnh';
          default: return '';
      }
  }
  
  const openingBalanceDateLabel = dateRangeStart ? formatDateDisplay(dateRangeStart.toISOString().split('T')[0]) : '';
  const closingBalanceDateLabel = dateRangeEnd ? formatDateDisplay(dateRangeEnd.toISOString().split('T')[0]) : 'nay';

  const FilterControl = () => (
      <div className="flex flex-col gap-2">
        <div className="bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center transition-colors">
            <Filter className="w-4 h-4 text-gray-400 ml-2" />
            <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="text-sm font-medium text-gray-700 dark:text-gray-200 bg-transparent border-none focus:ring-0 cursor-pointer py-1 pl-2 pr-8 outline-none"
            >
                <option value="THIS_WEEK" className="dark:bg-gray-800">Tuần này</option>
                <option value="LAST_WEEK" className="dark:bg-gray-800">Tuần trước</option>
                <option value="THIS_MONTH" className="dark:bg-gray-800">Tháng này</option>
                <option value="LAST_MONTH" className="dark:bg-gray-800">Tháng trước</option>
                <option value="CUSTOM" className="dark:bg-gray-800">Tùy chỉnh...</option>
                <option value="ALL" className="dark:bg-gray-800">Tất cả</option>
            </select>
        </div>
        {filterType === 'CUSTOM' && (
            <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                <span className="text-xs text-gray-500 dark:text-gray-400">Từ:</span>
                <input 
                    type="date" 
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-xs focus:ring-primary-500 outline-none"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400"><ArrowRight className="w-3 h-3" /></span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Đến:</span>
                <input 
                    type="date" 
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-xs focus:ring-primary-500 outline-none"
                />
            </div>
        )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 lg:pb-0 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      
      {/* Header - Mobile */}
      <header className="bg-white dark:bg-gray-800 sticky top-0 z-30 px-6 py-4 shadow-sm dark:shadow-none dark:border-b dark:border-gray-700 lg:hidden flex justify-between items-center transition-colors">
        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold text-xl">
           <Wallet className="w-6 h-6" /> MoneyMind
        </div>
        <div className="flex items-center gap-3">
             <div className="flex flex-col items-end mr-2">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">Tổng tài sản</span>
                <div className="text-sm font-bold text-gray-800 dark:text-gray-100">
                    <InteractiveBalance amount={globalBalance} />
                </div>
            </div>
            <ThemeSelector currentThemeHex={themeHex} onThemeChange={handleThemeChange} isDarkMode={isDarkMode} onToggleDarkMode={handleToggleDarkMode} />
            <button onClick={handleLogout} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <LogOut className="w-4 h-4" />
            </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="w-full px-4 md:px-6 lg:px-8 mx-auto md:py-6 lg:grid lg:grid-cols-[280px_1fr] gap-8">
        
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-none dark:border dark:border-gray-700 h-[calc(100vh-3rem)] sticky top-6 p-6 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold text-2xl">
                <Wallet className="w-8 h-8" /> MoneyMind
            </div>
            <ThemeSelector currentThemeHex={themeHex} onThemeChange={handleThemeChange} isDarkMode={isDarkMode} onToggleDarkMode={handleToggleDarkMode} />
          </div>
          <p className="text-xs text-gray-400 mb-8 ml-10">Xin chào, {user.name}</p>
          
          <nav className="flex-1 space-y-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'dashboard' ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <LayoutDashboard className="w-5 h-5" /> Tổng quan
            </button>
            <button 
               onClick={() => setActiveTab('history')}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'history' ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <History className="w-5 h-5" /> Lịch sử
            </button>
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700 space-y-4">
             <div>
                 <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tổng tài sản</div>
                 <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 break-words">
                     <InteractiveBalance amount={globalBalance} />
                 </div>
             </div>
             <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
             >
                <LogOut className="w-4 h-4" /> Đăng xuất
             </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="p-0 space-y-6">
          
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Báo cáo thu chi</h1>
                    <div className="self-end sm:self-auto">
                        <FilterControl />
                    </div>
                </div>

                {/* Balance Cards - 4 Columns */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                     <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm dark:shadow-none dark:border dark:border-gray-700 border border-gray-100 relative transition-colors">
                        <div className="absolute top-0 right-0 p-2 opacity-5 overflow-hidden pointer-events-none">
                             <Landmark className="w-20 h-20 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Số dư đầu kỳ</div>
                        <div className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-200">
                             <InteractiveBalance amount={openingBalance} />
                        </div>
                         {filterType !== 'ALL' && <div className="text-xs text-gray-400 mt-1">Trước {openingBalanceDateLabel}</div>}
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm dark:shadow-none dark:border dark:border-gray-700 border border-gray-100 relative transition-colors">
                        <div className="absolute top-0 right-0 p-2 opacity-5 overflow-hidden pointer-events-none">
                             <Wallet className="w-20 h-20 text-green-600" />
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Thu nhập</div>
                        <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                             <InteractiveBalance amount={periodIncome} />
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs">
                           <span className="text-gray-400">{getFilterLabel()}</span>
                           {incomeGrowthPercent !== null && (
                               <div className={`flex items-center px-1.5 py-0.5 rounded-full ${incomeGrowthPercent >= 0 ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                                   {incomeGrowthPercent > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : incomeGrowthPercent < 0 ? <TrendingDown className="w-3 h-3 mr-1" /> : <Minus className="w-3 h-3 mr-1" />}
                                   <span className="font-semibold">{Math.abs(Math.round(incomeGrowthPercent))}%</span>
                               </div>
                           )}
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm dark:shadow-none dark:border dark:border-gray-700 border border-gray-100 relative transition-colors">
                         <div className="absolute top-0 right-0 p-2 opacity-5 overflow-hidden pointer-events-none">
                             <Wallet className="w-20 h-20 text-red-600" />
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Chi tiêu</div>
                        <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                             <InteractiveBalance amount={periodExpense} />
                        </div>
                         <div className="flex items-center gap-2 text-xs mt-1">
                           <span className="text-gray-400">{getFilterLabel()}</span>
                           {expenseGrowthPercent !== null && (
                               <div className={`flex items-center px-1.5 py-0.5 rounded-full ${expenseGrowthPercent > 0 ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' : expenseGrowthPercent < 0 ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-50 text-gray-700'}`}>
                                   {expenseGrowthPercent > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : expenseGrowthPercent < 0 ? <TrendingDown className="w-3 h-3 mr-1" /> : <Minus className="w-3 h-3 mr-1" />}
                                   <span className="font-semibold">{Math.abs(Math.round(expenseGrowthPercent))}%</span>
                               </div>
                           )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm dark:shadow-none dark:border dark:border-gray-700 border border-gray-100 relative transition-colors">
                         <div className="absolute top-0 right-0 p-2 opacity-5 overflow-hidden pointer-events-none">
                             <PiggyBank className="w-20 h-20 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Số dư cuối kỳ</div>
                        <div className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">
                             <InteractiveBalance amount={closingBalance} />
                        </div>
                         {filterType !== 'ALL' && <div className="text-xs text-gray-400 mt-1">Đến {closingBalanceDateLabel}</div>}
                    </div>
                </div>

                {/* --- BUDGET CARD --- */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-none dark:border dark:border-gray-700 border border-gray-100 p-6 relative overflow-hidden transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Target className="w-32 h-32 text-gray-600 dark:text-gray-400" />
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                Ngân sách ({getBudgetPeriodLabel()})
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Quản lý giới hạn chi tiêu dựa trên thu nhập thực tế</p>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-600">
                             <span className="text-xs font-medium text-gray-500 dark:text-gray-300">Giới hạn:</span>
                             <div className="flex items-center gap-1">
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="100" 
                                    value={currentBudgetPercent}
                                    onChange={handleBudgetChange}
                                    className="w-12 text-center bg-transparent border-b border-gray-300 dark:border-gray-500 focus:border-primary-500 outline-none text-sm font-bold text-gray-800 dark:text-white"
                                />
                                <span className="text-sm font-bold text-gray-600 dark:text-gray-300">%</span>
                             </div>
                             <span className="text-xs text-gray-400">thu nhập</span>
                        </div>
                    </div>

                    <div className="relative z-10">
                        {periodIncome > 0 ? (
                            <>
                                <div className="flex justify-between text-sm mb-2 font-medium">
                                    <span className={isOverBudget ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-300"}>
                                        Đã chi: {formatCurrency(periodExpense)}
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Ngân sách: {formatCurrency(budgetAmount)}
                                    </span>
                                </div>
                                
                                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                                    <div 
                                        className={`h-full ${progressColor} transition-all duration-500 ease-out rounded-full relative`}
                                        style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
                                    >
                                        {/* Stripe animation effect */}
                                        <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}></div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-xs sm:text-sm">
                                    <div className={`flex items-center gap-1.5 font-bold ${isOverBudget ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                                        {isOverBudget ? <AlertTriangle className="w-4 h-4" /> : <PiggyBank className="w-4 h-4" />}
                                        {isOverBudget 
                                            ? `Vượt ngân sách ${budgetUsagePercent > 0 ? ((periodExpense - budgetAmount) / budgetAmount * 100).toFixed(1) : 0}% (${formatCurrency(budgetOverAmount)})`
                                            : `Còn lại ${formatCurrency(budgetRemaining)}`
                                        }
                                    </div>
                                    <div className="text-gray-400 dark:text-gray-500 italic">
                                        {budgetUsagePercent.toFixed(1)}% đã sử dụng
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-4 text-gray-400 dark:text-gray-500 text-sm">
                                Cần có thu nhập trong kỳ này để tính toán ngân sách.
                            </div>
                        )}
                    </div>
                </div>

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm dark:shadow-none dark:border dark:border-gray-700 border border-gray-100 flex flex-col transition-colors">
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex justify-between items-center">
                            <span>Phân bổ chi tiêu</span>
                            <span className="text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded truncate max-w-[150px]">{getFilterLabel()}</span>
                        </h3>
                        <div className="flex-1 min-h-[300px]">
                            <ExpensePieChart 
                                transactions={filteredTransactions} 
                                customColors={categoryColors}
                                onColorChange={handleColorChange}
                            />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm dark:shadow-none dark:border dark:border-gray-700 border border-gray-100 flex flex-col transition-colors">
                         <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex justify-between items-center">
                            <span>Phân bổ thu nhập</span>
                            <span className="text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded truncate max-w-[150px]">{getFilterLabel()}</span>
                        </h3>
                        <div className="flex-1 min-h-[300px]">
                            <IncomePieChart 
                                transactions={filteredTransactions} 
                                customColors={categoryColors}
                                onColorChange={handleColorChange}
                            />
                        </div>
                    </div>
                </div>

                 {/* AI Advisor Section */}
                 <AIAdvisor transactions={filteredTransactions.length > 0 ? filteredTransactions : transactions.slice(0, 50)} />

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm dark:shadow-none dark:border dark:border-gray-700 border border-gray-100 transition-colors">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 dark:text-gray-200">Giao dịch ({getFilterLabel()})</h3>
                        <button onClick={() => setActiveTab('history')} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">Xem tất cả lịch sử</button>
                    </div>
                    <TransactionList 
                        transactions={filteredTransactions.slice(0, 5)} 
                        onDelete={promptDeleteTransaction} 
                        onEdit={handleEditTransaction}
                    />
                </div>
            </>
          )}

          {activeTab === 'history' && (
             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm dark:shadow-none dark:border dark:border-gray-700 border border-gray-100 min-h-[80vh] transition-colors">
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Lịch sử giao dịch</h2>
                        <div className="self-start sm:self-auto w-full sm:w-auto">
                            <FilterControl />
                        </div>
                    </div>

                    {/* Opening & Closing Balance Summary for History Tab */}
                    {filterType !== 'ALL' && (
                         <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
                            <div className="flex items-center gap-2">
                                <Landmark className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <span>Số dư đầu kỳ: <span className="font-bold text-gray-800 dark:text-gray-100">{formatCurrency(openingBalance)}</span></span>
                            </div>
                            <span className="hidden sm:inline text-gray-300 dark:text-gray-600 mx-2">|</span>
                            <div className="flex items-center gap-2">
                                <PiggyBank className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <span>Số dư cuối kỳ: <span className="font-bold text-primary-700 dark:text-primary-400">{formatCurrency(closingBalance)}</span></span>
                            </div>
                         </div>
                    )}
                </div>
                
                <TransactionList 
                    transactions={filteredTransactions} 
                    onDelete={promptDeleteTransaction} 
                    onEdit={handleEditTransaction}
                />
             </div>
          )}

        </main>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => {
            setEditingTransaction(null);
            setShowAddModal(true);
        }}
        className="fixed right-6 bottom-24 lg:bottom-10 lg:right-10 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-xl dark:shadow-gray-900/50 transition-all flex items-center justify-center z-40 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800"
        title="Thêm giao dịch nhanh"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-3 flex justify-center gap-24 z-30 transition-colors">
        <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 text-xs font-medium ${activeTab === 'dashboard' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}
        >
            <LayoutDashboard className="w-6 h-6" />
            Báo cáo
        </button>
        <button 
             onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 text-xs font-medium ${activeTab === 'history' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}
        >
            <History className="w-6 h-6" />
            Lịch sử
        </button>
      </div>

      {/* Add Transaction Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-md">
                <TransactionForm 
                    onAddTransaction={addTransaction}
                    onUpdateTransaction={updateTransaction}
                    initialData={editingTransaction}
                    onClose={handleCloseModal}
                />
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {transactionToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Xác nhận xóa</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Bạn có chắc chắn muốn xóa giao dịch này không? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setTransactionToDelete(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg font-medium shadow-md transition-colors"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;