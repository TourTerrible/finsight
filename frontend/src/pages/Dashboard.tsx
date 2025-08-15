import React, { useState } from 'react';
import FinancialForm from '../components/FinancialForm.tsx';
import FinancialCharts from '../components/FinancialCharts.tsx';
import AIAdvice from '../components/AIAdvice.tsx';
import JourneyHistory from '../components/JourneyHistory.tsx';
import GoogleLoginButton from '../components/GoogleLoginButton.tsx';
import PDFExport from '../components/PDFExport.tsx';
import RunAnalysisModal from '../components/RunAnalysisModal.tsx';
import { UserFinancialData, SimulationResult, AIAdviceResponse } from '../types/financial.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import API_ENDPOINTS from '../config/api.tsx';

interface JourneyDetail {
  id: number;
  created_at: string;
  user_email: string;
  current_bank_balance: number;
  monthly_income?: number;
  monthly_expenses: number;
  monthly_sip: number;
  other_investments: number;
  currency: string;
  age: number;
  marital_status: string;
  dependents: number;
  annual_return_rate: number;
  projection_years: number;
  goals: any[];
  net_worth_by_year: Record<string, number>;
  cash_runway_months: number;
  monthly_cash_flow: number;
  total_investments: number;
  liquid_cash_end: number;
  goal_feasibility: Record<string, any>;
  goal_timeline: Record<string, any>;
  ai_general_advice?: string;
  ai_action_items?: string[];
  ai_risk_assessment?: string;
  ai_goal_specific_advice?: Record<string, any>;
}

