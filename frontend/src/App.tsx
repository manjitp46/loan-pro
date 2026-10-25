import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { EmiCalculator } from './components/calculators/EmiCalculator';
import { LoanComparison } from './components/calculators/LoanComparison';
import { PrepaymentSimulator } from './components/calculators/PrepaymentSimulator';
import { BalanceTransfer } from './components/calculators/BalanceTransfer';
import { EligibilityCalculator } from './components/calculators/EligibilityCalculator';
import { FixedVsFloating } from './components/calculators/FixedVsFloating';
import { SavedCalculationsModal } from './components/saved/SavedCalculationsModal';
import { ShareModal } from './components/common/ShareModal';
import { CurrencyType, LoanPreset, SavedCalculationItem } from './types';
import { fetchPresets, fetchSavedByCode, saveCalculation } from './services/api';
import { Shield, Sparkles, CheckCircle, Calculator, Info } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('emi');
  const [currency, setCurrency] = useState<CurrencyType>('INR');
  const [presets, setPresets] = useState<LoanPreset[]>([]);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState<boolean>(false);
  const [shareModalData, setShareModalData] = useState<{
    title: string;
    shareCode: string;
    shareUrl: string;
  } | null>(null);

  // Load presets on mount
  useEffect(() => {
    fetchPresets().then((data) => {
      if (data && data.length > 0) {
        setPresets(data);
      }
    });

    // Check if URL has shared code: e.g. /share/XYZ or ?share=XYZ
    const pathParts = window.location.pathname.split('/');
    let code: string | null = null;
    if (pathParts[1] === 'share' && pathParts[2]) {
      code = pathParts[2];
    } else {
      const params = new URLSearchParams(window.location.search);
      code = params.get('share');
    }

    if (code) {
      fetchSavedByCode(code).then((data) => {
        if (data && data.calculatorType) {
          setActiveTab(data.calculatorType);
        }
      });
    }
  }, []);

  const handleSaveShare = async (payload: any) => {
    try {
      const res = await saveCalculation(payload);
      setShareModalData({
        title: payload.title,
        shareCode: res.shareCode,
        shareUrl: res.shareUrl,
      });
    } catch (err: any) {
      alert(`Could not save calculation: ${err.message}`);
    }
  };

  const handleSelectSaved = (item: SavedCalculationItem) => {
    setActiveTab(item.calculatorType);
    setIsSavedModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        onOpenSaved={() => setIsSavedModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {activeTab === 'emi' && (
          <EmiCalculator
            currency={currency}
            presets={presets}
            onSaveShare={handleSaveShare}
          />
        )}

        {activeTab === 'comparison' && (
          <LoanComparison
            currency={currency}
            onSaveShare={handleSaveShare}
          />
        )}

        {activeTab === 'prepayment' && (
          <PrepaymentSimulator
            currency={currency}
            onSaveShare={handleSaveShare}
          />
        )}

        {activeTab === 'transfer' && (
          <BalanceTransfer
            currency={currency}
            onSaveShare={handleSaveShare}
          />
        )}

        {activeTab === 'eligibility' && (
          <EligibilityCalculator
            currency={currency}
            onSaveShare={handleSaveShare}
          />
        )}

        {activeTab === 'floating' && (
          <FixedVsFloating
            currency={currency}
            onSaveShare={handleSaveShare}
          />
        )}
      </main>

      {/* Feature Information Highlights */}
      <section className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Institutional Grade Math</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Calculates exact reducing balance compounding EMI, annual percentage rate (APR), and tax breakdowns used by leading banking systems.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Prepayment & Refinancing Intelligence</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Discover how extra monthly contributions or balance transfers slice off lakhs in compound interest and accelerate debt freedom.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Persistent SQLite & Share Reports</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Save comparison simulations directly to persistent local SQLite storage. Generate unique share links, CSV tables, and PDF statements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Calculator className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-bold text-white">LoanPro Platform</span>
            <span className="text-slate-600">|</span>
            <span>Inspired by emicalculator.net</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Dockerized Architecture</span>
            <span>•</span>
            <span>React & Express TypeScript</span>
            <span>•</span>
            <span>SQLite Storage</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SavedCalculationsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        currency={currency}
        onSelectCalculation={handleSelectSaved}
      />

      <ShareModal
        isOpen={!!shareModalData}
        onClose={() => setShareModalData(null)}
        shareData={shareModalData}
      />
    </div>
  );
};
