import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  TrendingDown,
  TrendingUp,
  Percent,
  Calendar,
  DollarSign,
  Plus,
  X,
  FileSpreadsheet,
  FileText,
  Share2,
  Check,
  Award,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Info,
  Clock,
  ArrowRightLeft,
} from 'lucide-react';
import { CurrencyType, MultiScenarioMatrixCell, MultiScenarioMatrixResult } from '../../types';
import { ClientCalculatorEngine } from '../../utils/calculatorEngine';
import { formatCurrency, formatPercent, getCurrencySymbol } from '../../utils/formatters';
import { NumericInput } from '../common/NumericInput';
import { exportMultiScenarioToCsv, exportMultiScenarioToPdf } from '../../utils/exportUtils';
import { copyToClipboard, generateShareUrl, syncAppState } from '../../utils/urlState';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface MultiRatePlannerProps {
  currency: CurrencyType;
  onSaveShare: (payload: any) => void;
  onSwitchToSimpleEmi?: () => void;
  initialPrincipal?: number;
  initialRates?: number[];
  initialTenures?: number[];
  initialBaseRate?: number;
  initialBaseTenure?: number;
  initialTenureUnit?: 'years' | 'months';
}

export const MultiRatePlanner: React.FC<MultiRatePlannerProps> = ({
  currency,
  onSaveShare,
  onSwitchToSimpleEmi,
  initialPrincipal,
  initialRates,
  initialTenures,
  initialBaseRate,
  initialBaseTenure,
  initialTenureUnit,
}) => {
  // Input states
  const [borrowerMode, setBorrowerMode] = useState<'new' | 'existing'>('existing');
  const [tenureUnit, setTenureUnit] = useState<'years' | 'months'>(initialTenureUnit || 'years');
  const [principal, setPrincipal] = useState<number>(initialPrincipal || 5000000);
  const [baseRate, setBaseRate] = useState<number>(initialBaseRate || 8.5);

  // Store base tenure internally in months for maximum fidelity (e.g. 142 months)
  const [baseTenureMonths, setBaseTenureMonths] = useState<number>(
    initialBaseTenure
      ? (initialTenureUnit === 'months' || initialBaseTenure > 40 ? initialBaseTenure : initialBaseTenure * 12)
      : 240
  );

  // Multiple rates
  const [rates, setRates] = useState<number[]>(
    initialRates && initialRates.length > 0 ? initialRates : [7.75, 8.0, 8.25, 8.5, 8.75, 9.0, 9.5]
  );

  // Store tenures internally in months (supports any month or year value)
  const [tenuresMonths, setTenuresMonths] = useState<number[]>(() => {
    if (initialTenures && initialTenures.length > 0) {
      // If numbers look like years (all <= 40), convert to months, else treat as months
      const looksLikeYears = initialTenures.every((t) => t <= 40);
      return looksLikeYears ? initialTenures.map((y) => Math.round(y * 12)) : initialTenures;
    }
    return [120, 180, 240, 300, 360]; // 10, 15, 20, 25, 30 years
  });

  // Inputs for adding custom items
  const [newRateInput, setNewRateInput] = useState<number>(8.65);
  const [newTenureInput, setNewTenureInput] = useState<number>(tenureUnit === 'years' ? 18 : 216);

  // Active view: 'matrix' | 'cards' | 'chart'
  const [activeView, setActiveView] = useState<'matrix' | 'cards' | 'chart'>('matrix');
  const [selectedCell, setSelectedCell] = useState<MultiScenarioMatrixCell | null>(null);

  // Copy toast status
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Synchronize state with URL search params
  useEffect(() => {
    syncAppState({
      tab: 'multi_rate',
      type: 'home',
      currency,
      amount: principal,
      baseRate,
      baseTenure: tenureUnit === 'years' ? Math.round(baseTenureMonths / 12) : baseTenureMonths,
      tenureUnit,
      rates,
      tenures: tenureUnit === 'years' ? tenuresMonths.map((m) => Math.round((m / 12) * 10) / 10) : tenuresMonths,
    });
  }, [principal, baseRate, baseTenureMonths, rates, tenuresMonths, tenureUnit, currency]);

  // Compute matrix calculations live
  const result: MultiScenarioMatrixResult = useMemo(() => {
    return ClientCalculatorEngine.generateMultiScenarioMatrix({
      principal,
      rates,
      tenuresMonths,
      baseRate,
      baseTenureMonths,
    });
  }, [principal, rates, tenuresMonths, baseRate, baseTenureMonths]);

  // Set default selected cell when result changes
  useEffect(() => {
    if (!selectedCell && result.baseScenario) {
      setSelectedCell(result.baseScenario);
    }
  }, [result, selectedCell]);

  // Handlers for adding/removing rates and tenures
  const handleAddRate = () => {
    if (newRateInput > 0 && newRateInput <= 30 && !rates.includes(newRateInput)) {
      setRates((prev) => [...prev, newRateInput].sort((a, b) => a - b));
    }
  };

  const handleRemoveRate = (rateToRemove: number) => {
    if (rates.length <= 1) return;
    setRates((prev) => prev.filter((r) => r !== rateToRemove));
  };

  const handleAddTenure = () => {
    if (newTenureInput <= 0) return;
    const monthsToAdd = tenureUnit === 'years' ? Math.round(newTenureInput * 12) : Math.round(newTenureInput);
    if (!tenuresMonths.includes(monthsToAdd) && monthsToAdd <= 600) {
      setTenuresMonths((prev) => [...prev, monthsToAdd].sort((a, b) => a - b));
    }
  };

  const handleRemoveTenure = (monthsToRemove: number) => {
    if (tenuresMonths.length <= 1) return;
    setTenuresMonths((prev) => prev.filter((m) => m !== monthsToRemove));
  };

  // Presets for Rates
  const applyRatePreset = (type: 'quarter' | 'half' | 'hikes' | 'banks') => {
    if (type === 'quarter') {
      setRates([baseRate - 0.5, baseRate - 0.25, baseRate, baseRate + 0.25, baseRate + 0.5].filter((r) => r > 0));
    } else if (type === 'half') {
      setRates([baseRate - 1.0, baseRate - 0.5, baseRate, baseRate + 0.5, baseRate + 1.0].filter((r) => r > 0));
    } else if (type === 'hikes') {
      setRates([baseRate, baseRate + 0.25, baseRate + 0.5, baseRate + 0.75, baseRate + 1.0, baseRate + 1.5]);
    } else if (type === 'banks') {
      setRates([7.95, 8.25, 8.4, 8.55, 8.75, 9.1]);
    }
  };

  // Presets for Tenures
  const applyTenurePreset = (type: 'short' | 'standard' | 'fine' | 'extended') => {
    if (type === 'short') {
      setTenuresMonths([60, 84, 120, 144, 180]); // 5, 7, 10, 12, 15 yrs
    } else if (type === 'standard') {
      setTenuresMonths([120, 180, 240, 300, 360]); // 10, 15, 20, 25, 30 yrs
    } else if (type === 'fine') {
      setTenuresMonths([120, 144, 168, 192, 216, 240]); // 10, 12, 14, 16, 18, 20 yrs
    } else if (type === 'extended') {
      setTenuresMonths([180, 240, 300, 360, 420]); // 15, 20, 25, 30, 35 yrs
    }
  };

  // Copy Direct Link to Clipboard
  const handleCopyDirectLink = async () => {
    const url = generateShareUrl({
      tab: 'multi_rate',
      type: 'home',
      currency,
      amount: principal,
      baseRate,
      baseTenure: tenureUnit === 'years' ? Math.round(baseTenureMonths / 12) : baseTenureMonths,
      tenureUnit,
      rates,
      tenures: tenureUnit === 'years' ? tenuresMonths.map((m) => Math.round((m / 12) * 10) / 10) : tenuresMonths,
    });
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 3000);
    }
  };

  // Share to database modal
  const handleSaveToDatabase = () => {
    onSaveShare({
      title: `Home Loan Multi-Rate Matrix (${formatCurrency(principal, currency)} | ${rates.length} Rates × ${tenuresMonths.length} Tenures)`,
      calculatorType: 'multi_rate',
      loanType: 'home',
      inputData: {
        principal,
        baseRate,
        baseTenureMonths,
        rates,
        tenuresMonths,
        tenureUnit,
      },
      resultSummary: {
        baseEmi: result.baseScenario.monthlyEmi,
        lowestEmi: result.lowestEmiCell.monthlyEmi,
        lowestInterest: result.lowestInterestCell.totalInterest,
        ratesTested: rates.join(', '),
        tenuresTestedMonths: tenuresMonths.join(', '),
      },
    });
  };

  // Chart data preparation
  const chartBarData = result.tenuresMonths.map((tMonths) => {
    const tYears = Math.round((tMonths / 12) * 10) / 10;
    const label = tenureUnit === 'months' ? `${tMonths} Mos` : `${tYears} Yrs`;
    const rowObj: any = { tenure: label };
    result.rates.forEach((r) => {
      const cell = result.matrix
        .flat()
        .find((c) => c.tenureMonths === tMonths && Math.abs(c.annualRate - r) < 0.001);
      if (cell) {
        rowObj[`EMI @ ${r}%`] = cell.monthlyEmi;
        rowObj[`Interest @ ${r}%`] = cell.totalInterest;
      }
    });
    return rowObj;
  });

  // Selected comparison scenarios for cards view
  const comparisonScenarios: MultiScenarioMatrixCell[] = useMemo(() => {
    const items: MultiScenarioMatrixCell[] = [result.baseScenario];
    if (result.lowestInterestCell && result.lowestInterestCell !== result.baseScenario) {
      items.push(result.lowestInterestCell);
    }
    if (result.lowestEmiCell && result.lowestEmiCell !== result.baseScenario && result.lowestEmiCell !== result.lowestInterestCell) {
      items.push(result.lowestEmiCell);
    }
    // Rate hike scenario (+0.5%)
    const hikeRate = baseRate + 0.5;
    const hikeCell = result.matrix.flat().find((c) => Math.abs(c.annualRate - hikeRate) < 0.05 && c.tenureMonths === baseTenureMonths);
    if (hikeCell && !items.includes(hikeCell)) {
      items.push(hikeCell);
    }
    return items.slice(0, 4);
  }, [result, baseRate, baseTenureMonths]);

  return (
    <div className="space-y-8">
      {/* Header Banner & Quick Actions */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider flex items-center gap-1 border border-emerald-200">
                <Sparkles className="w-3 h-3" /> Home Loan Repayment Intelligence
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
                Institutional Dual-Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Home Loan Multi-Rate & Tenure Repayment Planner
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl">
              Simultaneously stress-test multiple interest rates and tenure periods (in Years or exact Months). Evaluate RBI rate hikes, tenure cuts, and compound savings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onSwitchToSimpleEmi && (
              <button
                onClick={onSwitchToSimpleEmi}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Simple EMI View</span>
              </button>
            )}

            <button
              onClick={handleCopyDirectLink}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition shadow-xs ${
                copiedUrl
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
              title="Copy direct share link with current scenarios"
            >
              {copiedUrl ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedUrl ? 'URL Copied!' : 'Share / Copy URL'}</span>
            </button>

            <button
              onClick={() => exportMultiScenarioToPdf(result, currency)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition"
              title="Export Full Scenario Matrix to PDF"
            >
              <FileText className="w-4 h-4 text-rose-500" />
              <span>PDF Report</span>
            </button>

            <button
              onClick={() => exportMultiScenarioToCsv(result, currency)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition"
              title="Export Scenario Matrix to CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>CSV Matrix</span>
            </button>

            <button
              onClick={handleSaveToDatabase}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition"
            >
              <span>Save Plan</span>
            </button>
          </div>
        </div>

        {/* Copy confirmation toast */}
        {copiedUrl && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">
              Direct Link copied to clipboard! Anyone opening this link will see your exact loan amount, rates, and tenures.
            </span>
          </div>
        )}

        {/* Borrower Mode & Global Tenure Unit Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Borrower Mode */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setBorrowerMode('existing')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  borrowerMode === 'existing'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Existing Borrower Repayment Plan
              </button>
              <button
                onClick={() => setBorrowerMode('new')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  borrowerMode === 'new'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                New Home Loan Evaluation
              </button>
            </div>

            {/* Tenure Unit Switcher (Years vs Months) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase px-2">Tenure Unit:</span>
              <button
                onClick={() => {
                  setTenureUnit('years');
                  setNewTenureInput(Math.max(1, Math.round(newTenureInput / 12)));
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  tenureUnit === 'years'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Years (Yr)
              </button>
              <button
                onClick={() => {
                  setTenureUnit('months');
                  setNewTenureInput(newTenureInput <= 40 ? newTenureInput * 12 : newTenureInput);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  tenureUnit === 'months'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Months (Mo)
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {borrowerMode === 'existing' ? (
              <span>Benchmarking against your <strong className="text-slate-900">Current Balance & Remaining Tenure</strong></span>
            ) : (
              <span>Comparing multiple <strong className="text-slate-900">Lender Quotations & Tenure Combinations</strong></span>
            )}
          </div>
        </div>
      </div>

      {/* Main Parameters Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Loan Amount & Baseline Setting (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              {borrowerMode === 'existing' ? '1. Current Loan Balance' : '1. Loan Principal Amount'}
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Base Benchmark
            </span>
          </div>

          {/* Principal Amount Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {borrowerMode === 'existing' ? 'Outstanding Loan Balance' : 'Disbursed Principal'}
              </label>
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 focus-within:border-emerald-500">
                <span className="text-xs font-bold text-slate-400">{getCurrencySymbol(currency)}</span>
                <NumericInput
                  min={10000}
                  value={principal}
                  onChange={setPrincipal}
                  className="w-32 text-right text-sm font-bold bg-transparent text-slate-900 outline-none"
                />
              </div>
            </div>

            <input
              type="range"
              min="500000"
              max={currency === 'INR' ? '50000000' : '2000000'}
              step="50000"
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(currency === 'INR'
                ? [2500000, 4000000, 5000000, 7500000, 10000000]
                : [150000, 300000, 450000, 600000, 1000000]
              ).map((val) => (
                <button
                  key={val}
                  onClick={() => setPrincipal(val)}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition ${
                    principal === val
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {formatCurrency(val, currency, true)}
                </button>
              ))}
            </div>
          </div>

          {/* Baseline Rate & Tenure */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                {borrowerMode === 'existing' ? 'Your Current Terms (Baseline)' : 'Baseline Reference Offer'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase">Current Rate (p.a.)</label>
                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 mt-1 focus-within:border-emerald-500">
                  <NumericInput
                    step="0.05"
                    min={1}
                    max={25}
                    value={baseRate}
                    onChange={setBaseRate}
                    className="w-full text-right text-xs font-bold bg-transparent text-slate-900 outline-none"
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">
                    Remaining Tenure
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {tenureUnit === 'years' ? `${baseTenureMonths} Mos` : `${Math.round((baseTenureMonths / 12) * 10) / 10} Yrs`}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 mt-1 focus-within:border-emerald-500">
                  <NumericInput
                    min={tenureUnit === 'years' ? 1 : 6}
                    max={tenureUnit === 'years' ? 40 : 480}
                    value={tenureUnit === 'years' ? Math.round((baseTenureMonths / 12) * 10) / 10 : baseTenureMonths}
                    onChange={(val) => {
                      if (tenureUnit === 'years') {
                        setBaseTenureMonths(Math.round(val * 12));
                      } else {
                        setBaseTenureMonths(Math.round(val));
                      }
                    }}
                    className="w-full text-right text-xs font-bold bg-transparent text-slate-900 outline-none"
                  />
                  <span className="text-xs text-slate-400">{tenureUnit === 'years' ? 'Yrs' : 'Mos'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">Current Monthly EMI:</span>
              <span className="font-bold text-slate-900">{formatCurrency(result.baseScenario.monthlyEmi, currency)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Total Interest in Base:</span>
              <span className="font-bold text-amber-700">{formatCurrency(result.baseScenario.totalInterest, currency)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Rates & Multi-Tenures Configuration (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">2. Scenarios to Stress-Test</h2>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {rates.length} Rates × {tenuresMonths.length} Tenures = {rates.length * tenuresMonths.length} Combinations
            </span>
          </div>

          {/* Interest Rates Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-emerald-600" />
                Interest Rates to Compare (% p.a.)
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => applyRatePreset('quarter')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold"
                >
                  ±0.25%
                </button>
                <button
                  onClick={() => applyRatePreset('half')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold"
                >
                  ±0.5%
                </button>
                <button
                  onClick={() => applyRatePreset('hikes')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold"
                >
                  Rate Hikes
                </button>
              </div>
            </div>

            {/* Active Rate Chips */}
            <div className="flex flex-wrap gap-2">
              {rates.map((r) => {
                const isBase = Math.abs(r - baseRate) < 0.001;
                return (
                  <span
                    key={r}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                      isBase
                        ? 'bg-blue-50 text-blue-800 border-blue-300 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <span>{r}%</span>
                    {isBase && <span className="text-[10px] text-blue-600 font-extrabold">(Base)</span>}
                    {rates.length > 1 && (
                      <button
                        onClick={() => handleRemoveRate(r)}
                        className="text-slate-400 hover:text-rose-600 rounded p-0.5 transition"
                        title="Remove Rate"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>

            {/* Add Custom Rate */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1">
                <span className="text-xs font-semibold text-slate-400">Custom Rate:</span>
                <NumericInput
                  step="0.05"
                  min={1}
                  max={25}
                  value={newRateInput}
                  onChange={setNewRateInput}
                  className="w-16 text-right text-xs font-bold bg-transparent text-slate-900 outline-none"
                />
                <span className="text-xs text-slate-400">%</span>
              </div>
              <button
                onClick={handleAddRate}
                className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
              >
                <Plus className="w-3 h-3" />
                <span>Add Rate</span>
              </button>
            </div>
          </div>

          {/* Time Periods (Tenures) Selector with Month/Year Support */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Time Periods / Tenures ({tenureUnit === 'months' ? 'Months' : 'Years'})
              </label>

              <div className="flex items-center gap-1 text-[11px]">
                {tenureUnit === 'months' ? (
                  <>
                    <button
                      onClick={() => applyTenurePreset('fine')}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold"
                    >
                      Fine Steps (120-240M)
                    </button>
                    <button
                      onClick={() => applyTenurePreset('standard')}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold"
                    >
                      Standard (120-360M)
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => applyTenurePreset('short')}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold"
                    >
                      Short (5-15Y)
                    </button>
                    <button
                      onClick={() => applyTenurePreset('standard')}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold"
                    >
                      Standard (10-30Y)
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Active Tenure Chips */}
            <div className="flex flex-wrap gap-2">
              {tenuresMonths.map((m) => {
                const isBase = m === baseTenureMonths;
                const yrs = Math.round((m / 12) * 10) / 10;
                return (
                  <span
                    key={m}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                      isBase
                        ? 'bg-blue-50 text-blue-800 border-blue-300 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <span>
                      {tenureUnit === 'months' ? `${m} Mos (${yrs} Yrs)` : `${yrs} Yrs (${m} Mos)`}
                    </span>
                    {isBase && <span className="text-[10px] text-blue-600 font-extrabold">(Base)</span>}
                    {tenuresMonths.length > 1 && (
                      <button
                        onClick={() => handleRemoveTenure(m)}
                        className="text-slate-400 hover:text-rose-600 rounded p-0.5 transition"
                        title="Remove Tenure"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>

            {/* Add Custom Tenure Input (Supports Months or Years) */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1">
                <span className="text-xs font-semibold text-slate-400">
                  Custom {tenureUnit === 'months' ? 'Months' : 'Years'}:
                </span>
                <NumericInput
                  min={tenureUnit === 'months' ? 6 : 1}
                  max={tenureUnit === 'months' ? 600 : 50}
                  value={newTenureInput}
                  onChange={setNewTenureInput}
                  className="w-16 text-right text-xs font-bold bg-transparent text-slate-900 outline-none"
                />
                <span className="text-xs text-slate-400">{tenureUnit === 'months' ? 'Mos' : 'Yrs'}</span>
              </div>
              <button
                onClick={handleAddTenure}
                className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
              >
                <Plus className="w-3 h-3" />
                <span>Add {tenureUnit === 'months' ? 'Month Tenure' : 'Year Tenure'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Repayment Planning Intelligence & Financial Shock Absorbers Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Advisory 1: Tenure Reduction Impact */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2 text-emerald-800">
            <TrendingDown className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Tenure Shortening Power</h3>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">
            Save {formatCurrency(result.advisoryInsights.tenureCutSavings.lifetimeInterestSaved, currency)}
          </div>
          <p className="text-xs text-emerald-800/90 mt-1.5 leading-relaxed font-medium">
            Cutting tenure from {result.advisoryInsights.tenureCutSavings.fromYears} to {result.advisoryInsights.tenureCutSavings.toYears} years ({Math.round(result.advisoryInsights.tenureCutSavings.toYears * 12)} months) increases monthly EMI by {formatCurrency(result.advisoryInsights.tenureCutSavings.monthlyEmiIncrease, currency)}, eliminating lakhs in compound interest.
          </p>
        </div>

        {/* Advisory 2: Rate Hike Shock & Neutralizer */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2 text-amber-800">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              +{result.advisoryInsights.rateHikeImpact.hikePercent}% Rate Hike Impact
            </h3>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-950 mt-1">
            +{formatCurrency(result.advisoryInsights.rateHikeImpact.monthlyEmiIncrease, currency)}/mo
          </div>
          <p className="text-xs text-amber-800/90 mt-1.5 leading-relaxed font-medium">
            If rate rises to {result.advisoryInsights.rateHikeImpact.revisedRate}%, you can neutralize the hike completely by either extending tenure by {result.advisoryInsights.rateHikeImpact.equivalentTenureExtensionMonths} months OR making a 1-time part prepayment of {formatCurrency(result.advisoryInsights.rateHikeImpact.equivalentLumpSumPrepayment, currency)}.
          </p>
        </div>

        {/* Advisory 3: Rate Drop / Negotiation Benchmark */}
        <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2 text-blue-800">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              -{result.advisoryInsights.rateDropAdvantage.dropPercent}% Lower Rate Opportunity
            </h3>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-950 mt-1">
            Save {formatCurrency(result.advisoryInsights.rateDropAdvantage.lifetimeInterestSaved, currency)}
          </div>
          <p className="text-xs text-blue-800/90 mt-1.5 leading-relaxed font-medium">
            Negotiating with your current lender or transferring to {result.advisoryInsights.rateDropAdvantage.revisedRate}% saves {formatCurrency(result.advisoryInsights.rateDropAdvantage.monthlyEmiSavings, currency)} every month, putting total savings of {formatCurrency(result.advisoryInsights.rateDropAdvantage.lifetimeInterestSaved, currency)} back in your pocket.
          </p>
        </div>
      </div>

      {/* Detailed Analysis View Selector & Content */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
        {/* View Tabs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveView('matrix')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeView === 'matrix'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Rate vs Tenure Matrix Grid</span>
            </button>

            <button
              onClick={() => setActiveView('cards')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeView === 'cards'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-blue-600" />
              <span>Side-by-Side Scenarios</span>
            </button>

            <button
              onClick={() => setActiveView('chart')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeView === 'chart'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>Comparative Charts</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Lowest Interest
            </span>
            <span className="flex items-center gap-1 text-blue-700">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Current Base
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Lowest EMI
            </span>
          </div>
        </div>

        {/* VIEW 1: Rate vs Tenure Sensitivity Matrix Grid */}
        {activeView === 'matrix' && (
          <div className="space-y-4">
            <div className="overflow-x-auto pb-2">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <th className="py-3 px-4 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                      Interest Rate (p.a.)
                    </th>
                    {result.tenuresMonths.map((tMonths) => {
                      const tYears = Math.round((tMonths / 12) * 10) / 10;
                      return (
                        <th key={tMonths} className="py-3 px-4 text-center border-r border-slate-100 last:border-r-0">
                          <div>{tenureUnit === 'months' ? `${tMonths} Months` : `${tYears} Years`}</div>
                          <div className="text-[10px] text-slate-400 font-medium lowercase">
                            {tenureUnit === 'months' ? `(${tYears} yrs)` : `(${tMonths} mos)`}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {result.matrix.map((rateRow) => {
                    const rowRate = rateRow[0].annualRate;
                    const isBaseRate = Math.abs(rowRate - baseRate) < 0.001;

                    return (
                      <tr key={rowRate} className="hover:bg-slate-50/60 transition">
                        <td className={`py-3.5 px-4 sticky left-0 z-10 border-r border-slate-200 font-black text-sm ${
                          isBaseRate ? 'bg-blue-50/90 text-blue-900' : 'bg-white text-slate-900'
                        }`}>
                          <div className="flex items-center justify-between gap-2">
                            <span>{rowRate}%</span>
                            {isBaseRate && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-200/80 text-blue-800">
                                Current
                              </span>
                            )}
                          </div>
                        </td>

                        {rateRow.map((cell) => {
                          const isBaseCell = Math.abs(cell.annualRate - baseRate) < 0.001 && cell.tenureMonths === baseTenureMonths;
                          const isLowestEmi = cell.monthlyEmi === result.lowestEmiCell.monthlyEmi;
                          const isLowestInterest = cell.totalInterest === result.lowestInterestCell.totalInterest;
                          const isSelected = selectedCell === cell;

                          return (
                            <td
                              key={`${cell.annualRate}-${cell.tenureMonths}`}
                              onClick={() => setSelectedCell(cell)}
                              className={`py-3 px-3 text-center border-r border-slate-100 last:border-r-0 cursor-pointer transition relative group ${
                                isSelected
                                  ? 'bg-emerald-100/70 ring-2 ring-emerald-500 rounded-lg'
                                  : isBaseCell
                                  ? 'bg-blue-50/60'
                                  : isLowestInterest
                                  ? 'bg-emerald-50/40'
                                  : 'hover:bg-slate-100/50'
                              }`}
                            >
                              {/* Top Badges */}
                              {isLowestInterest && (
                                <span className="absolute top-1 right-1 px-1 py-0.2 rounded text-[9px] font-black bg-emerald-600 text-white leading-tight">
                                  Min Int.
                                </span>
                              )}
                              {isLowestEmi && (
                                <span className="absolute top-1 right-1 px-1 py-0.2 rounded text-[9px] font-black bg-amber-600 text-white leading-tight">
                                  Min EMI
                                </span>
                              )}

                              <div className="font-black text-slate-900 text-xs sm:text-sm">
                                {formatCurrency(cell.monthlyEmi, currency)}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                Int: <span className="font-semibold">{formatCurrency(cell.totalInterest, currency, true)}</span>
                              </div>

                              {/* Diff from base */}
                              {!isBaseCell && cell.differenceFromBaseEmi !== undefined && (
                                <div className={`text-[10px] font-bold mt-1 ${
                                  cell.differenceFromBaseEmi > 0 ? 'text-rose-600' : 'text-emerald-600'
                                }`}>
                                  {cell.differenceFromBaseEmi > 0 ? '+' : ''}
                                  {formatCurrency(cell.differenceFromBaseEmi, currency, true)}/mo
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Selected Scenario Spotlight Box */}
            {selectedCell && (
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl shadow-lg mt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Focused Scenario Inspection:
                    </span>
                    <span className="text-sm font-black text-white">
                      {selectedCell.annualRate}% Rate @ {selectedCell.tenureMonths} Months ({selectedCell.tenureYears} Years)
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 font-medium">
                    Debt-Free Target: <strong className="text-emerald-400">{new Date().getFullYear() + Math.ceil(selectedCell.tenureMonths / 12)}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
                  <div>
                    <span className="text-slate-400">Monthly EMI</span>
                    <div className="text-lg font-black text-white mt-0.5">
                      {formatCurrency(selectedCell.monthlyEmi, currency)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Interest Payable</span>
                    <div className="text-lg font-black text-amber-400 mt-0.5">
                      {formatCurrency(selectedCell.totalInterest, currency)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Loan Repayment</span>
                    <div className="text-lg font-black text-white mt-0.5">
                      {formatCurrency(selectedCell.totalPayment, currency)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Net Savings vs Base</span>
                    <div className={`text-lg font-black mt-0.5 ${
                      (selectedCell.differenceFromBaseInterest || 0) <= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {(selectedCell.differenceFromBaseInterest || 0) <= 0 ? 'Save ' : 'Extra +'}
                      {formatCurrency(Math.abs(selectedCell.differenceFromBaseInterest || 0), currency)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: Side-by-Side Detailed Comparison Cards */}
        {activeView === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {comparisonScenarios.map((scenario, idx) => {
              const isBase = Math.abs(scenario.annualRate - baseRate) < 0.001 && scenario.tenureMonths === baseTenureMonths;
              const isLowestInterest = scenario.totalInterest === result.lowestInterestCell.totalInterest;
              const isLowestEmi = scenario.monthlyEmi === result.lowestEmiCell.monthlyEmi;

              let cardTitle = `Scenario ${idx + 1}`;
              if (isBase) cardTitle = 'Current Benchmark (Base)';
              else if (isLowestInterest) cardTitle = 'Fastest Payoff (Lowest Interest)';
              else if (isLowestEmi) cardTitle = 'Lowest Monthly EMI';
              else if (scenario.annualRate > baseRate) cardTitle = 'Rate Hike Stress-Test';

              return (
                <div
                  key={`${scenario.annualRate}-${scenario.tenureMonths}`}
                  className={`rounded-2xl p-5 border transition shadow-xs flex flex-col justify-between ${
                    isBase
                      ? 'border-blue-400 bg-blue-50/20 ring-2 ring-blue-500/20'
                      : isLowestInterest
                      ? 'border-emerald-400 bg-emerald-50/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {cardTitle}
                        </span>
                        <h4 className="text-base font-black text-slate-900 mt-0.5">
                          {scenario.annualRate}% @ {scenario.tenureMonths} Mos
                        </h4>
                        <span className="text-[11px] text-slate-400 font-medium">({scenario.tenureYears} Years)</span>
                      </div>
                      {isBase && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold">
                          BASE
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Monthly EMI:</span>
                        <span className="text-base font-black text-slate-900">
                          {formatCurrency(scenario.monthlyEmi, currency)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">EMI Diff vs Base:</span>
                        <span className={`font-bold ${
                          (scenario.differenceFromBaseEmi || 0) > 0 ? 'text-rose-600' : (scenario.differenceFromBaseEmi || 0) < 0 ? 'text-emerald-600' : 'text-slate-500'
                        }`}>
                          {(scenario.differenceFromBaseEmi || 0) > 0 ? '+' : ''}
                          {formatCurrency(scenario.differenceFromBaseEmi || 0, currency)}/mo
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Total Interest:</span>
                        <span className="font-bold text-amber-700">
                          {formatCurrency(scenario.totalInterest, currency)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Interest Share:</span>
                        <span className="font-bold text-slate-700">
                          {scenario.interestToPrincipalRatio}% of loan
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Total Payment:</span>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(scenario.totalPayment, currency)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-slate-500">Debt-Free Year:</span>
                        <span className="font-black text-slate-900">
                          {new Date().getFullYear() + Math.ceil(scenario.tenureMonths / 12)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className={`p-2.5 rounded-xl text-center text-xs font-bold ${
                      (scenario.differenceFromBaseInterest || 0) < 0
                        ? 'bg-emerald-100 text-emerald-900'
                        : (scenario.differenceFromBaseInterest || 0) > 0
                        ? 'bg-rose-50 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {(scenario.differenceFromBaseInterest || 0) < 0
                        ? `Saves ${formatCurrency(Math.abs(scenario.differenceFromBaseInterest || 0), currency)} Interest`
                        : (scenario.differenceFromBaseInterest || 0) > 0
                        ? `Costs +${formatCurrency(scenario.differenceFromBaseInterest || 0, currency)} Extra`
                        : 'Current Baseline Benchmark'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 3: Comparative Charts */}
        {activeView === 'chart' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Monthly EMI Across Tenures ({tenureUnit === 'months' ? 'Months' : 'Years'}) & Rates
              </h4>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartBarData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="tenure" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => formatCurrency(val, currency, true)}
                    />
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val, currency), '']}
                      contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    {result.rates.slice(0, 4).map((r, i) => {
                      const colors = ['#059669', '#0284C7', '#6366F1', '#D97706'];
                      return <Bar key={r} dataKey={`EMI @ ${r}%`} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />;
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Total Interest Payable Across Tenures & Rates
              </h4>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartBarData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="tenure" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => formatCurrency(val, currency, true)}
                    />
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val, currency), '']}
                      contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    {result.rates.slice(0, 4).map((r, i) => {
                      const colors = ['#10B981', '#38BDF8', '#818CF8', '#F59E0B'];
                      return <Bar key={r} dataKey={`Interest @ ${r}%`} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />;
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
