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
import { fetchPresets, fetchSavedByCode, fetchSettings, saveCalculation } from './services/api';
import { Shield, Sparkles, CheckCircle, Calculator, Info, Megaphone, X, Settings } from 'lucide-react';

const BANNER_GRADIENTS: Record<string, string> = {
  emerald: 'from-emerald-600 to-teal-700',
  blue: 'from-blue-600 to-cyan-700',
  indigo: 'from-indigo-600 to-violet-700',
  violet: 'from-violet-600 to-fuchsia-700',
  rose: 'from-rose-600 to-pink-700',
  amber: 'from-amber-600 to-orange-700',
};

const FOOTER_THEMES: Record<string, { iconBg: string; linkColor: string }> = {
  emerald: { iconBg: 'bg-emerald-600', linkColor: 'text-emerald-400 hover:text-emerald-300' },
  blue: { iconBg: 'bg-blue-600', linkColor: 'text-blue-400 hover:text-blue-300' },
  indigo: { iconBg: 'bg-indigo-600', linkColor: 'text-indigo-400 hover:text-indigo-300' },
  violet: { iconBg: 'bg-violet-600', linkColor: 'text-violet-400 hover:text-violet-300' },
  rose: { iconBg: 'bg-rose-600', linkColor: 'text-rose-400 hover:text-rose-300' },
  amber: { iconBg: 'bg-amber-600', linkColor: 'text-amber-400 hover:text-amber-300' },
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('emi');
  const [currency, setCurrency] = useState<CurrencyType>('INR');
  const [presets, setPresets] = useState<LoanPreset[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [showBanner, setShowBanner] = useState<boolean>(true);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState<boolean>(false);
  const [shareModalData, setShareModalData] = useState<{
    title: string;
    shareCode: string;
    shareUrl: string;
  } | null>(null);

  // Load presets and settings on mount
  useEffect(() => {
    fetchPresets().then((data) => {
      if (data && data.length > 0) {
        setPresets(data);
      }
    });

    fetchSettings().then((cfg) => {
      if (cfg) {
        setSettings(cfg);
        if (cfg.site_title) {
          document.title = cfg.site_title;
        }
        if (cfg.default_currency) {
          setCurrency(cfg.default_currency as CurrencyType);
        }
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

  const activeTheme = settings.brand_theme || 'emerald';
  const bannerGradient = BANNER_GRADIENTS[activeTheme] || BANNER_GRADIENTS.emerald;
  const footerTheme = FOOTER_THEMES[activeTheme] || FOOTER_THEMES.emerald;
  const brandName = settings.site_title ? settings.site_title.split(' - ')[0] : 'LoanPro';

  const supportedCurrencies = settings.supported_currencies
    ? settings.supported_currencies.split(',').map((s) => s.trim()).filter(Boolean)
    : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Dynamic Announcement Banner (Configured via Admin Console) */}
      {settings.banner_enabled === 'true' && settings.announcement_banner && showBanner && (
        <div className={`bg-gradient-to-r ${bannerGradient} text-white text-xs font-semibold px-4 py-2 flex items-center justify-between shadow-xs transition-colors duration-300`}>
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-center sm:text-left flex-1 justify-center sm:justify-start">
            <Megaphone className="w-4 h-4 text-white/90 flex-shrink-0" />
            <span>{settings.announcement_banner}</span>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="p-1 hover:bg-white/20 rounded-md transition text-white/80 hover:text-white"
            title="Dismiss Announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        onOpenSaved={() => setIsSavedModalOpen(true)}
        siteTitle={settings.site_title}
        brandTheme={activeTheme}
        supportedCurrencies={supportedCurrencies}
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
            <div className={`w-6 h-6 rounded-lg ${footerTheme.iconBg} flex items-center justify-center text-white transition-colors duration-300`}>
              <Calculator className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-bold text-white">{brandName} Platform</span>
            <span className="text-slate-600">|</span>
            <span>{settings.site_tagline || 'Institutional-Grade EMI & Loan Comparison Engine'}</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>{settings.footer_disclaimer || 'LoanPro financial calculations are for estimation purposes.'}</span>
            <span>•</span>
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-1 ${footerTheme.linkColor} font-bold transition`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </a>
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
