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
  siteTitle?: string;
  brandTheme?: string;
}

const THEME_CLASSES: Record<string, {
  logoGradient: string;
  titleGradient: string;
  badge: string;
  activeTab: string;
  activeIcon: string;
  currencyActive: string;
  bookmarkIcon: string;
}> = {
  emerald: {
    logoGradient: 'from-emerald-500 to-teal-700 shadow-emerald-500/20',
    titleGradient: 'from-emerald-600 to-teal-800',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    activeTab: 'bg-emerald-50 text-emerald-800 border-b-2 border-emerald-600',
    activeIcon: 'text-emerald-600',
    currencyActive: 'text-emerald-700',
    bookmarkIcon: 'text-emerald-600',
  },
  blue: {
    logoGradient: 'from-blue-500 to-cyan-700 shadow-blue-500/20',
    titleGradient: 'from-blue-600 to-cyan-800',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    activeTab: 'bg-blue-50 text-blue-800 border-b-2 border-blue-600',
    activeIcon: 'text-blue-600',
    currencyActive: 'text-blue-700',
    bookmarkIcon: 'text-blue-600',
  },
  indigo: {
    logoGradient: 'from-indigo-500 to-violet-700 shadow-indigo-500/20',
    titleGradient: 'from-indigo-600 to-violet-800',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    activeTab: 'bg-indigo-50 text-indigo-800 border-b-2 border-indigo-600',
    activeIcon: 'text-indigo-600',
    currencyActive: 'text-indigo-700',
    bookmarkIcon: 'text-indigo-600',
  },
  violet: {
    logoGradient: 'from-violet-500 to-fuchsia-700 shadow-violet-500/20',
    titleGradient: 'from-violet-600 to-fuchsia-800',
    badge: 'bg-violet-100 text-violet-800 border-violet-200',
    activeTab: 'bg-violet-50 text-violet-800 border-b-2 border-violet-600',
    activeIcon: 'text-violet-600',
    currencyActive: 'text-violet-700',
    bookmarkIcon: 'text-violet-600',
  },
  rose: {
    logoGradient: 'from-rose-500 to-pink-700 shadow-rose-500/20',
    titleGradient: 'from-rose-600 to-pink-800',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    activeTab: 'bg-rose-50 text-rose-800 border-b-2 border-rose-600',
    activeIcon: 'text-rose-600',
    currencyActive: 'text-rose-700',
    bookmarkIcon: 'text-rose-600',
  },
  amber: {
    logoGradient: 'from-amber-500 to-orange-700 shadow-amber-500/20',
    titleGradient: 'from-amber-600 to-orange-800',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    activeTab: 'bg-amber-50 text-amber-800 border-b-2 border-amber-600',
    activeIcon: 'text-amber-600',
    currencyActive: 'text-amber-700',
    bookmarkIcon: 'text-amber-600',
  },
};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  onOpenSaved,
  siteTitle,
  brandTheme = 'emerald',
}) => {
  const currentTheme = THEME_CLASSES[brandTheme] || THEME_CLASSES.emerald;
  const brandName = siteTitle ? siteTitle.split(' - ')[0] : 'LoanPro';

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
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentTheme.logoGradient} flex items-center justify-center text-white shadow-md`}>
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <span className={`text-xl font-black bg-gradient-to-r ${currentTheme.titleGradient} bg-clip-text text-transparent`}>
                {brandName}
              </span>
              <span className={`hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${currentTheme.badge}`}>
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
                    ? `bg-white ${currentTheme.currencyActive} shadow-xs`
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
                    ? `bg-white ${currentTheme.currencyActive} shadow-xs`
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
              <Bookmark className={`w-4 h-4 ${currentTheme.bookmarkIcon}`} />
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
                    ? currentTheme.activeTab
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? currentTheme.activeIcon : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
