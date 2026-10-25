import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Download, FileSpreadsheet, FileText, Share2, Eye, EyeOff } from 'lucide-react';
import { AmortizationYearEntry, CurrencyType, EmiCalculationResult } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { exportScheduleToCsv, exportScheduleToPdf } from '../../utils/exportUtils';

interface TableProps {
  result: EmiCalculationResult;
  currency: CurrencyType;
  loanTitle: string;
  onSaveShare: () => void;
}

export const AmortizationTable: React.FC<TableProps> = ({
  result,
  currency,
  loanTitle,
  onSaveShare,
}) => {
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});
  const [viewMode, setViewMode] = useState<'yearly' | 'all_months'>('yearly');

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  const expandAll = () => {
    const all: Record<number, boolean> = {};
    result.schedule.yearly.forEach((y) => (all[y.year] = true));
    setExpandedYears(all);
  };

  const collapseAll = () => {
    setExpandedYears({});
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">Payment Amortization Schedule</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete principal, interest, and balance breakdown over {result.schedule.yearly.length} years
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewMode('yearly')}
              className={`px-3 py-1.5 rounded-md transition ${
                viewMode === 'yearly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yearly View
            </button>
            <button
              onClick={() => setViewMode('all_months')}
              className={`px-3 py-1.5 rounded-md transition ${
                viewMode === 'all_months' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Months
            </button>
          </div>

          {viewMode === 'yearly' && (
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={expandAll}
                className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-200/50 rounded-lg transition"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-200/50 rounded-lg transition"
              >
                Collapse All
              </button>
            </div>
          )}

          {/* Export buttons */}
          <button
            onClick={() => exportScheduleToCsv(result.schedule.yearly, currency)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-xs transition"
            title="Download CSV Spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => exportScheduleToPdf(result, loanTitle, currency)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-xs transition"
            title="Download PDF Statement"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>PDF</span>
          </button>

          <button
            onClick={onSaveShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
            title="Save and Share Report"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-100/80 text-slate-700 uppercase text-[11px] font-bold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Period</th>
              <th className="py-3 px-4 text-right">Beginning Balance</th>
              <th className="py-3 px-4 text-right text-emerald-700">Principal</th>
              <th className="py-3 px-4 text-right text-amber-700">Interest</th>
              <th className="py-3 px-4 text-right text-blue-700">Prepayment</th>
              <th className="py-3 px-4 text-right">Total Payment</th>
              <th className="py-3 px-4 text-right">Ending Balance</th>
              <th className="py-3 px-4 text-center">Remaining</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {viewMode === 'yearly'
              ? result.schedule.yearly.map((yearEntry) => {
                  const isExpanded = !!expandedYears[yearEntry.year];
                  return (
                    <React.Fragment key={`year-${yearEntry.year}`}>
                      {/* Year Row */}
                      <tr
                        onClick={() => toggleYear(yearEntry.year)}
                        className={`cursor-pointer transition-colors font-medium ${
                          isExpanded ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-4 flex items-center gap-2 font-bold text-slate-900">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                          <span>Year {yearEntry.year}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-600">
                          {formatCurrency(yearEntry.beginningBalance, currency)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">
                          {formatCurrency(yearEntry.principalPaid, currency)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-amber-600">
                          {formatCurrency(yearEntry.interestPaid, currency)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-blue-600">
                          {yearEntry.prepaymentsPaid > 0 ? formatCurrency(yearEntry.prepaymentsPaid, currency) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(yearEntry.totalPayment, currency)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">
                          {formatCurrency(yearEntry.endingBalance, currency)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-1.5 rounded-full"
                                style={{ width: `${yearEntry.loanBalancePercentage}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 w-8 text-right">
                              {yearEntry.loanBalancePercentage}%
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Monthly Rows */}
                      {isExpanded &&
                        yearEntry.months.map((m) => (
                          <tr key={`m-${m.month}`} className="bg-slate-50/80 text-xs hover:bg-slate-100/80">
                            <td className="py-2.5 px-4 pl-10 text-slate-600 font-medium">
                              Month {m.month} <span className="text-slate-400">({m.date})</span>
                            </td>
                            <td className="py-2.5 px-4 text-right text-slate-500">
                              {formatCurrency(m.beginningBalance, currency)}
                            </td>
                            <td className="py-2.5 px-4 text-right text-emerald-700 font-medium">
                              {formatCurrency(m.principal, currency)}
                            </td>
                            <td className="py-2.5 px-4 text-right text-amber-700 font-medium">
                              {formatCurrency(m.interest, currency)}
                            </td>
                            <td className="py-2.5 px-4 text-right text-blue-700 font-medium">
                              {m.prepayment > 0 ? formatCurrency(m.prepayment, currency) : '-'}
                            </td>
                            <td className="py-2.5 px-4 text-right text-slate-700">
                              {formatCurrency(m.emi, currency)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-semibold text-slate-800">
                              {formatCurrency(m.endingBalance, currency)}
                            </td>
                            <td className="py-2.5 px-4 text-center text-slate-400">-</td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })
              : result.schedule.monthly.map((m) => (
                  <tr key={`full-m-${m.month}`} className="hover:bg-slate-50 text-xs">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      Month {m.month} <span className="text-slate-400 font-normal">({m.date})</span>
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-500">
                      {formatCurrency(m.beginningBalance, currency)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-emerald-600">
                      {formatCurrency(m.principal, currency)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-amber-600">
                      {formatCurrency(m.interest, currency)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-blue-600">
                      {m.prepayment > 0 ? formatCurrency(m.prepayment, currency) : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(m.emi, currency)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                      {formatCurrency(m.endingBalance, currency)}
                    </td>
                    <td className="py-2.5 px-4 text-center text-slate-400">
                      {result.principalAmount > 0
                        ? `${Math.round((m.endingBalance / result.principalAmount) * 100)}%`
                        : '0%'}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
