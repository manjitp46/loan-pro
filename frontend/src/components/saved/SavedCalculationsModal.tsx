import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Trash2, ExternalLink, Bookmark, Clock } from 'lucide-react';
import { CurrencyType, SavedCalculationItem } from '../../types';
import { deleteSaved, fetchSavedList } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

interface SavedModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: CurrencyType;
  onSelectCalculation?: (item: SavedCalculationItem) => void;
}

export const SavedCalculationsModal: React.FC<SavedModalProps> = ({
  isOpen,
  onClose,
  currency,
  onSelectCalculation,
}) => {
  const [items, setItems] = useState<SavedCalculationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadList();
    }
  }, [isOpen]);

  const loadList = async () => {
    setLoading(true);
    const data = await fetchSavedList();
    setItems(data);
    setLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this saved calculation?')) {
      await deleteSaved(id);
      loadList();
    }
  };

  const handleCopyLink = (shareCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/share/${shareCode}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(shareCode);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Saved Calculations & Comparison Reports</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs font-semibold">Loading saved records...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No saved calculations yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click the "Share" button on any calculator to generate persistent shareable reports stored in SQLite.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectCalculation && onSelectCalculation(item)}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {item.calculatorType}
                    </span>
                    <span className="text-xs font-bold text-slate-400 font-mono">#{item.shareCode}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={(e) => handleCopyLink(item.shareCode, e)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition border border-slate-200"
                    title="Copy Shareable Link"
                  >
                    {copiedCode === item.shareCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
