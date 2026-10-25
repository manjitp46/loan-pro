import React, { useState } from 'react';
import { UserCheck, ShieldAlert, CheckCircle2, AlertCircle, Info, Sparkles, Share2 } from 'lucide-react';
import { CurrencyType, LoanEligibilityResult, LoanType } from '../../types';
import { ClientCalculatorEngine } from '../../utils/calculatorEngine';
import { formatCurrency, formatPercent, getCurrencySymbol } from '../../utils/formatters';

interface EligibilityProps {
  currency: CurrencyType;
  onSaveShare: (payload: any) => void;
}

export const EligibilityCalculator: React.FC<EligibilityProps> = ({ currency, onSaveShare }) => {
  const [loanType, setLoanType] = useState<LoanType>('home');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(100000);
  const [existingEmi, setExistingEmi] = useState<number>(15000);
  const [annualRate, setAnnualRate] = useState<number>(8.5);
  const [tenureYears, setTenureYears] = useState<number>(20);
  const [foirPercent, setFoirPercent] = useState<number>(50);

  const result: LoanEligibilityResult = ClientCalculatorEngine.calculateEligibility(
    monthlyIncome,
    existingEmi,
    annualRate,
    tenureYears,
    foirPercent
  );

  const handleShare = () => {
    onSaveShare({
      title: `Loan Eligibility Check: Eligible for ${formatCurrency(result.eligibleMaxLoanAmount, currency)}`,
      calculatorType: 'eligibility',
      loanType,
      inputData: {
        monthlyIncome,
        existingEmi,
        annualRate,
        tenureYears,
        foirPercent,
      },
      resultSummary: {
        eligibleMaxLoanAmount: result.eligibleMaxLoanAmount,
        availableMonthlyEmi: result.availableMonthlyEmi,
        eligibilityStatus: result.eligibilityStatus,
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Borrower Loan Eligibility Calculator</h2>
          <p className="text-xs text-slate-500 mt-1">
            Determine the maximum loan amount banks will approve based on your Fixed Obligation to Income Ratio (FOIR).
          </p>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition"
        >
          <Share2 className="w-4 h-4 text-emerald-600" />
          <span>Share Eligibility</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Inputs */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3">
            Income & Financial Obligations
          </h3>

          {/* Monthly Income */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Net Monthly Take-Home Income
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1">
                <span className="font-bold text-slate-400 mr-1">{getCurrencySymbol(currency)}</span>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value)))}
                  className="w-32 text-right text-sm font-bold bg-transparent text-slate-900 outline-none"
                />
              </div>
            </div>

            <input
              type="range"
              min="15000"
              max={currency === 'INR' ? '1000000' : '50000'}
              step="5000"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Existing EMIs */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Existing Monthly Obligations (Car, Personal, Cards)
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1">
                <span className="font-bold text-slate-400 mr-1">{getCurrencySymbol(currency)}</span>
                <input
                  type="number"
                  value={existingEmi}
                  onChange={(e) => setExistingEmi(Math.max(0, Number(e.target.value)))}
                  className="w-28 text-right text-sm font-bold bg-transparent text-slate-900 outline-none"
                />
              </div>
            </div>

            <input
              type="range"
              min="0"
              max={monthlyIncome}
              step="2000"
              value={existingEmi}
              onChange={(e) => setExistingEmi(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Rate & Tenure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">Expected Interest Rate (% p.a.)</label>
              <input
                type="number"
                step="0.1"
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 mt-1 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">Desired Tenure (Years)</label>
              <input
                type="number"
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 mt-1 outline-none"
              />
            </div>
          </div>

          {/* FOIR Slider */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700 uppercase">Bank FOIR Limit</span>
              <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">{foirPercent}%</span>
            </div>
            <input
              type="range"
              min="40"
              max="65"
              step="5"
              value={foirPercent}
              onChange={(e) => setFoirPercent(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Most tier-1 banks allow 50% for standard salaries; up to 60-65% for high-income or joint home loans.
            </p>
          </div>
        </div>

        {/* Right: Eligibility Results */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            {/* Status Indicator */}
            <div
              className={`p-4 rounded-xl flex items-center gap-3 border ${
                result.eligibilityStatus === 'eligible'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : result.eligibilityStatus === 'borderline'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {result.eligibilityStatus === 'eligible' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              )}
              {result.eligibilityStatus === 'borderline' && (
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              )}
              {result.eligibilityStatus === 'ineligible' && (
                <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
              )}

              <div>
                <span className="text-xs font-black uppercase tracking-wider block">
                  {result.eligibilityStatus === 'eligible'
                    ? 'Qualified for Loan'
                    : result.eligibilityStatus === 'borderline'
                    ? 'Tight Debt Capacity'
                    : 'Exceeds FOIR Limit'}
                </span>
                <span className="text-xs opacity-90">
                  {result.availableMonthlyEmi > 0
                    ? `Capacity for ${formatCurrency(result.availableMonthlyEmi, currency)}/mo EMI`
                    : 'Zero additional debt capacity remaining'}
                </span>
              </div>
            </div>

            {/* Main Result Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xl">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                Max Eligible Loan Amount
              </span>
              <div className="text-3xl sm:text-4xl font-black mt-2">
                {formatCurrency(result.eligibleMaxLoanAmount, currency)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Estimated maximum loan disbursal based on your net income
              </p>

              <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-400">Allowable New EMI</span>
                  <div className="text-base font-bold text-white mt-0.5">
                    {formatCurrency(result.availableMonthlyEmi, currency)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Disposable Income</span>
                  <div className="text-base font-bold text-white mt-0.5">
                    {formatCurrency(result.disposableIncome, currency)}
                  </div>
                </div>
              </div>
            </div>

            {/* Suggestions Box */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tips to Maximize Loan Approval</span>
              </span>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {result.suggestions.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
