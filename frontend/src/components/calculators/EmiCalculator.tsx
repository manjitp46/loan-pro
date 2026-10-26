import React, { useState, useEffect } from 'react';
import {
  Home,
  User,
  Car,
  GraduationCap,
  Briefcase,
  HelpCircle,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  ArrowRight,
  Share2,
  Check,
  Sparkles,
} from 'lucide-react';
import { CurrencyType, EmiCalculationResult, LoanPreset, LoanType } from '../../types';
import { ClientCalculatorEngine } from '../../utils/calculatorEngine';
import { formatCurrency, formatPercent, formatTenure, getCurrencySymbol } from '../../utils/formatters';
import { NumericInput } from '../common/NumericInput';
import { PrincipalInterestDonut } from '../charts/PrincipalInterestDonut';
import { AmortizationBarChart } from '../charts/AmortizationBarChart';
import { BalanceScheduleAreaChart } from '../charts/BalanceScheduleAreaChart';
import { AmortizationTable } from '../schedule/AmortizationTable';
import { copyToClipboard, generateShareUrl, syncAppState } from '../../utils/urlState';

interface EmiCalculatorProps {
  currency: CurrencyType;
  presets: LoanPreset[];
  onSaveShare: (payload: any) => void;
  onOpenMultiRatePlanner?: () => void;
  initialType?: LoanType;
  initialAmount?: number;
  initialRate?: number;
  initialTenure?: number;
  initialTenureUnit?: 'years' | 'months';
  initialDownPaymentPercent?: number;
}

