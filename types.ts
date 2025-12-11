
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum Category {
  FOOD = 'Ăn uống',
  TRANSPORT = 'Di chuyển',
  SHOPPING = 'Mua sắm',
  BILLS = 'Hóa đơn',
  ENTERTAINMENT = 'Giải trí',
  HEALTH = 'Sức khỏe',
  EDUCATION = 'Giáo dục',
  SALARY = 'Lương',
  BONUS = 'Thưởng',
  INVESTMENT = 'Đầu tư',
  GIFT = 'Quà tặng',
  OTHER = 'Khác'
}

// Define specific categories for Expense
export const EXPENSE_CATEGORIES = [
  Category.FOOD,
  Category.TRANSPORT,
  Category.SHOPPING,
  Category.BILLS,
  Category.ENTERTAINMENT,
  Category.HEALTH,
  Category.EDUCATION,
  Category.OTHER
];

// Define specific categories for Income
export const INCOME_CATEGORIES = [
  Category.SALARY,
  Category.BONUS,
  Category.INVESTMENT,
  Category.GIFT,
  Category.OTHER
];

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category | string;
  date: string;
  note: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface User {
  username: string;
  name: string;
}
