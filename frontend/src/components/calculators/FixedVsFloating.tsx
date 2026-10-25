import React, { useState } from 'react';
import { Plus, Trash2, Percent, TrendingUp, TrendingDown, ArrowRight, Share2 } from 'lucide-react';
import { CurrencyType } from '../../types';
import { ClientCalculatorEngine } from '../../utils/calculatorEngine';
import { formatCurrency, formatPercent, formatTenure } from '../../utils/formatters';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

interface FixedVsFloatingProps {
  currency: CurrencyType;
  onSaveShare: (payload: any) => void;
}

interface RatePoint {
  id: string;
  month: number;
  newRate: number;
}

export const FixedVsFloating: React.FC<FixedVsFloatingProps> = ({ currency, onSaveShare }) => {
  const [principal, setPrincipal] = useState<number>(5000000);
  const [fixedRate, setFixedRate] = useState<number>(9.0);
  const [initialFloatingRate, setInitialFloatingRate] = useState<number>(8.25);
  const [tenureYears, setTenureYears] = useState<number>(20);

  const [ratePoints, setRatePoints] = useState<RatePoint[]>([
    { id: '1', month: 24, newRate: 8.75 },
    { id: '2', month: 48, newRate: 9.25 },
    { id: '3', month: 72, newRate: 8.5 },
  ]);

  const addRatePoint = () => {
    const nextMonth = (ratePoints.length + 1) * 24;
    setRatePoints((prev) => [
      ...prev,
      { id: Date.now().toString(), month: nextMonth, newRate: initialFloatingRate + 0.5 },
    ]);
  };

  const removeRatePoint = (id: string) => {
    setRatePoints((prev) => prev.filter((p) => p.id !== id));
  };

  const updateRatePoint = (id: string, field: 'month' | 'newRate', value: number) => {
    setRatePoints((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const tenureMonths = tenureYears * 12;

  // Fixed scenario
  const fixedEmi = ClientCalculatorEngine.calculateEMI(principal, fixedRate, tenureMonths);
  const fixedSchedule = ClientCalculatorEngine.generateAmortization(principal, fixedRate, tenureMonths);
  const fixedTotalInterest = fixedSchedule.monthly.reduce((s, m) => s + m.interest, 0);
  const fixedTotalCost = principal + fixedTotalInterest;

  // Floating scenario
  // Construct rate map
  const rateMap = new Map<number, number>();
  ratePoints.forEach((p) => rateMap.set(p.month, p.newRate));

  let floatingBalance = principal;
  let currentFloatRate = initialFloatingRate;
  let currentFloatEmi = ClientCalculatorEngine.calculateEMI(principal, currentFloatRate, tenureMonths);
  let floatingTotalInterest = 0;

  const chartData: any[] = [];

  for (let m = 1; m <= tenureMonths; m++) {
    if (rateMap.has(m)) {
      currentFloatRate = rateMap.get(m)!;
      const remMonths = tenureMonths - m + 1;
      currentFloatEmi = ClientCalculatorEngine.calculateEMI(floatingBalance, currentFloatRate, remMonths);
    }

    const monthlyRate = currentFloatRate / 12 / 100;
    const interest = floatingBalance * monthlyRate;
    const principalPaid = Math.min(floatingBalance, currentFloatEmi - interest);
    floatingBalance = Math.max(0, floatingBalance - principalPaid);
    floatingTotalInterest += interest;

    if (m % 12 === 0 || m === tenureMonths) {
      const yr = Math.ceil(m / 12);
      chartData.push({
        year: `Yr ${yr}`,
        fixedRate,
        floatingRate: currentFloatRate,
      });
    }
  }

  const floatingTotalCost = principal + floatingTotalInterest;
  const costDiff = floatingTotalCost - fixedTotalCost;

  const handleShare = () => {
    onSaveShare({
      title: `Fixed (${fixedRate}%) vs Floating (${initialFloatingRate}%) Rate Comparison`,
      calculatorType: 'floating',
      loanType: 'home',
      inputData: { principal, fixedRate, initialFloatingRate, tenureYears, ratePoints },
      resultSummary: { fixedTotalCost, floatingTotalCost, costDiff },
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Fixed vs Floating Rate Scenario Simulator</h2>
          <p className="text-xs text-slate-500 mt-1">
            Model interest rate hiking and cooling cycles to evaluate long-term financial exposure.
          </p>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition"
        >
          <Share2 className="w-4 h-4 text-emerald-600" />
          <span>Share Scenario</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input Configuration */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3">
            Base Parameters & Rate Changes
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">Principal</label>
              <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 mt-1">
                <span className="font-bold text-slate-400 mr-1">{currency === 'INR' ? '₹' : '$'}</span>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full text-sm font-bold bg-transparent text-slate-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Fixed Rate (% p.a.)</label>
              <input
                type="number"
                step="0.1"
                value={fixedRate}
                onChange={(e) => setFixedRate(Number(e.target.value))}
                className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 mt-1 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Initial Floating Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={initialFloatingRate}
                onChange={(e) => setInitialFloatingRate(Number(e.target.value))}
                className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 mt-1 outline-none"
              />
            </div>
          </div>

          {/* Rate Change Events */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase">Simulated Rate Revision Events</span>
                <p className="text-[11px] text-slate-500">Scheduled central bank repo rate adjustments over the loan</p>
              </div>
              <button
                onClick={addRatePoint}
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rate Event</span>
              </button>
            </div>

            <div className="space-y-2">
              {ratePoints.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 w-6">#{idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500">At Month:</span>
                    <input
                      type="number"
                      value={p.month}
                      onChange={(e) => updateRatePoint(p.id, 'month', Number(e.target.value))}
                      className="w-16 text-center text-xs font-bold bg-white border border-slate-300 rounded px-1.5 py-1 outline-none"
                    />
                    <span className="text-[11px] text-slate-400 font-medium">({Math.round(p.month / 12)} Yrs)</span>
                  </div>

                  <div className="flex-1 flex items-center gap-1 bg-white border border-slate-300 rounded px-2 py-1">
                    <span className="text-xs text-slate-500">New Rate:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={p.newRate}
                      onChange={(e) => updateRatePoint(p.id, 'newRate', Number(e.target.value))}
                      className="w-16 text-center text-xs font-bold bg-transparent text-slate-800 outline-none"
                    />
                    <span className="text-xs font-bold text-slate-400">%</span>
                  </div>

                  <button
                    onClick={() => removeRatePoint(p.id)}
                    className="text-slate-400 hover:text-rose-500 p-1 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Results Comparison */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3">
              Lifetime Financial Outcome
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-600 block">Fixed Rate ({fixedRate}%)</span>
                <div className="mt-2 space-y-1">
                  <span className="text-[11px] text-slate-400">Fixed Monthly EMI</span>
                  <div className="text-base font-black text-slate-900">{formatCurrency(fixedEmi, currency)}</div>
                  <span className="text-[11px] text-slate-400 block pt-1">Total Interest:</span>
                  <div className="font-bold text-slate-700">{formatCurrency(fixedTotalInterest, currency)}</div>
                </div>
              </div>

              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 block">Floating Scenario</span>
                <div className="mt-2 space-y-1">
                  <span className="text-[11px] text-emerald-700">Final Monthly EMI</span>
                  <div className="text-base font-black text-emerald-950">{formatCurrency(currentFloatEmi, currency)}</div>
                  <span className="text-[11px] text-emerald-700 block pt-1">Total Interest:</span>
                  <div className="font-bold text-emerald-900">{formatCurrency(floatingTotalInterest, currency)}</div>
                </div>
              </div>
            </div>

            {/* Verdict Box */}
            <div
              className={`p-4 rounded-xl text-white ${
                costDiff < 0
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                  : 'bg-gradient-to-r from-amber-600 to-rose-700'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wider opacity-90">Scenario Outcome</span>
              <div className="text-2xl font-black mt-1">
                {costDiff < 0
                  ? `Floating saves ${formatCurrency(Math.abs(costDiff), currency)}`
                  : `Fixed saves ${formatCurrency(costDiff, currency)}`}
              </div>
              <p className="text-xs opacity-90 mt-1">
                {costDiff < 0
                  ? 'Even with rate revisions, the lower initial floating rate provided lower total repayment.'
                  : 'Due to upward interest rate shocks, locking a fixed rate would have been more cost-effective.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
