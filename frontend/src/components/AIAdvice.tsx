import React, { useState, useEffect } from 'react';
import { SimulationResult, AIAdviceResponse, UserFinancialData } from '../types/financial.ts';

interface AIAdviceProps {
  simulationResult: SimulationResult;
  userData: UserFinancialData | null;
  journeyId?: number | null;
  aiAdvice?: AIAdviceResponse | null;
  onAdviceChange?: (advice: AIAdviceResponse | null) => void;
}

const AIAdvice: React.FC<AIAdviceProps> = ({ simulationResult, userData, journeyId, aiAdvice, onAdviceChange }) => {
  const [advice, setAdvice] = useState<AIAdviceResponse | null>(aiAdvice || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch advice if not already present
    if (simulationResult && userData && !aiAdvice) {
      fetchAIAdvice();
    } else if (aiAdvice) {
      setAdvice(aiAdvice);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationResult, userData, aiAdvice, journeyId]);

  const fetchAIAdvice = async () => {
    if (!userData) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_data: userData,
          simulation_result: simulationResult,
          specific_concerns: null,
          journey_id: journeyId || undefined,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch AI advice');
      }
      const adviceData = await response.json();
      setAdvice(adviceData);
      onAdviceChange?.(adviceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      onAdviceChange?.(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Generating AI advice...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Complete the financial simulation first to get AI advice.</p>
      </div>
    );
  }

  if (!advice) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* General Advice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-xs sm:text-sm font-medium text-blue-800">General Financial Advice</h3>
            <div className="mt-2 text-xs sm:text-sm text-blue-700">
              <p className="leading-relaxed">{advice.general_advice}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-xs sm:text-sm font-medium text-yellow-800">Risk Assessment</h3>
            <div className="mt-2 text-xs sm:text-sm text-yellow-700">
              <p className="leading-relaxed">{advice.risk_assessment}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div>
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Recommended Actions</h3>
        <div className="space-y-2 sm:space-y-3">
          {advice.action_items.map((action, index) => (
            <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 text-xs sm:text-sm font-medium">{index + 1}</span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-xs sm:text-sm text-gray-900 leading-relaxed">{action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goal-Specific Advice */}
      {Object.keys(advice.goal_specific_advice).length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Goal-Specific Advice</h3>
          <div className="space-y-2 sm:space-y-3">
            {Object.entries(advice.goal_specific_advice).map(([goalKey, adviceText], index) => {
              const goalName = goalKey.split('_').slice(1).join(' ') || 'Custom Goal';
              
              return (
                <div key={goalKey} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-sm transition-shadow">
                  <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">{goalName}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{adviceText}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-xs sm:text-sm font-medium text-green-800">Pro Tips</h3>
            <div className="mt-2 text-xs sm:text-sm text-green-700">
              <ul className="list-disc list-inside space-y-1 leading-relaxed">
                <li>Review your financial plan quarterly</li>
                <li>Automate your SIP investments</li>
                <li>Keep emergency fund in liquid assets</li>
                <li>Diversify your investment portfolio</li>
                <li>Consider tax-efficient investment options</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAdvice; 