const Dashboard: React.FC = () => {
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [userData, setUserData] = useState<UserFinancialData | null>(null);
  const [aiAdvice, setAIAdvice] = useState<AIAdviceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'simulation' | 'history'>('simulation');
  const [showSignInModal, setShowSignInModal] = useState(false);
  const { isAuthenticated, user, logout, loading: authLoading, token } = useAuth();
  // Add state for journey details modal
  const [selectedJourneyId, setSelectedJourneyId] = useState<number | null>(null);
  const [journeyDetail, setJourneyDetail] = useState<JourneyDetail | null>(null);
  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [journeyDetailLoading, setJourneyDetailLoading] = useState(false);
  const [journeyDetailError, setJourneyDetailError] = useState<string | null>(null);
  const [journeyId, setJourneyId] = useState<number | null>(null);

  const handleSimulation = async (formData: UserFinancialData) => {
    console.log('handleSimulation called with:', formData);
    setLoading(true);
    setError(null);
    setAIAdvice(null); // Reset AI advice when starting new simulation
    
    try {
      console.log('Making API request to /api/v1/simulate');
      const response = await fetch(API_ENDPOINTS.SIMULATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`Failed to simulate financial projection: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      // result: { result: SimulationResult, journey_id: number }
      setSimulationResult(result.result);
      setUserData(formData);
      setJourneyId(result.journey_id || null);
      setAIAdvice(null); // Reset AI advice when starting new simulation
      setActiveTab('simulation');
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadJourney = async (journeyId: number) => {
    if (!user?.email) return;
    try {
      const response = await fetch(API_ENDPOINTS.JOURNEY_DETAIL(journeyId), {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch journey details');
      }
      const data = await response.json();
      setSimulationResult({
        net_worth_by_year: data.net_worth_by_year,
        cash_runway_months: data.cash_runway_months,
        monthly_cash_flow: data.monthly_cash_flow,
        total_investments: data.total_investments,
        liquid_cash_end: data.liquid_cash_end,
        goal_feasibility: data.goal_feasibility,
        goal_timeline: data.goal_timeline,
        projection_years: data.projection_years,
      });
      setUserData({
        current_bank_balance: data.current_bank_balance,
        monthly_income: data.monthly_income,
        monthly_expenses: data.monthly_expenses,
        other_investments: data.other_investments,
        currency: data.currency,
        age: data.age,
        marital_status: data.marital_status,
        dependents: data.dependents,
        projection_years: data.projection_years,
        goals: data.goals,
        email: data.user_email,
        investments: data.investments || [], // Add investments field
      });
      setJourneyId(data.id);
      // If advice exists, set it; otherwise, set null to trigger fetch
      if (data.ai_general_advice || data.ai_action_items || data.ai_risk_assessment || data.ai_goal_specific_advice) {
        setAIAdvice({
          general_advice: data.ai_general_advice,
          action_items: data.ai_action_items,
          risk_assessment: data.ai_risk_assessment,
          goal_specific_advice: data.ai_goal_specific_advice,
        });
      } else {
        setAIAdvice(null);
      }
      setActiveTab('simulation');
    } catch (err) {
      alert('Failed to load journey details');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6">
            <div className="flex items-center mb-2 sm:mb-0">
              <div className="flex-shrink-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">FinSight</h1>
                <p className="text-xs sm:text-sm text-gray-500">AI-Powered Personal Financial Planner</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-4">
                  <div className="text-xs sm:text-sm text-gray-600">
                    Welcome, {user.email}
                  </div>
                  <button
                    onClick={logout}
                    className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSignInModal(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded shadow hover:bg-primary-700 transition"
                >
                  Sign In
                </button>
              )}
              <div className="text-xs sm:text-sm text-gray-500">
                Financial Health: 
                <span className="ml-1 sm:ml-2 font-semibold text-green-600">
                  {simulationResult ? 'Good' : 'Not Calculated'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col xl:flex-row gap-6 lg:gap-8">
          {/* Left Column - Form */}
          <div className="w-full xl:w-1/3 xl:max-w-md">
            {/* Mobile Login Button */}
            {!isAuthenticated && (
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-4 sm:hidden">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Sign in to save your financial journeys and access history
                  </p>
                  <button
                    onClick={() => setShowSignInModal(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded shadow hover:bg-primary-700 transition"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Financial Information
              </h2>
              <FinancialForm onSubmit={handleSimulation} loading={loading} />
            </div>
          </div>

          {/* Right Column - Results and History */}
          <div className="w-full xl:w-2/3 xl:flex-1">
            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('simulation')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'simulation'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Current Simulation
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'history'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Journey History
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'simulation' && (
                <>
                  {error && (
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
                  )}

                  {loading && (
                    <div className="bg-white rounded-lg shadow-sm border p-6 sm:p-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        <span className="ml-3 text-gray-600">Calculating your financial projection...</span>
                      </div>
                    </div>
                  )}

                  {!simulationResult && !loading && !error && (
                    <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
                        <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Get Started</h3>
                      <p className="text-gray-500 mb-4">
                        Fill out your financial information on the left to generate your personalized financial projection and AI advice.
                      </p>
                      <div className="text-sm text-gray-400">
                        ✓ Currency-aware projections<br/>
                        ✓ AI-powered recommendations<br/>
                        ✓ Goal feasibility analysis<br/>
                        ✓ Journey history tracking
                      </div>
                    </div>
                  )}

                  {simulationResult && (
                    <>
                      {/* Charts */}
                      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center">
                          <h2 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-0">
                            Financial Projection
                          </h2>
                          {userData && (
                            <PDFExport 
                              simulationResult={simulationResult}
                              userData={userData}
                              aiAdvice={aiAdvice}
                              className="w-full sm:w-auto"
                            />
                          )}
                        </div>
                        <div className="p-4 sm:p-6">
                          <FinancialCharts data={simulationResult} currency={userData?.currency} />
                        </div>
                      </div>

                      {/* AI Advice */}
                      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="p-4 sm:p-6 border-b">
                          <h2 className="text-lg font-semibold text-gray-900">
                            AI Financial Advice
                          </h2>
                        </div>
                        <div className="p-4 sm:p-6">
                          <AIAdvice 
                            simulationResult={simulationResult} 
                            userData={userData}
                            journeyId={journeyId}
                            aiAdvice={aiAdvice}
                            onAdviceChange={setAIAdvice}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {activeTab === 'history' && (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="p-4 sm:p-6 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Journey History
                    </h2>
                  </div>
                  <div className="p-4 sm:p-6">
                    <JourneyHistory userEmail={isAuthenticated && user ? user.email : ''} onLoadJourney={handleLoadJourney} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      {showSignInModal && (
        <RunAnalysisModal
          onClose={() => setShowSignInModal(false)}
          onProceed={(params) => {
            if (params.method === 'google') {
              setShowSignInModal(false);
            }
          }}
          mode="signin"
        />
      )}
    </div>
  );
};

export default Dashboard; 