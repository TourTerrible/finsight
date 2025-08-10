import React, { useState, useEffect } from 'react';
import { JourneySummary, UserStats } from '../types/financial.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

interface JourneyHistoryProps {
  userEmail: string;
  onLoadJourney?: (journeyId: number) => void;
}

const JourneyHistory: React.FC<JourneyHistoryProps> = ({ userEmail, onLoadJourney }) => {
  const [journeys, setJourneys] = useState<JourneySummary[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (userEmail) {
      fetchUserData();
    }
  }, [userEmail]);

  const fetchUserData = async () => {
    if (!userEmail) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('JourneyHistory: Starting fetchUserData');
      console.log('JourneyHistory: userEmail:', userEmail);
      console.log('JourneyHistory: token:', token ? 'Present' : 'Missing');
      
      const authHeaders = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };
      
      console.log('JourneyHistory: authHeaders:', authHeaders);

      // Fetch user journeys and stats in parallel
      const [journeysResponse, statsResponse] = await Promise.all([
        fetch(`/api/v1/journey/user/${encodeURIComponent(userEmail)}/journeys`, {
          headers: authHeaders
        }),
        fetch(`/api/v1/journey/user/${encodeURIComponent(userEmail)}/stats`, {
          headers: authHeaders
        })
      ]);

      console.log('JourneyHistory: journeysResponse status:', journeysResponse.status);
      console.log('JourneyHistory: statsResponse status:', statsResponse.status);

      if (journeysResponse.ok) {
        const journeysData = await journeysResponse.json();
        console.log('JourneyHistory: journeysData:', journeysData);
        setJourneys(journeysData);
      } else {
        const errorText = await journeysResponse.text();
        console.error('JourneyHistory: journeysResponse error:', errorText);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('JourneyHistory: statsData:', statsData);
        setUserStats(statsData);
      } else {
        const errorText = await statsResponse.text();
        console.error('JourneyHistory: statsResponse error:', errorText);
      }
    } catch (err) {
      console.error('JourneyHistory: fetchUserData error:', err);
      setError('Failed to load journey history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toLocaleString()}`;
    }
  };

  if (!userEmail) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Log in to view past journeys</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Loading journey history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchUserData}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Stats */}
      {userStats && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-4 sm:p-6 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Financial Journey</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">{userStats.total_journeys}</p>
              <p className="text-sm text-gray-600">Total Journeys</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                {new Date(userStats.member_since).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">Member Since</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                {userStats.last_journey 
                  ? new Date(userStats.last_journey).toLocaleDateString()
                  : 'Never'
                }
              </p>
              <p className="text-sm text-gray-600">Last Journey</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                {userStats.primary_currency || 'Not Set'}
              </p>
              <p className="text-sm text-gray-600">Primary Currency</p>
            </div>
          </div>
        </div>
      )}

      {/* Journey History */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Journeys</h3>
        
        {journeys.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No journeys found</p>
            <p className="text-sm text-gray-400 mt-1">
              Complete a financial simulation to create your first journey
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {journeys.map((journey) => (
              <div
                key={journey.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onLoadJourney?.(journey.id)}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        Journey #{journey.id}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {journey.currency}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-3">
                      {formatDate(journey.created_at)}
                    </p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Bank Balance</p>
                        <p className="font-medium">
                          {formatCurrency(journey.current_bank_balance, journey.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Cash Flow</p>
                        <p className={`font-medium ${
                          journey.monthly_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(journey.monthly_cash_flow, journey.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Investments</p>
                        <p className="font-medium">
                          {formatCurrency(journey.total_investments, journey.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Runway</p>
                        <p className="font-medium">
                          {journey.cash_runway_months} months
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 sm:mt-0 sm:ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoadJourney?.(journey.id);
                      }}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JourneyHistory; 