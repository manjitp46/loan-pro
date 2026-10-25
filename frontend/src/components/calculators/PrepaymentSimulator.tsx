import React, { useState } from 'react';
import { TrendingDown, Calendar, Plus, Trash2, Clock, CheckCircle, Sparkles, Share2 } from 'lucide-react';
import { CurrencyType, LumpSumPrepayment, PrepaymentSimulationResult } from '../../types';
import { ClientCalculatorEngine } from '../../utils/calculatorEngine';
import { formatCurrency, formatPercent, formatTenure, getCurrencySymbol } from '../../utils/formatters';
import { NumericInput } from '../common/NumericInput';
import { AmortizationTable } from '../schedule/AmortizationTable';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

interface PrepaymentProps {
  currency: CurrencyType;
  onSaveShare: (payload: any) => void;
}

export const PrepaymentSimulator: React.FC<PrepaymentProps> = ({ currency, onSaveShare }) => {
  const [principal, setPrincipal] = useState<number>(5000000);
  const [annualRate, setAnnualRate] = useState<number>(8.5);
  const [tenureYears, setTenureYears] = useState<number>(20);
  const [strategy, setStrategy] = useState<'reduce_tenure' | 'reduce_emi'>('reduce_tenure');

  // Prepayment controls
  const [extraMonthly, setExtraMonthly] = useState<number>(5000);
  const [annualPrepay, setAnnualPrepay] = useState<number>(0);
  const [lumpSums, setLumpSums] = useState<LumpSumPrepayment[]>([
    { id: '1', month: 12, amount: 200000 },
  ]);

  const addLumpSum = () => {
    setLumpSums((prev) => [
      ...prev,
      { id: Date.now().toString(), month: (prev.length + 1) * 12, amount: 100000 },
    ]);
  };

  const removeLumpSum = (id: string) => {
    setLumpSums((prev) => prev.filter((ls) => ls.id !== id));
  };

  const updateLumpSum = (id: string, field: 'month' | 'amount', value: number) => {
    setLumpSums((prev) =>
      prev.map((ls) => (ls.id === id ? { ...ls, [field]: value } : ls))
    );
  };

  const tenureMonths = tenureYears * 12;

  // Run simulation
  const result: PrepaymentSimulationResult = ClientCalculatorEngine.simulatePrepayments(
    principal,
    annualRate,
    tenureMonths,
    strategy,
    extraMonthly,
    annualPrepay,
    lumpSums
  );

  // Chart comparison data: Original vs Prepayment balance curve
  const chartData: any[] = [];
  const maxYears = Math.max(tenureYears, result.schedule.yearly.length);
  for (let yr = 1; yr <= maxYears; yr++) {
    const origYr = yr <= tenureYears ? yr : null;
    const prepayYrEntry = result.schedule.yearly.find((y) => y.year === yr);

    // Approximate original balance curve for comparison
    const origSchedule = ClientCalculatorEngine.generateAmortization(principal, annualRate, tenureMonths);
    const origEntry = origSchedule.yearly.find((y) => y.year === yr);

    chartData.push({
      year: `Yr ${yr}`,
      originalBalance: origEntry ? origEntry.endingBalance : 0,
      prepaymentBalance: prepayYrEntry ? prepayYrEntry.endingBalance : 0,
    });
  }

  const handleShare = () => {
    onSaveShare({
      title: `Prepayment Simulation: Save ${formatCurrency(result.withPrepayment.interestSaved, currency)}`,
      calculatorType: 'prepayment',
      loanType: 'home',
      inputData: {
        principal,
        annualRate,
        tenureMonths,
        strategy,
        extraMonthly,
        annualPrepay,
        lumpSums,
      },
      resultSummary: {
        interestSaved: result.withPrepayment.interestSaved,
        monthsSaved: result.withPrepayment.monthsSaved,
        closureMonth: result.withPrepayment.closureMonth,
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-bold border border-emerald-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>WEALTH ACCELERATOR</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">Prepayment & Early Closure Simulator</h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-xl">
              Small extra contributions toward principal early on drastically slash the compound interest charged over decades.
            </p>
          </div>

          {/* Quick Highlight Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center sm:text-right min-w-[200px]">
            <span className="text-xs font-medium text-emerald-200 uppercase tracking-wider">Total Interest Saved</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {formatCurrency(result.withPrepayment.interestSaved, currency)}
            </div>
            {result.withPrepayment.monthsSaved > 0 && (
              <span className="text-xs font-bold text-emerald-300">
                Loan ends {formatTenure(result.withPrepayment.monthsSaved)} sooner!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Config vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Loan & Prepayment Inputs */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Loan & Prepayment Strategy
          </h3>

          {/* Strategy Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Prepayment Impact Objective
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setStrategy('reduce_tenure')}
                className={`py-3 px-4 rounded-xl text-xs font-bold text-left border transition-all ${
                  strategy === 'reduce_tenure'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="font-extrabold flex items-center justify-between">
                  <span>Reduce Tenure</span>
                  {strategy === 'reduce_tenure' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-[11px] font-normal text-slate-500 mt-1">Keep EMI same, pay off loan years faster (Highest Savings)</p>
              </button>

              <button
                onClick={() => setStrategy('reduce_emi')}
                className={`py-3 px-4 rounded-xl text-xs font-bold text-left border transition-all ${
                  strategy === 'reduce_emi'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="font-extrabold flex items-center justify-between">
                  <span>Reduce Monthly EMI</span>
                  {strategy === 'reduce_emi' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-[11px] font-normal text-slate-500 mt-1">Keep tenure same, reduce monthly cashflow burden</p>
              </button>
            </div>
          </div>

          {/* Base Loan Params */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">Loan Amount</label>
              <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 mt-1 focus-within:border-emerald-500">
                <span className="font-bold text-slate-400 mr-1">{getCurrencySymbol(currency)}</span>
                <NumericInput
                  min={0}
                  value={principal}
                  onChange={setPrincipal}
                  className="w-full text-sm font-bold bg-transparent text-slate-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">Rate (% p.a.)</label>
              <NumericInput
                step="0.1"
                min={0}
                max={30}
                value={annualRate}
                onChange={setAnnualRate}
                className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 mt-1 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">Tenure (Years)</label>
              <NumericInput
                min={1}
                max={35}
                value={tenureYears}
                onChange={setTenureYears}
                className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 mt-1 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Option A: Recurring Extra Monthly Payment */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase">Extra Monthly Payment</span>
                <p className="text-[11px] text-slate-500">Added on top of every scheduled monthly EMI</p>
              </div>
              <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2.5 py-1 focus-within:border-emerald-500">
                <span className="font-bold text-slate-400 mr-1">{getCurrencySymbol(currency)}</span>
                <NumericInput
                  min={0}
                  value={extraMonthly}
                  onChange={setExtraMonthly}
                  className="w-24 text-right text-sm font-bold bg-transparent text-slate-900 outline-none"
                />
              </div>
            </div>

            <input
              type="range"
              min="0"
              max={currency === 'INR' ? '50000' : '2000'}
              step="500"
              value={extraMonthly}
              onChange={(e) => setExtraMonthly(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Option B: Annual Prepayment */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase">Annual Lump-Sum Prepayment</span>
                <p className="text-[11px] text-slate-500">Paid once every 12 months (e.g. annual bonus / extra EMI)</p>
              </div>
              <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2.5 py-1 focus-within:border-emerald-500">
                <span className="font-bold text-slate-400 mr-1">{getCurrencySymbol(currency)}</span>
                <NumericInput
                  min={0}
                  value={annualPrepay}
                  onChange={setAnnualPrepay}
                  className="w-28 text-right text-sm font-bold bg-transparent text-slate-900 outline-none"
                />
              </div>
            </div>

            <input
              type="range"
              min="0"
              max={currency === 'INR' ? '500000' : '20000'}
              step="10000"
              value={annualPrepay}
              onChange={(e) => setAnnualPrepay(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Option C: One-Time Custom Lump-Sum Prepayments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase">One-Time Lump Sum Prepayments</span>
                <p className="text-[11px] text-slate-500">Inject surplus liquidity at specific month milestones</p>
              </div>
              <button
                onClick={addLumpSum}
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Prepayment</span>
              </button>
            </div>

            <div className="space-y-2">
              {lumpSums.map((ls, idx) => (
                <div key={ls.id} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 w-6">#{idx + 1}</span>

                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500">At Month:</span>
                    <NumericInput
                      min={1}
                      max={tenureMonths}
                      value={ls.month}
                      onChange={(val) => updateLumpSum(ls.id, 'month', val)}
                      className="w-16 text-center text-xs font-bold bg-white border border-slate-300 rounded px-1.5 py-1 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex-1 flex items-center gap-1 bg-white border border-slate-300 rounded px-2 py-1 focus-within:border-emerald-500">
                    <span className="text-xs font-bold text-slate-400">{getCurrencySymbol(currency)}</span>
                    <NumericInput
                      min={0}
                      value={ls.amount}
                      onChange={(val) => updateLumpSum(ls.id, 'amount', val)}
                      className="w-full text-xs font-bold bg-transparent text-slate-800 outline-none"
                    />
                  </div>

                  <button
                    onClick={() => removeLumpSum(ls.id)}
                    className="text-slate-400 hover:text-rose-500 p-1 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Comparison Impact Cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3">
              Prepayment Impact Comparison
            </h3>

            {/* Side-by-Side Metric Comparison */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-slate-500 block font-medium">Without Prepayment</span>
                <div className="mt-2 space-y-1.5">
                  <div>
                    <span className="text-[11px] text-slate-400">Total Tenure:</span>
                    <div className="font-bold text-slate-800">{formatTenure(result.original.tenureMonths)}</div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Total Interest:</span>
                    <div className="font-bold text-amber-600">{formatCurrency(result.original.totalInterest, currency)}</div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Total Repayment:</span>
                    <div className="font-bold text-slate-800">{formatCurrency(result.original.totalPayment, currency)}</div>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
                <span className="text-emerald-800 block font-bold">With Prepayment</span>
                <div className="mt-2 space-y-1.5">
                  <div>
                    <span className="text-[11px] text-emerald-700">Revised Tenure:</span>
                    <div className="font-bold text-emerald-900">{formatTenure(result.withPrepayment.revisedTenureMonths)}</div>
                  </div>
                  <div>
                    <span className="text-[11px] text-emerald-700">Total Interest:</span>
                    <div className="font-bold text-emerald-900">{formatCurrency(result.withPrepayment.totalInterest, currency)}</div>
                  </div>
                  <div>
                    <span className="text-[11px] text-emerald-700">Total Prepayments:</span>
                    <div className="font-bold text-emerald-900">{formatCurrency(result.withPrepayment.totalPrepayments, currency)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Savings Callout */}
            <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl text-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-100">NET INTEREST SAVINGS</span>
                <span className="text-xs font-black bg-white/20 px-2 py-0.5 rounded-full">
                  {result.original.totalInterest > 0
                    ? `${Math.round((result.withPrepayment.interestSaved / result.original.totalInterest) * 100)}% Saved`
                    : '0%'}
                </span>
              </div>
              <div className="text-2xl font-black">{formatCurrency(result.withPrepayment.interestSaved, currency)}</div>
              {result.withPrepayment.monthsSaved > 0 && (
                <div className="text-xs text-emerald-100 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Early debt freedom by {formatTenure(result.withPrepayment.monthsSaved)}!</span>
                </div>
              )}
            </div>

            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>Share Prepayment Report</span>
            </button>
          </div>

          {/* Payoff Trajectory Chart */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Outstanding Balance Payoff Curve
            </h4>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                  <YAxis
                    tickFormatter={(val) => formatCurrency(val, currency, true)}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      formatCurrency(Number(val), currency),
                      name === 'originalBalance' ? 'Original Payoff' : 'With Prepayment',
                    ]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '11px',
                    }}
                  />
                  <Legend verticalAlign="top" height={30} />
                  <Line
                    type="monotone"
                    dataKey="originalBalance"
                    name="Original Path"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="prepaymentBalance"
                    name="Accelerated Path"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Revised Amortization Schedule Table */}
      <AmortizationTable
        result={{
          monthlyEmi: result.withPrepayment.monthlyEmi,
          principalAmount: principal,
          totalInterest: result.withPrepayment.totalInterest,
          totalProcessingFee: 0,
          taxOnFee: 0,
          totalUpfrontCharges: 0,
          totalPayment: result.withPrepayment.totalPayment,
          effectiveApr: annualRate,
          interestToPrincipalRatio: Math.round((result.withPrepayment.totalInterest / result.withPrepayment.totalPayment) * 100),
          schedule: result.schedule,
        }}
        currency={currency}
        loanTitle={`Accelerated Prepayment Schedule - ${formatCurrency(principal, currency)}`}
        onSaveShare={handleShare}
      />
    </div>
  );
};
