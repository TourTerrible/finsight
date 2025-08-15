import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { UserFinancialData, MaritalStatus, GoalType, FinancialGoal, Currency, InvestmentType, InvestmentMode, Investment } from '../types/financial.ts';
import RunAnalysisModal from './RunAnalysisModal.tsx';

interface FinancialFormProps {
  onSubmit: (data: UserFinancialData) => void;
  loading: boolean;
}

const FinancialForm: React.FC<FinancialFormProps> = ({ onSubmit, loading }) => {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const { register, handleSubmit, formState: { errors }, trigger, getValues } = useForm<UserFinancialData>();
  const { isAuthenticated, user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const addGoal = () => {
    const newGoal: FinancialGoal = {
      goal_type: GoalType.CUSTOM,
      description: '',
      target_amount: 0,
      target_year: 5
    };
    setGoals([...goals, newGoal]);
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const updateGoal = (index: number, field: keyof FinancialGoal, value: any) => {
    const updatedGoals = [...goals];
    updatedGoals[index] = { ...updatedGoals[index], [field]: value };
    setGoals(updatedGoals);
  };

  const addInvestment = () => {
    const newInvestment: Investment = {
      type: InvestmentType.MUTUAL_FUND,
      amount: 0,
      mode: InvestmentMode.MONTHLY,
      expected_yearly_return: 8,
      existing_value: 0,
      description: ''
    };
    setInvestments([...investments, newInvestment]);
  };

  const removeInvestment = (index: number) => {
    setInvestments(investments.filter((_, i) => i !== index));
  };

  const updateInvestment = (index: number, field: keyof Investment, value: any) => {
    const updatedInvestments = [...investments];
    updatedInvestments[index] = { ...updatedInvestments[index], [field]: value };
    setInvestments(updatedInvestments);
  };

  const onFormSubmit = (data: UserFinancialData) => {
    console.log('Form submitted with data:', data);
    console.log('Goals:', goals);
    console.log('Investments:', investments);
    
    // Calculate total other_investments from investments array for backward compatibility
    const totalOtherInvestments = investments.reduce((sum, inv) => sum + inv.existing_value, 0);
    
    const formData = {
      ...data,
      email: isAuthenticated ? user?.email || '' : data.email,
      goals: goals,
      investments: investments,
      other_investments: totalOtherInvestments // For backward compatibility
    };
    
    console.log('Final form data:', formData);
    onSubmit(formData);
  };

  // formatCurrency function removed - not currently used

  const handleRunClick = async () => {
    const valid = await trigger();
    if (!valid) return;
    if (!isAuthenticated) {
      setShowModal(true);
    } else {
      // If authenticated, submit the form directly
      handleSubmit(onFormSubmit)();
    }
  };

  const handleModalProceed = (params: { method: 'google' | 'email' | 'guest', email?: string }) => {
    // Get the latest form values
    const data = getValues();
    let email = '';
    if (params.method === 'google') {
      email = user?.email || '';
    } else if (params.method === 'email' || params.method === 'guest') {
      email = params.email || '';
    }
    
    // Calculate total other_investments from investments array for backward compatibility
    const totalOtherInvestments = investments.reduce((sum, inv) => sum + inv.existing_value, 0);
    
    const formData = {
      ...data,
      email,
      goals: goals,
      investments: investments,
      other_investments: totalOtherInvestments // For backward compatibility
    };
    onSubmit(formData);
    setShowModal(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">


        {/* Currency Selection */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Currency & Location</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Your Currency
            </label>
            <select
              {...register('currency', { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value={Currency.USD}>🇺🇸 US Dollar ($)</option>
              <option value={Currency.INR}>🇮🇳 Indian Rupee (₹)</option>
            </select>
            {errors.currency && (
              <p className="mt-1 text-sm text-red-600">Currency selection is required</p>
            )}
          </div>
        </div>

        {/* Financial Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Current Bank Balance
              </label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                step="any"
                {...register('current_bank_balance', { required: true, min: 0 })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="500000"
              />
              {errors.current_bank_balance && (
                <p className="mt-1 text-sm text-red-600">Bank balance is required</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Monthly Income - Optional
              </label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                step="any"
                {...register('monthly_income', { min: 0 })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="75000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Monthly Expenses
              </label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                step="any"
                {...register('monthly_expenses', { required: true, min: 0 })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="45000"
              />
              {errors.monthly_expenses && (
                <p className="mt-1 text-sm text-red-600">Monthly expenses are required</p>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Age</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                step="any"
                {...register('age', { required: true, min: 18, max: 100 })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="30"
              />
              {errors.age && (
                <p className="mt-1 text-sm text-red-600">Valid age is required</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Marital Status</label>
              <select
                {...register('marital_status')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Select status (optional)</option>
                <option value={MaritalStatus.SINGLE}>Single</option>
                <option value={MaritalStatus.MARRIED}>Married</option>
                <option value={MaritalStatus.DIVORCED}>Divorced</option>
                <option value={MaritalStatus.WIDOWED}>Widowed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Number of Dependents</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                step="any"
                {...register('dependents', { min: 0 })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="0 (optional)"
              />
            </div>
          </div>
        </div>

        {/* Investment Preferences */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Investment Preferences</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Projection Years
              </label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                step="any"
                {...register('projection_years', { required: true, min: 1, max: 50 })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="10"
              />
              {errors.projection_years && (
                <p className="mt-1 text-sm text-red-600">Valid projection years are required</p>
              )}
            </div>
          </div>
        </div>

        {/* Investments Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Investments</h3>
          <div className="space-y-4">
            {investments.length === 0 && (
              <p className="text-sm text-gray-500 text-center sm:text-left">No investments added yet. Click "Add Investment" to get started.</p>
            )}
            {investments.map((investment, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 space-y-2 sm:space-y-0">
                  <h4 className="text-sm font-medium text-gray-900">Investment {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeInvestment(index)}
                    className="text-red-600 hover:text-red-800 text-sm self-start"
                  >
                    Remove
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={investment.type}
                      onChange={(e) => updateInvestment(index, 'type', e.target.value as InvestmentType)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value={InvestmentType.MUTUAL_FUND}>Mutual Fund</option>
                      <option value={InvestmentType.STOCKS}>Stocks</option>
                      <option value={InvestmentType.BONDS}>Bonds</option>
                      <option value={InvestmentType.FIXED_DEPOSIT}>Fixed Deposit</option>
                      <option value={InvestmentType.PPF}>PPF</option>
                      <option value={InvestmentType.EPF}>EPF</option>
                      <option value={InvestmentType.GOLD}>Gold</option>
                      <option value={InvestmentType.REAL_ESTATE}>Real Estate</option>
                      <option value={InvestmentType.LAND}>Land</option>
                      <option value={InvestmentType.CRYPTO}>Crypto</option>
                      <option value={InvestmentType.OTHER}>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      step="any"
                      value={investment.amount || ''}
                      onChange={(e) => updateInvestment(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="100000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mode</label>
                    <select
                      value={investment.mode}
                      onChange={(e) => updateInvestment(index, 'mode', e.target.value as InvestmentMode)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value={InvestmentMode.MONTHLY}>Monthly</option>
                      <option value={InvestmentMode.YEARLY}>Yearly</option>
                      <option value={InvestmentMode.ONE_TIME}>One-Time</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expected Yearly Return (%)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      step="any"
                      value={investment.expected_yearly_return || ''}
                      onChange={(e) => updateInvestment(index, 'expected_yearly_return', parseFloat(e.target.value) || 0)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="8"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Existing Value</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      step="any"
                      value={investment.existing_value || ''}
                      onChange={(e) => updateInvestment(index, 'existing_value', parseFloat(e.target.value) || 0)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="50000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input
                      type="text"
                      value={investment.description || ''}
                      onChange={(e) => updateInvestment(index, 'description', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Describe this investment"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addInvestment}
              className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 w-full sm:w-auto"
            >
              Add Investment
            </button>
          </div>
        </div>

        {/* Financial Goals */}
        <div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
            <h3 className="text-lg font-medium text-gray-900">Financial Goals</h3>
            <button
              type="button"
              onClick={addGoal}
              className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 w-full sm:w-auto"
            >
              Add Goal
            </button>
          </div>

          {goals.length === 0 && (
            <p className="text-sm text-gray-500 text-center sm:text-left">No goals added yet. Click "Add Goal" to get started.</p>
          )}

          {goals.map((goal, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 space-y-2 sm:space-y-0">
                <h4 className="text-sm font-medium text-gray-900">Goal {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeGoal(index)}
                  className="text-red-600 hover:text-red-800 text-sm self-start"
                >
                  Remove
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Goal Type</label>
                  <select
                    value={goal.goal_type}
                    onChange={(e) => updateGoal(index, 'goal_type', e.target.value as GoalType)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value={GoalType.BUY_CAR}>Buy a Car</option>
                    <option value={GoalType.BUY_HOUSE}>Buy a House</option>
                    <option value={GoalType.RETIRE_EARLY}>Retire Early</option>
                    <option value={GoalType.ANNUAL_TRIPS}>Annual Trips</option>
                    <option value={GoalType.CUSTOM}>Custom Goal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <input
                    type="text"
                    value={goal.description || ''}
                    onChange={(e) => updateGoal(index, 'description', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Describe your goal"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Target Amount</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      step="any"
                      value={goal.target_amount || ''}
                      onChange={(e) => updateGoal(index, 'target_amount', parseFloat(e.target.value) || 0)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="1000000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Target Year</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      step="any"
                      value={goal.target_year || ''}
                      onChange={(e) => updateGoal(index, 'target_year', parseInt(e.target.value) || 0)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Email Input for Non-Authenticated Users */}
        {/* (REMOVED: Email input section for non-authenticated users) */}

        {/* Privacy Policy Consent */}
        <div className="pt-2">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              By clicking "Run Financial Analysis", you accept our{' '}
              <Link 
                to="/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                Privacy Policy
              </Link>
              {' '}and agree to the processing of your financial data to provide personalized recommendations.
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            onClick={handleRunClick}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Calculating...
              </div>
            ) : (
              'Run Financial Analysis'
            )}
          </button>
        </div>
      </form>
      {showModal && (
        <RunAnalysisModal
          onClose={() => setShowModal(false)}
          onProceed={handleModalProceed}
          mode="run"
        />
      )}
    </>
  );
};

export default FinancialForm; 