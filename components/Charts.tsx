import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction, TransactionType } from '../types';

interface Props {
  transactions: Transaction[];
  customColors: Record<string, string>;
  onColorChange: (category: string, color: string) => void;
}

const DEFAULT_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#64748b', '#06b6d4', '#84cc16'];

// Helper for rendering percentage label inside the pie
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Only show label if the slice is bigger than 5%
  if (percent < 0.05) return null;

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomPieChart = ({ 
    data, 
    emptyMessage,
    customColors,
    onColorChange 
}: { 
    data: { name: string; value: number }[], 
    emptyMessage: string,
    customColors: Record<string, string>,
    onColorChange: (category: string, color: string) => void;
}) => {
  if (data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">{emptyMessage}</div>;

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const getColor = (name: string, index: number) => {
      return customColors[name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  };

  return (
    <div className="w-full h-full min-h-[300px] flex flex-col">
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              innerRadius={40}
              dataKey="value"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.name, index)} strokeWidth={2} className="stroke-white dark:stroke-gray-800" />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Detailed Legend with Percentage & Color Picker */}
      <div className="mt-4 space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
        {data.map((entry, index) => {
            const percent = ((entry.value / total) * 100).toFixed(1);
            const currentColor = getColor(entry.name, index);

            return (
                <div key={index} className="flex items-center justify-between text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-1.5 rounded transition-colors group">
                    <div className="flex items-center gap-2">
                        {/* Custom Color Picker input styled as a circle */}
                        <div className="relative w-4 h-4 overflow-hidden rounded-full shadow-sm ring-1 ring-gray-200 dark:ring-gray-600 cursor-pointer hover:scale-110 transition-transform">
                            <input 
                                type="color" 
                                value={currentColor}
                                onChange={(e) => onColorChange(entry.name, e.target.value)}
                                className="absolute -top-2 -left-2 w-8 h-8 cursor-pointer p-0 border-0"
                                title="Nhấn để đổi màu"
                            />
                        </div>
                        <span className="font-medium truncate max-w-[100px] sm:max-w-[140px]">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-gray-500 dark:text-gray-400">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(entry.value)}</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded min-w-[40px] text-center">{percent}%</span>
                    </div>
                </div>
            );
        })}
      </div>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-2 italic">* Nhấn vào chấm tròn màu để thay đổi màu sắc</p>
    </div>
  );
};

export const ExpensePieChart: React.FC<Props> = ({ transactions, customColors, onColorChange }) => {
  const expenseData = transactions
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => {
      const existing = acc.find((item) => item.name === t.category);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({ name: t.category, value: t.amount });
      }
      return acc;
    }, [] as { name: string; value: number }[])
    .sort((a, b) => b.value - a.value);

  return <CustomPieChart 
            data={expenseData} 
            emptyMessage="Chưa có dữ liệu chi tiêu" 
            customColors={customColors}
            onColorChange={onColorChange}
         />;
};

export const IncomePieChart: React.FC<Props> = ({ transactions, customColors, onColorChange }) => {
    const incomeData = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((acc, t) => {
        const existing = acc.find((item) => item.name === t.category);
        if (existing) {
          existing.value += t.amount;
        } else {
          acc.push({ name: t.category, value: t.amount });
        }
        return acc;
      }, [] as { name: string; value: number }[])
      .sort((a, b) => b.value - a.value);
  
    return <CustomPieChart 
            data={incomeData} 
            emptyMessage="Chưa có dữ liệu thu nhập" 
            customColors={customColors}
            onColorChange={onColorChange}
        />;
};