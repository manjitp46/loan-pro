import React, { useState } from 'react';
import { ArrowRightLeft, CheckCircle, AlertTriangle, XCircle, TrendingDown, Clock, ShieldCheck, Share2 } from 'lucide-react';
import { BalanceTransferResult, CurrencyType } from '../../types';
import { ClientCalculatorEngine } from '../../utils/calculatorEngine';
import { formatCurrency, formatPercent, formatTenure, getCurrencySymbol } from '../../utils/formatters';

interface TransferProps {
  currency: CurrencyType;
  onSaveShare: (payload: any) => void;
}

export const BalanceTransfer: React.FC<TransferProps> = ({ currency, onSaveShare }) => {
  const [outstandingBalance, setOutstandingBalance] = useState<number>(4000000);
  const [currentRate, setCurrentRate] = useState<number>(9.5);
  const [remainingTenureMonths, setRemainingTenureMonths] = useState<number>(180); // 15 years

  // New Loan
  const [newRate, setNewRate] = useState<number>(8.4);
  const [newTenureMonths, setNewTenureMonths] = useState<number>(180);
  const [newProcessingFeePercent, setNewProcessingFeePercent] = useState<number>(0.5);
  const [foreclosurePenaltyPercent, setForeclosurePenaltyPercent] = useState<number>(0);

  const result: BalanceTransferResult = ClientCalculatorEngine.calculateBalanceTransfer(
    outstandingBalance,
    currentRate,
    remainingTenureMonths,
    newRate,
    newTenureMonths,
    newProcessingFeePercent,
    foreclosurePenaltyPercent
  );

  const handleShare = () => {
    onSaveShare({
      title: `Balance Transfer: Save ${formatCurrency(result.netSavings, currency)}`,
      calculatorType: 'transfer',
      loanType: 'home',
      inputData: {
        outstandingBalance,
        currentRate,
        remainingTenureMonths,
        newRate,
        newTenureMonths,
        newProcessingFeePercent,
      },
      resultSummary: {
        netSavings: result.netSavings,
        monthlyEmiDiff: result.monthlyEmiDiff,
        breakevenMonths: result.breakevenMonths,
        recommendation: result.recommendation,
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Loan Balance Transfer & Refinance Calculator</h2>
          <p className="text-xs text-slate-500 mt-1">
            Determine whether switching your existing loan to a lower rate lender will yield real net savings after all switching costs.
          </p>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition"
        >
          <Share2 className="w-4 h-4 text-emerald-600" />
          <span>Share Analysis</span>
        </button>
      </div>

      {/* Main Comparison Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input Columns for Current Loan vs New Loan */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Existing Loan Box */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Current Existing Loan</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">Old Lender</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Outstanding Principal</label>
                <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 mt-1">
                  <span className="font-bold text-slate-400 mr-1">{getCurrencySymbol(currency)}</span>
                  <input
                    type="number"
                    value={outstandingBalance}
                    onChange={(e) => setOutstandingBalance(Number(e.target.value))}
                    className="w-full text-sm font-bold bg-transparent text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Current Interest Rate (% p.a.)</label>
                <input
                  type="number"
                  step="0.1"
                  value={currentRate}
                  onChange={(e) => setCurrentRate(Number(e.target.value))}
                  className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 mt-1 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Remaining Tenure (Months)</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={remainingTenureMonths}
                    onChange={(e) => setRemainingTenureMonths(Number(e.target.value))}
                    className="w-24 text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none"
                  />
                  <span className="text-xs text-slate-500 font-medium">({formatTenure(remainingTenureMonths)})</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Foreclosure Penalty (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={foreclosurePenaltyPercent}
                  onChange={(e) => setForeclosurePenaltyPercent(Number(e.target.value))}
                  className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 mt-1 outline-none"
                />
              </div>
            </div>

            {/* New Loan Box */}
            <div className="bg-white p-5 rounded-2xl border border-emerald-300 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">New Loan Proposal</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">New Lender</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">New Interest Rate (% p.a.)</label>
                <input
                  type="number"
                  step="0.05"
                  value={newRate}
                  onChange={(e) => setNewRate(Number(e.target.value))}
                  className="w-full text-sm font-bold bg-emerald-50/50 border border-emerald-300 rounded-lg px-2.5 py-1.5 mt-1 text-emerald-900 outline-none"
                />
                <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                  {(currentRate - newRate).toFixed(2)}% rate reduction
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">New Tenure (Months)</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={newTenureMonths}
                    onChange={(e) => setNewTenureMonths(Number(e.target.value))}
                    className="w-24 text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none"
                  />
                  <span className="text-xs text-slate-500 font-medium">({formatTenure(newTenureMonths)})</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">New Processing Fee (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newProcessingFeePercent}
                  onChange={(e) => setNewProcessingFeePercent(Number(e.target.value))}
                  className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 mt-1 outline-none"
                />
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Upfront Fee: {formatCurrency(result.newLoan.processingFee, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Decision and Savings Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            {/* Recommendation Status Badge */}
            <div
              className={`p-4 rounded-xl flex items-start gap-3 border ${
                result.recommendation === 'highly_recommended'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : result.recommendation === 'moderately_recommended'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {result.recommendation === 'highly_recommended' && (
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              )}
              {result.recommendation === 'moderately_recommended' && (
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              {result.recommendation === 'not_recommended' && (
                <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              )}

              <div>
                <h4 className="text-xs font-black uppercase tracking-wider">
                  {result.recommendation === 'highly_recommended'
                    ? 'Highly Recommended to Transfer'
                    : result.recommendation === 'moderately_recommended'
                    ? 'Moderate Financial Advantage'
                    : 'Transfer Not Recommended'}
                </h4>
                <p className="text-xs mt-1 opacity-90">{result.recommendationReason}</p>
              </div>
            </div>

            {/* Savings Highlights */}
            <div className="space-y-3">
              <div className="bg-slate-900 text-white p-5 rounded-xl shadow-md">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                  Net Lifetime Savings
                </span>
                <div className="text-3xl font-black mt-1">
                  {formatCurrency(result.netSavings, currency)}
                </div>
                <p className="text-xs text-slate-400 mt-1">Net interest saved after deducting all processing fees</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 font-medium">Monthly EMI Savings</span>
                  <div className="text-lg font-bold text-emerald-700 mt-0.5">
                    {result.monthlyEmiDiff >= 0
                      ? `+${formatCurrency(result.monthlyEmiDiff, currency)}/mo`
                      : `-${formatCurrency(Math.abs(result.monthlyEmiDiff), currency)}/mo`}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 font-medium">Breakeven Period</span>
                  <div className="text-lg font-bold text-slate-800 mt-0.5">
                    {result.breakevenMonths <= 120 ? `${result.breakevenMonths} Months` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Row Comparisons */}
            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Current Monthly EMI</span>
                <span className="font-bold text-slate-700">{formatCurrency(result.currentLoan.monthlyEmi, currency)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">New Monthly EMI</span>
                <span className="font-bold text-emerald-700">{formatCurrency(result.newLoan.monthlyEmi, currency)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Total Switching Fees</span>
                <span className="font-bold text-rose-600">{formatCurrency(result.newLoan.totalTransferCost, currency)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Gross Interest Saved</span>
                <span className="font-bold text-slate-900">{formatCurrency(result.interestSaved, currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