export const EmiCalculator: React.FC<EmiCalculatorProps> = ({
  currency,
  presets,
  onSaveShare,
  onOpenMultiRatePlanner,
  initialType,
  initialAmount,
  initialRate,
  initialTenure,
  initialTenureUnit,
  initialDownPaymentPercent,
}) => {
  const [selectedType, setSelectedType] = useState<LoanType>(initialType || 'home');

  // Input states
  const [assetValue, setAssetValue] = useState<number>(initialAmount ?? 5000000);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(initialDownPaymentPercent ?? 20);
  const [annualRate, setAnnualRate] = useState<number>(initialRate ?? 8.5);
  const [tenureYears, setTenureYears] = useState<number>(initialTenure ?? 20);
  const [tenureUnit, setTenureUnit] = useState<'years' | 'months'>(initialTenureUnit ?? 'years');
  const [tenureMonthsDirect, setTenureMonthsDirect] = useState<number>((initialTenure ?? 20) * 12);
  const [processingFeePercent, setProcessingFeePercent] = useState<number>(0.5);
  const [taxPercent, setTaxPercent] = useState<number>(18);
  const [activeChartTab, setActiveChartTab] = useState<'donut' | 'bars' | 'area'>('donut');
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Sync to URL search params & local storage
  useEffect(() => {
    syncAppState({
      tab: 'emi',
      type: selectedType,
      currency,
      amount: assetValue,
      rate: annualRate,
      tenure: tenureUnit === 'years' ? tenureYears : tenureMonthsDirect,
      tenureUnit,
      downPaymentPercent,
    });
  }, [selectedType, currency, assetValue, annualRate, tenureYears, tenureMonthsDirect, tenureUnit, downPaymentPercent]);

  // Load preset when loan type tab changes (only if not loaded from explicit initial values)
  const isFirstMount = React.useRef(true);
  useEffect(() => {
    if (isFirstMount.current && (initialAmount || initialRate || initialTenure)) {
      isFirstMount.current = false;
      return;
    }
    isFirstMount.current = false;

    const preset = presets.find((p) => p.type === selectedType);
    if (preset) {
      setAssetValue(preset.defaultAmount);
      setAnnualRate(preset.defaultRate);
      setTenureYears(preset.defaultTenureYears);
      setTenureMonthsDirect(preset.defaultTenureYears * 12);
      setProcessingFeePercent(preset.defaultProcessingFeePercent);
      setDownPaymentPercent(preset.defaultDownPaymentPercent);
    }
  }, [selectedType, presets]);

  // Sync tenure
  const effectiveTenureMonths = tenureUnit === 'years' ? tenureYears * 12 : tenureMonthsDirect;
  const downPaymentAmount = Math.round((assetValue * downPaymentPercent) / 100);
  const principalToBorrow = Math.max(0, assetValue - downPaymentAmount);

  // Compute live results
  const result: EmiCalculationResult = ClientCalculatorEngine.calculateEmi(
    assetValue,
    annualRate,
    effectiveTenureMonths,
    processingFeePercent,
    0,
    taxPercent,
    downPaymentAmount
  );

  const loanCategories = [
    { type: 'home' as LoanType, label: 'Home Loan', icon: Home },
    { type: 'personal' as LoanType, label: 'Personal Loan', icon: User },
    { type: 'car' as LoanType, label: 'Car Loan', icon: Car },
    { type: 'education' as LoanType, label: 'Education Loan', icon: GraduationCap },
    { type: 'business' as LoanType, label: 'Business Loan', icon: Briefcase },
  ];

  const handleShare = () => {
    onSaveShare({
      title: `${selectedType.toUpperCase()} Loan - ${formatCurrency(principalToBorrow, currency)} @ ${annualRate}%`,
      calculatorType: 'emi',
      loanType: selectedType,
      inputData: {
        assetValue,
        downPaymentPercent,
        principalToBorrow,
        annualRate,
        tenureMonths: effectiveTenureMonths,
        processingFeePercent,
      },
      resultSummary: {
        monthlyEmi: result.monthlyEmi,
        totalInterest: result.totalInterest,
        totalPayment: result.totalPayment,
        effectiveApr: result.effectiveApr,
      },
    });
  };

  const handleCopyDirectLink = async () => {
    const url = generateShareUrl({
      tab: 'emi',
      type: selectedType,
      currency,
      amount: assetValue,
      rate: annualRate,
      tenure: tenureUnit === 'years' ? tenureYears : tenureMonthsDirect,
      tenureUnit,
      downPaymentPercent,
    });
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Loan Type Selector & Direct Share */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Loan Type Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-200/60 rounded-xl border border-slate-200 flex-1">
          {loanCategories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedType === cat.type;
            return (
              <button
                key={cat.type}
                onClick={() => setSelectedType(cat.type)}
                className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  isSelected
                    ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Copy Direct Share URL Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyDirectLink}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition shadow-xs whitespace-nowrap ${
              copiedUrl
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
            }`}
            title="Copy direct share URL for this loan type & parameters"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5 text-emerald-600" />}
            <span>{copiedUrl ? 'Link Copied!' : 'Copy Direct URL'}</span>
          </button>
        </div>
      </div>

      {/* Copy confirmation toast */}
      {copiedUrl && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">
            Direct link copied to clipboard! Anyone opening this link will see your exact loan calculation.
          </span>
        </div>
      )}

      {/* Home Loan Multi-Rate Repayment Planner Banner */}
      {selectedType === 'home' && onOpenMultiRatePlanner && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 text-emerald-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Need to Compare Multiple Rates & Tenures?</h3>
                <span className="px-2 py-0.2 bg-emerald-400 text-slate-950 text-[10px] font-black rounded-full uppercase">
                  NEW
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Stress-test multiple interest rates (e.g. 8.0%, 8.5%, 9.0%) and tenures side-by-side with our interactive Sensitivity Matrix.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenMultiRatePlanner}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-black rounded-xl shadow-xs transition whitespace-nowrap"
          >
            <span>Open Multi-Rate Planner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Two-Column Calculator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Sliders & Inputs */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Loan Parameters</h2>
              <p className="text-xs text-slate-500">Fine-tune amount, rate, tenure, and upfront charges</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Real-Time
            </span>
          </div>

          {/* Asset Value / Total Amount */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {downPaymentPercent > 0 ? 'Total Asset / Purchase Value' : 'Loan Amount'}
              </label>
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 focus-within:border-emerald-500">
                <span className="text-xs font-bold text-slate-400">{getCurrencySymbol(currency)}</span>
                <NumericInput
                  min={0}
                  value={assetValue}
                  onChange={setAssetValue}
                  className="w-32 text-right text-sm font-bold bg-transparent text-slate-900 outline-none"
                />
              </div>
            </div>

            <input
              type="range"
              min="50000"
              max={currency === 'INR' ? '50000000' : (currency === 'JPY' ? '200000000' : '2000000')}
              step="25000"
              value={assetValue}
              onChange={(e) => setAssetValue(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />

            {/* Quick shortcuts */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(currency === 'INR'
                ? [1000000, 2500000, 5000000, 7500000, 10000000]
                : currency === 'JPY'
                ? [5000000, 15000000, 30000000, 50000000, 100000000]
                : [50000, 150000, 300000, 500000, 1000000]
              ).map((val) => (
                <button
                  key={val}
                  onClick={() => setAssetValue(val)}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition"
                >
                  {formatCurrency(val, currency, true)}
                </button>
              ))}
            </div>
          </div>

          {/* Down Payment (if applicable) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Down Payment ({downPaymentPercent}%)
                </label>
                <span className="text-xs text-slate-500 ml-2 font-medium">
                  {formatCurrency(downPaymentAmount, currency)}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 focus-within:border-emerald-500">
                <NumericInput
                  min={0}
                  max={90}
                  value={downPaymentPercent}
                  onChange={(val) => setDownPaymentPercent(Math.min(90, Math.max(0, val)))}
                  className="w-14 text-right text-sm font-bold bg-transparent text-slate-900 outline-none"
                />
                <span className="text-xs font-bold text-slate-400">%</span>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            {downPaymentPercent > 0 && (
              <p className="text-xs text-emerald-700 font-medium">
                Actual Loan Disbursed: <span className="font-bold">{formatCurrency(principalToBorrow, currency)}</span>
              </p>
            )}
          </div>

          {/* Interest Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Interest Rate (p.a.)
              </label>
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 focus-within:border-emerald-500">
                <NumericInput
                  step="0.05"
                  min={0.1}
                  max={30}
                  value={annualRate}
                  onChange={(val) => setAnnualRate(Math.min(30, Math.max(0, val)))}
                  className="w-16 text-right text-sm font-bold bg-transparent text-slate-900 outline-none"
                />
                <span className="text-xs font-bold text-slate-400">%</span>
              </div>
            </div>

            <input
              type="range"
              min="5"
              max="22"
              step="0.1"
              value={annualRate}
              onChange={(e) => setAnnualRate(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />

            <div className="flex justify-between text-[11px] text-slate-400 font-semibold px-0.5">
              <span>5%</span>
              <span>8.5%</span>
              <span>12%</span>
              <span>16%</span>
              <span>22%</span>
            </div>
          </div>

          {/* Loan Tenure */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Loan Tenure
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    onClick={() => setTenureUnit('years')}
                    className={`px-2 py-0.5 font-bold rounded ${
                      tenureUnit === 'years' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Yr
                  </button>
                  <button
                    onClick={() => setTenureUnit('months')}
                    className={`px-2 py-0.5 font-bold rounded ${
                      tenureUnit === 'months' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Mo
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 focus-within:border-emerald-500">
                  <NumericInput
                    min={1}
                    max={tenureUnit === 'years' ? 35 : 420}
                    value={tenureUnit === 'years' ? tenureYears : tenureMonthsDirect}
                    onChange={(val) => {
                      if (tenureUnit === 'years') {
                        setTenureYears(val);
                        setTenureMonthsDirect(val * 12);
                      } else {
                        setTenureMonthsDirect(val);
                        setTenureYears(Math.max(1, Math.round(val / 12)));
                      }
                    }}
                    className="w-14 text-right text-sm font-bold bg-transparent text-slate-900 outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400">{tenureUnit === 'years' ? 'Yrs' : 'Mos'}</span>
                </div>
              </div>
            </div>

            <input
              type="range"
              min={tenureUnit === 'years' ? '1' : '12'}
              max={tenureUnit === 'years' ? '30' : '360'}
              step={tenureUnit === 'years' ? '1' : '6'}
              value={tenureUnit === 'years' ? tenureYears : tenureMonthsDirect}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (tenureUnit === 'years') {
                  setTenureYears(val);
                  setTenureMonthsDirect(val * 12);
                } else {
                  setTenureMonthsDirect(val);
                  setTenureYears(Math.max(1, Math.round(val / 12)));
                }
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />

            <div className="flex justify-between text-[11px] text-slate-400 font-semibold px-0.5">
              <span>{tenureUnit === 'years' ? '1 Yr' : '12 Mos'}</span>
              <span>{tenureUnit === 'years' ? '10 Yrs' : '120 Mos'}</span>
              <span>{tenureUnit === 'years' ? '20 Yrs' : '240 Mos'}</span>
              <span>{tenureUnit === 'years' ? '30 Yrs' : '360 Mos'}</span>
            </div>
          </div>

          {/* Upfront Fees & GST Collapsible / Advanced Options */}
          <div className="pt-3 border-t border-slate-100">
            <details className="group">
              <summary className="flex items-center justify-between text-xs font-bold text-slate-600 cursor-pointer list-none hover:text-slate-900">
                <span>Advanced Fees & Taxes (Processing Fee & GST)</span>
                <span className="text-emerald-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Processing Fee (%)</label>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 mt-1 focus-within:border-emerald-500">
                    <NumericInput
                      step="0.1"
                      min={0}
                      max={10}
                      value={processingFeePercent}
                      onChange={setProcessingFeePercent}
                      className="w-full text-sm font-semibold bg-transparent text-slate-800 outline-none"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Tax on Fee (GST %)</label>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 mt-1 focus-within:border-emerald-500">
                    <NumericInput
                      min={0}
                      max={30}
                      value={taxPercent}
                      onChange={setTaxPercent}
                      className="w-full text-sm font-semibold bg-transparent text-slate-800 outline-none"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Right Column: Key Metric Cards & Visual Graphs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main EMI Highlight Box */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Monthly Loan EMI</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {formatTenure(effectiveTenureMonths)}
              </span>
            </div>

            <div className="mt-3">
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {formatCurrency(result.monthlyEmi, currency)}
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Scheduled monthly repayment of principal + interest
              </p>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Principal Amount</span>
                <div className="text-base font-bold text-white mt-0.5">
                  {formatCurrency(result.principalAmount, currency)}
                </div>
              </div>
              <div>
                <span className="text-amber-400 font-medium">Total Interest</span>
                <div className="text-base font-bold text-white mt-0.5">
                  {formatCurrency(result.totalInterest, currency)}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Fees & GST</span>
                <div className="text-base font-bold text-white mt-0.5">
                  {formatCurrency(result.totalUpfrontCharges, currency)}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Effective APR</span>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  {formatPercent(result.effectiveApr)}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-semibold">Total Repayment:</span>
              <span className="text-sm font-black text-white">{formatCurrency(result.totalPayment, currency)}</span>
            </div>
          </div>

          {/* Visual Chart Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Breakdown Visualization</h3>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
                <button
                  onClick={() => setActiveChartTab('donut')}
                  className={`px-2.5 py-1 rounded transition ${
                    activeChartTab === 'donut' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Donut
                </button>
                <button
                  onClick={() => setActiveChartTab('bars')}
                  className={`px-2.5 py-1 rounded transition ${
                    activeChartTab === 'bars' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Yearly
                </button>
                <button
                  onClick={() => setActiveChartTab('area')}
                  className={`px-2.5 py-1 rounded transition ${
                    activeChartTab === 'area' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Balance
                </button>
              </div>
            </div>

            {activeChartTab === 'donut' && (
              <PrincipalInterestDonut
                principal={result.principalAmount}
                totalInterest={result.totalInterest}
                totalFees={result.totalUpfrontCharges}
                monthlyEmi={result.monthlyEmi}
                currency={currency}
              />
            )}

            {activeChartTab === 'bars' && (
              <AmortizationBarChart yearlyData={result.schedule.yearly} currency={currency} />
            )}

            {activeChartTab === 'area' && (
              <BalanceScheduleAreaChart yearlyData={result.schedule.yearly} currency={currency} />
            )}
          </div>
        </div>
      </div>

      {/* Amortization Schedule Table */}
      <AmortizationTable
        result={result}
        currency={currency}
        loanTitle={`${selectedType.toUpperCase()} Loan - ${formatCurrency(result.principalAmount, currency)}`}
        onSaveShare={handleShare}
      />
    </div>
  );
};
