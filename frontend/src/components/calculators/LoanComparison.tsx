import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Award, TrendingDown, ArrowDownRight, FileText, Share2, CheckCircle2, Check } from 'lucide-react';
import { CurrencyType, LoanComparisonResult, LoanOfferItem } from '../../types';
import { ClientCalculatorEngine } from '../../utils/calculatorEngine';
import { formatCurrency, formatPercent, getCurrencySymbol } from '../../utils/formatters';
import { NumericInput } from '../common/NumericInput';
import { exportComparisonToPdf } from '../../utils/exportUtils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { copyToClipboard, generateShareUrl, syncAppState } from '../../utils/urlState';

interface ComparisonProps {
  currency: CurrencyType;
  onSaveShare: (payload: any) => void;
}

export const LoanComparison: React.FC<ComparisonProps> = ({ currency, onSaveShare }) => {
  const [offers, setOffers] = useState<LoanOfferItem[]>([
    {
      id: 'offer-1',
      bankName: 'HDFC Bank',
      principal: 5000000,
      annualRate: 8.5,
      tenureMonths: 240,
      processingFeePercent: 0.5,
      flatProcessingFee: 0,
      otherCharges: 3000,
    },
    {
      id: 'offer-2',
      bankName: 'SBI Privilege',
      principal: 5000000,
      annualRate: 8.4,
      tenureMonths: 240,
      processingFeePercent: 0.35,
      flatProcessingFee: 0,
      otherCharges: 2000,
    },
    {
      id: 'offer-3',
      bankName: 'ICICI Express',
      principal: 5000000,
      annualRate: 8.65,
      tenureMonths: 240,
      processingFeePercent: 0.25,
      flatProcessingFee: 1500,
      otherCharges: 1000,
    },
  ]);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  useEffect(() => {
    syncAppState({
      tab: 'comparison',
      currency,
    });
  }, [currency]);

  const handleCopyDirectLink = async () => {
    const url = generateShareUrl({
      tab: 'comparison',
      currency,
    });
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 3000);
    }
  };

  const updateOffer = (id: string, field: keyof LoanOfferItem, value: any) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  };

  const addOffer = () => {
    if (offers.length >= 4) return;
    const newId = `offer-${Date.now()}`;
    const base = offers[0] || { principal: 5000000, tenureMonths: 240 };
    setOffers((prev) => [
      ...prev,
      {
        id: newId,
        bankName: `Lender ${prev.length + 1}`,
        principal: base.principal,
        annualRate: 8.75,
        tenureMonths: base.tenureMonths,
        processingFeePercent: 0.5,
        flatProcessingFee: 0,
        otherCharges: 2000,
      },
    ]);
  };

  const removeOffer = (id: string) => {
    if (offers.length <= 2) return;
    setOffers((prev) => prev.filter((o) => o.id !== id));
  };

  // Run calculation engine
  const comparisonResult: LoanComparisonResult = ClientCalculatorEngine.compareOffers(offers);

  // Prepare chart data
  const chartData = comparisonResult.offers.map((o) => ({
    name: o.bankName,
    principal: o.principal,
    interest: o.totalInterest,
    fees: o.totalFees,
    emi: o.monthlyEmi,
  }));

  const handleShare = () => {
    onSaveShare({
      title: `Side-by-Side Comparison of ${offers.length} Loan Offers`,
      calculatorType: 'comparison',
      loanType: 'home',
      inputData: { offers },
      resultSummary: {
        bestBank: comparisonResult.offers.find((o) => o.id === comparisonResult.bestOverallOfferId)?.bankName,
        offers: comparisonResult.offers.map((o) => ({
          bankName: o.bankName,
          emi: o.monthlyEmi,
          totalCost: o.totalCost,
          apr: o.effectiveApr,
        })),
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Side-by-Side Loan Comparison</h2>
          <p className="text-xs text-slate-500 mt-1">
            Evaluate interest rates, processing charges, APR, and lifetime repayments to discover your maximum savings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {offers.length < 4 && (
            <button
              onClick={addOffer}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Loan Offer</span>
            </button>
          )}

          <button
            onClick={handleCopyDirectLink}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition shadow-sm ${
              copiedUrl
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
            }`}
            title="Copy direct share URL for comparison"
          >
            {copiedUrl ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4 text-emerald-600" />}
            <span>{copiedUrl ? 'Copied!' : 'Copy Direct URL'}</span>
          </button>

          <button
            onClick={() => exportComparisonToPdf(comparisonResult, currency)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>PDF Export</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Comparison Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {comparisonResult.offers.map((offer) => {
          const isBestOverall = offer.id === comparisonResult.bestOverallOfferId;
          const orig = offers.find((o) => o.id === offer.id);

          return (
            <div
              key={offer.id}
              className={`relative bg-white rounded-2xl border transition-all flex flex-col justify-between shadow-sm overflow-hidden ${
                isBestOverall
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-slate-200'
              }`}
            >
              {/* Best Value Banner */}
              {isBestOverall && (
                <div className="bg-emerald-600 text-white text-[11px] font-bold py-1 px-3 flex items-center justify-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>RECOMMENDED BEST VALUE</span>
                </div>
              )}

              <div className="p-5 space-y-4">
                {/* Header with editable Lender Name & Delete Button */}
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={offer.bankName}
                    onChange={(e) => updateOffer(offer.id, 'bankName', e.target.value)}
                    className="font-bold text-slate-900 text-base bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 outline-none w-3/4"
                  />
                  {offers.length > 2 && (
                    <button
                      onClick={() => removeOffer(offer.id)}
                      className="text-slate-400 hover:text-rose-500 transition"
                      title="Remove Loan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Editable Parameters */}
                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-slate-500 font-medium">Loan Amount</label>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 mt-0.5 focus-within:border-emerald-500">
                      <span className="font-bold text-slate-400 mr-1">{getCurrencySymbol(currency)}</span>
                      <NumericInput
                        min={0}
                        value={orig?.principal || offer.principal}
                        onChange={(val) => updateOffer(offer.id, 'principal', val)}
                        className="w-full font-bold text-slate-800 bg-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-500 font-medium">Rate (% p.a.)</label>
                      <NumericInput
                        step="0.05"
                        min={0}
                        max={30}
                        value={orig?.annualRate || offer.annualRate}
                        onChange={(val) => updateOffer(offer.id, 'annualRate', val)}
                        className="w-full font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 mt-0.5 outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Tenure (Years)</label>
                      <NumericInput
                        min={1}
                        max={35}
                        value={Math.round((orig?.tenureMonths || offer.tenureMonths) / 12)}
                        onChange={(val) => updateOffer(offer.id, 'tenureMonths', val * 12)}
                        className="w-full font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 mt-0.5 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-500 font-medium">Proc. Fee (%)</label>
                      <NumericInput
                        step="0.1"
                        min={0}
                        max={10}
                        value={orig?.processingFeePercent ?? 0.5}
                        onChange={(val) => updateOffer(offer.id, 'processingFeePercent', val)}
                        className="w-full font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 mt-0.5 outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium">Other Fees</label>
                      <NumericInput
                        min={0}
                        value={orig?.otherCharges ?? 0}
                        onChange={(val) => updateOffer(offer.id, 'otherCharges', val)}
                        className="w-full font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 mt-0.5 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Key Outputs */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Monthly EMI</span>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900">{formatCurrency(offer.monthlyEmi, currency)}</span>
                      {offer.isLowestEmi && (
                        <span className="block text-[10px] text-emerald-600 font-bold">Lowest EMI</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Total Interest</span>
                      <span className="font-bold text-slate-800">{formatCurrency(offer.totalInterest, currency)}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Fees & Charges</span>
                      <span className="font-bold text-slate-800">{formatCurrency(offer.totalFees, currency)}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Effective APR</span>
                      <span className="font-bold text-emerald-600">{formatPercent(offer.effectiveApr)}</span>
                    </div>

                    <div className="flex justify-between py-1.5 font-bold text-slate-900">
                      <span>Total Cost</span>
                      <span className="text-sm">{formatCurrency(offer.totalCost, currency)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Difference Pill */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 text-xs">
                {offer.differenceFromCheapestTotal === 0 ? (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Most Economical Choice</span>
                  </div>
                ) : (
                  <div className="text-rose-600 font-semibold flex items-center justify-between">
                    <span>Extra Cost vs Best:</span>
                    <span className="font-bold">+{formatCurrency(offer.differenceFromCheapestTotal, currency)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparative Bar Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
          Visual Cost Breakdown Comparison
        </h3>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} tickLine={false} />
              <YAxis
                tickFormatter={(val) => formatCurrency(val, currency, true)}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(val: any, name: any) => [
                  formatCurrency(Number(val), currency),
                  name === 'principal' ? 'Principal' : name === 'interest' ? 'Total Interest' : 'Fees & Taxes',
                ]}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px',
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="principal" name="Principal" fill="#059669" stackId="a" />
              <Bar dataKey="interest" name="Total Interest" fill="#f59e0b" stackId="a" />
              <Bar dataKey="fees" name="Fees & Charges" fill="#6366f1" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
