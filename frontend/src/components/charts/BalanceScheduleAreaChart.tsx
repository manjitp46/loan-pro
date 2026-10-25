import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AmortizationYearEntry, CurrencyType } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface AreaChartProps {
  yearlyData: AmortizationYearEntry[];
  currency: CurrencyType;
}

export const BalanceScheduleAreaChart: React.FC<AreaChartProps> = ({ yearlyData, currency }) => {
  const chartData = yearlyData.map((y) => ({
    name: `Year ${y.year}`,
    balance: y.endingBalance,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
          <YAxis
            tickFormatter={(val) => formatCurrency(val, currency, true)}
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: any) => [formatCurrency(Number(value), currency), 'Outstanding Balance']}
            contentStyle={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontSize: '12px',
              fontWeight: 600,
            }}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#059669"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#balanceGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
