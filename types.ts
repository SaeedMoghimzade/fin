
export type AssetType = 'BANK' | 'CASH' | 'GOLD' | 'CAR' | 'REAL_ESTATE' | 'OTHER';

export interface Member {
  id: string;
  name: string;
  relation: string;
}

export interface Asset {
  id: string;
  memberId: string;
  name: string;
  type: AssetType;
  amount: number;
  description?: string;
  createdAt: string;
}

export type RepaymentMethod = 'INSTALLMENT' | 'LUMP_SUM';

export interface Installment {
  id: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID';
}

export interface Debt {
  id: string;
  memberId: string;
  name: string;
  totalAmount: number;
  repaymentMethod: RepaymentMethod;
  startDate: string;
  installments: Installment[];
  description?: string;
  createdAt: string;
}

export interface RecurringIncome {
  id: string;
  memberId: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  description?: string;
}

export type AppView = 'DASHBOARD' | 'MEMBERS' | 'ASSETS' | 'DEBTS' | 'INCOME' | 'REPORTS';
