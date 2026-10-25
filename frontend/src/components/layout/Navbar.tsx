import React from 'react';
import {
  Calculator,
  GitCompare,
  TrendingDown,
  ArrowRightLeft,
  UserCheck,
  Percent,
  Bookmark,
  DollarSign,
  IndianRupee,
} from 'lucide-react';
import { CurrencyType } from '../../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currency: CurrencyType;
  setCurrency: (c: CurrencyType) => void;
  onOpenSaved: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  onOpenSaved,
}) => {
  const tabs = [
    { id: 'emi', label: 'EMI Calculator', icon: Calculator },
    { id: 'comparison', label: 'Compare Loans', icon: GitCompare },
    { id: 'prepayment', label: 'Prepayment Simulator', icon: TrendingDown },
    { id: 'transfer', label: 'Balance Transfer', icon: ArrowRightLeft },
    { id: 'eligibility', label: 'Loan Eligibility', icon: UserCheck },
    { id: 'floating', label: 'Fixed vs Floating', icon: Percent },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('emi')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black bg-gradient-to-r from-emerald-600 to-teal-800 bg-clip-text text-transparent">
                LoanPro
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                PRO ENGINE
              </span>
            </div>
          </div>

          {/* Controls: Currency switch & Saved calculations */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Currency switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setCurrency('INR')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  currency === 'INR'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Indian Rupee (₹)"
              >
                <IndianRupee className="w-3.5 h-3.5" />
                <span>INR</span>
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  currency === 'USD'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="US Dollar ($)"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>USD</span>
              </button>
            </div>

            {/* Saved calculations modal trigger */}
            <button
              onClick={onOpenSaved}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition"
            >
              <Bookmark className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Saved Calculations</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none border-t border-slate-100 pt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border-b-2 border-emerald-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
