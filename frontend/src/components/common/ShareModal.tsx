import React, { useState } from 'react';
import { X, Copy, Check, Share2, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: {
    title: string;
    shareCode: string;
    shareUrl: string;
  } | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareData }) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !shareData) return null;

  const fullUrl = `${window.location.origin}/share/${shareData.shareCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Report Saved & Ready to Share</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Your calculation <span className="font-bold text-slate-800">"{shareData.title}"</span> has been persisted to the database. Share this unique link with anyone to review:
        </p>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl p-2.5">
          <input
            type="text"
            readOnly
            value={fullUrl}
            className="w-full text-xs font-mono font-semibold text-slate-800 bg-transparent outline-none truncate"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition flex-shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
