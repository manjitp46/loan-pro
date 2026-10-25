import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CurrencyType } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface DonutProps {
  principal: number;
  totalInterest: number;
  totalFees: number;
  monthlyEmi: number;
  currency: CurrencyType;
}

export const PrincipalInterestDonut: React.FC<DonutProps> = ({
  principal,
  totalInterest,
  totalFees,
  monthlyEmi,
  currency,
}) => {
  const data = [
    { name: 'Principal Amount', value: principal, color: '#059669' }, // Emerald
    { name: 'Total Interest', value: totalInterest, color: '#f59e0b' }, // Amber
    ...(totalFees > 0 ? [{ name: 'Processing Fees & Taxes', value: totalFees, color: '#6366f1' }] : []), // Indigo
  ];

  const total = principal + totalInterest + totalFees;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              stroke="#ffffff"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [formatCurrency(Number(value), currency), 'Amount']}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '12px',
                fontWeight: 600,
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Monthly EMI</span>
          <span className="text-lg sm:text-xl font-black text-slate-900">{formatCurrency(monthlyEmi, currency)}</span>
        </div>
      </div>

      {/* Legend with percentages */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-xs">
        {data.map((item, idx) => {
          const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
          return (
            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 font-medium">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-800">{formatCurrency(item.value, currency, true)}</div>
                <div className="text-[10px] text-slate-400 font-semibold">{percent}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
