import React, { useState } from 'react';
import { Palette, Check, Settings2, X, Moon, Sun } from 'lucide-react';

export const THEME_PRESETS = [
  { name: 'Chàm (Mặc định)', hex: '#4f46e5' }, // Indigo
  { name: 'Xanh dương', hex: '#2563eb' }, // Blue
  { name: 'Ngọc bích', hex: '#059669' }, // Emerald
  { name: 'Đỏ hồng', hex: '#e11d48' }, // Rose
  { name: 'Hổ phách', hex: '#d97706' }, // Amber
  { name: 'Tím', hex: '#7c3aed' }, // Violet
  { name: 'Đá phiến', hex: '#475569' }, // Slate
  { name: 'Xanh mòng két', hex: '#0d9488' }, // Teal
];

interface Props {
  currentThemeHex: string;
  onThemeChange: (hex: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const ThemeSelector: React.FC<Props> = ({ currentThemeHex, onThemeChange, isDarkMode, onToggleDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/50 rounded-full transition-colors"
        title="Tùy chỉnh giao diện"
      >
        <Palette className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Giao diện
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <div className="mb-5 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Chế độ nền</span>
                <button 
                    onClick={onToggleDarkMode}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-600 shadow-sm border border-gray-200 dark:border-gray-500 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                >
                    {isDarkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                    {isDarkMode ? 'Tối' : 'Sáng'}
                </button>
            </div>

            <div className="mb-2">
                <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2 block">Màu chủ đạo</label>
                <div className="grid grid-cols-4 gap-3 mb-4">
                {THEME_PRESETS.map((theme) => (
                    <button
                    key={theme.hex}
                    onClick={() => onThemeChange(theme.hex)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm border-2 ${
                        currentThemeHex === theme.hex ? 'border-gray-900 dark:border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: theme.hex }}
                    title={theme.name}
                    >
                    {currentThemeHex === theme.hex && <Check className="w-5 h-5 text-white drop-shadow-md" />}
                    </button>
                ))}
                </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
               <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2 block">Màu tùy chỉnh</label>
               <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={currentThemeHex}
                    onChange={(e) => onThemeChange(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <div className="flex-1 text-sm bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 font-mono border border-gray-200 dark:border-gray-700">
                    {currentThemeHex}
                  </div>
               </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSelector;