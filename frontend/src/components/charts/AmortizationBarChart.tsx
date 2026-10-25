import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { AmortizationYearEntry, CurrencyType } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface BarChartProps {
  yearlyData: AmortizationYearEntry[];
  currency: CurrencyType;
}

export const AmortizationBarChart: React.FC<BarChartProps> = ({ yearlyData, currency }) => {
  const chartData = yearlyData.map((y) => ({
    name: `Yr ${y.year}`,
    principal: y.principalPaid,
    interest: y.interestPaid,
    prepayment: y.prepaymentsPaid,
    balance: y.endingBalance,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
          <YAxis
            tickFormatter={(val) => formatCurrency(val, currency, true)}
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: any, name: any) => {
              const label = name === 'principal' ? 'Principal Paid' : name === 'interest' ? 'Interest Paid' : 'Prepayment';
              return [formatCurrency(Number(value), currency), label];
            }}
            contentStyle={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontSize: '12px',
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => {
              if (value === 'principal') return <span className="text-xs font-semibold text-slate-700">Principal</span>;
              if (value === 'interest') return <span className="text-xs font-semibold text-slate-700">Interest</span>;
              return <span className="text-xs font-semibold text-slate-700">Prepayment</span>;
            }}
          />
          <Bar dataKey="principal" stackId="a" fill="#059669" radius={[0, 0, 0, 0]} />
          <Bar dataKey="interest" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
          <Bar dataKey="prepayment" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
