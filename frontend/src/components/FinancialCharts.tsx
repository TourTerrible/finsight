import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { SimulationResult, Currency } from '../types/financial.ts';

interface FinancialChartsProps {
  data: SimulationResult;
  currency?: Currency;
}

const FinancialCharts: React.FC<FinancialChartsProps> = ({ data, currency = Currency.INR }) => {
  // Currency symbol mapping
  const getCurrencySymbol = (curr: Currency): string => {
    const symbols = {
      [Currency.USD]: '$',
      [Currency.EUR]: '€',
      [Currency.GBP]: '£',
      [Currency.CAD]: 'C$',
      [Currency.AUD]: 'A$',
      [Currency.SGD]: 'S$',
      [Currency.AED]: 'د.إ',
      [Currency.JPY]: '¥',
      [Currency.INR]: '₹',
    };
    return symbols[curr] || '₹';
  };

  // Currency locale mapping
  const getCurrencyLocale = (curr: Currency): string => {
    const locales = {
      [Currency.USD]: 'en-US',
      [Currency.EUR]: 'de-DE',
      [Currency.GBP]: 'en-GB',
      [Currency.CAD]: 'en-CA',
      [Currency.AUD]: 'en-AU',
      [Currency.SGD]: 'en-SG',
      [Currency.AED]: 'ar-AE',
      [Currency.JPY]: 'ja-JP',
      [Currency.INR]: 'en-IN',
    };
    return locales[curr] || 'en-IN';
  };

  const formatCurrency = (value: number) => {
    const locale = getCurrencyLocale(currency);
    const currencyCode = currency.toString();
    
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: currency === Currency.JPY ? 0 : 0,
        maximumFractionDigits: currency === Currency.JPY ? 0 : 0,
      }).format(value);
    } catch (error) {
      // Fallback to manual formatting if Intl.NumberFormat fails
      const symbol = getCurrencySymbol(currency);
      return `${symbol}${value.toLocaleString()}`;
    }
  };

  const formatTooltip = (value: number) => {
    return formatCurrency(value);
  };

  const currencySymbol = getCurrencySymbol(currency);

  // Prepare data for charts
  const netWorthData = Object.entries(data.net_worth_by_year).map(([year, value]) => ({
    year: parseInt(year),
    netWorth: value,
  }));

  const cashRunwayData = [
    { name: 'Cash Runway', months: data.cash_runway_months },
  ];

  const monthlyCashFlowData = [
    { name: 'Monthly Cash Flow', amount: data.monthly_cash_flow },
  ];

  // const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']; // Reserved for future use

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Net Worth Projection Chart */}
      <div>
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Net Worth Projection</h3>
        <div className="bg-gray-50 rounded-lg p-2 sm:p-4 overflow-hidden">
          <ResponsiveContainer width="100%" height={250} minHeight={200}>
            <LineChart data={netWorthData} margin={{ top: 5, right: 20, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="year" 
                label={{ value: 'Years', position: 'insideBottom', offset: -10 }}
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#9ca3af' }}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                label={{ value: `Net Worth (${currencySymbol})`, angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 11 }}
                axisLine={{ stroke: '#9ca3af' }}
                width={80}
              />
              <Tooltip 
                formatter={formatTooltip} 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="netWorth" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2, fill: 'white' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
          <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Cash Runway</h4>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {data.cash_runway_months} months
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            {Math.round(data.cash_runway_months / 12 * 10) / 10} years
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
          <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Monthly Cash Flow</h4>
          <p className={`text-xl sm:text-2xl font-bold ${data.monthly_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.monthly_cash_flow)}
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            {data.monthly_cash_flow >= 0 ? 'Positive' : 'Negative'}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Total Investments</h4>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {formatCurrency(data.total_investments)}
          </p>
          <p className="text-xs sm:text-sm text-gray-500">End of projection</p>
        </div>
      </div>

      {/* Charts Row - Emergency Fund and Cash Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Runway Visualization */}
        <div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Emergency Fund Status</h3>
          <div className="bg-gray-50 rounded-lg p-2 sm:p-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={cashRunwayData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11 }}
                  axisLine={{ stroke: '#9ca3af' }}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  axisLine={{ stroke: '#9ca3af' }}
                />
                <Tooltip 
                  formatter={(value) => `${value} months`}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="months" 
                  fill={data.cash_runway_months >= 6 ? '#10b981' : data.cash_runway_months >= 3 ? '#f59e0b' : '#ef4444'}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                Recommended: 6+ months of expenses
              </p>
              <p className={`text-xs sm:text-sm font-medium mt-1 ${
                data.cash_runway_months >= 6 ? 'text-green-600' : 
                data.cash_runway_months >= 3 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {data.cash_runway_months >= 6 ? '✅ Good emergency fund' :
                 data.cash_runway_months >= 3 ? '⚠️ Emergency fund needs improvement' :
                 '🚨 Emergency fund is too low'}
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Cash Flow Visualization */}
        <div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Monthly Cash Flow</h3>
          <div className="bg-gray-50 rounded-lg p-2 sm:p-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyCashFlowData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11 }}
                  axisLine={{ stroke: '#9ca3af' }}
                />
                <YAxis 
                  tickFormatter={formatCurrency} 
                  tick={{ fontSize: 11 }}
                  axisLine={{ stroke: '#9ca3af' }}
                  width={60}
                />
                <Tooltip 
                  formatter={formatTooltip}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  fill={data.monthly_cash_flow >= 0 ? '#10b981' : '#ef4444'}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                Net monthly income after expenses
              </p>
              <p className={`text-xs sm:text-sm font-medium mt-1 ${
                data.monthly_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.monthly_cash_flow >= 0 ? '✅ Positive cash flow' : '❌ Negative cash flow'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Feasibility Summary */}
      {Object.keys(data.goal_feasibility).length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Goal Feasibility</h3>
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <div className="space-y-3">
              {Object.entries(data.goal_feasibility).map(([goalKey, isFeasible], index) => {
                const timeline = data.goal_timeline[goalKey];
                const goalName = goalKey.split('_').slice(1).join(' ') || 'Custom Goal';
                
                return (
                  <div key={goalKey} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow">
                    <div className="mb-2 sm:mb-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">{goalName}</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {isFeasible ? `Achievable in ${timeline} years` : 'Not achievable in projection period'}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium self-start sm:self-center ${
                      isFeasible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isFeasible ? '✅ Feasible' : '❌ Not Feasible'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialCharts; 