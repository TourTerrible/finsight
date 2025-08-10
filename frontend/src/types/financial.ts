export enum MaritalStatus {
  SINGLE = "single",
  MARRIED = "married",
  DIVORCED = "divorced",
  WIDOWED = "widowed"
}

export enum Currency {
  INR = "INR",
  USD = "USD",
  EUR = "EUR",
  GBP = "GBP",
  CAD = "CAD",
  AUD = "AUD",
  SGD = "SGD",
  AED = "AED",
  JPY = "JPY"
}

export enum GoalType {
  BUY_CAR = "buy_car",
  BUY_HOUSE = "buy_house",
  RETIRE_EARLY = "retire_early",
  ANNUAL_TRIPS = "annual_trips",
  CUSTOM = "custom"
}

export enum InvestmentType {
  MUTUAL_FUND = "mutual_fund",
  LAND = "land",
  STOCKS = "stocks",
  BONDS = "bonds",
  FIXED_DEPOSIT = "fixed_deposit",
  PPF = "ppf",
  EPF = "epf",
  GOLD = "gold",
  REAL_ESTATE = "real_estate",
  CRYPTO = "crypto",
  OTHER = "other"
}

export enum InvestmentMode {
  MONTHLY = "monthly",
  YEARLY = "yearly",
  ONE_TIME = "one_time"
}

export interface FinancialGoal {
  goal_type: GoalType;
  target_amount?: number;
  target_year?: number;
  description?: string;
}

export interface Investment {
  type: InvestmentType;
  amount: number;
  mode: InvestmentMode;
  expected_yearly_return: number;
  existing_value: number;
  description?: string;
}

export interface UserFinancialData {
  // User identification
  email: string;
  
  // Basic financial info
  current_bank_balance: number;
  monthly_income?: number;
  monthly_expenses: number;
  other_investments: number; // Keep for backward compatibility
  investments: Investment[]; // New investments array
  
  // Currency
  currency: Currency;
  
  // Personal info
  age: number;
  marital_status?: MaritalStatus;
  dependents?: number;
  
  // Investment preferences
  projection_years: number;
  
  // Goals
  goals: FinancialGoal[];
}

export interface SimulationResult {
  net_worth_by_year: { [key: number]: number };
  cash_runway_months: number;
  monthly_cash_flow: number;
  total_investments: number;
  liquid_cash_end: number;
  projection_years: number;
  
  // Goal analysis
  goal_feasibility: { [key: string]: boolean };
  goal_timeline: { [key: string]: number };
}

export interface AIAdviceResponse {
  general_advice: string;
  goal_specific_advice: { [key: string]: string };
  action_items: string[];
  risk_assessment: string;
}

export interface JourneySummary {
  id: number;
  created_at: string;
  currency: string;
  current_bank_balance: number;
  monthly_cash_flow: number;
  total_investments: number;
  cash_runway_months: number;
  projection_years: number;
}

export interface JourneyDetail {
  id: number;
  created_at: string;
  user_email: string;
  
  // Input data
  current_bank_balance: number;
  monthly_income?: number;
  monthly_expenses: number;
  monthly_sip: number; // Legacy field
  other_investments: number;
  currency: string;
  age: number;
  marital_status: string;
  dependents: number;
  annual_return_rate: number; // Legacy field
  projection_years: number;
  goals: any[];
  investments: Investment[]; // New investments field
  
  // Results
  net_worth_by_year: { [key: number]: number };
  cash_runway_months: number;
  monthly_cash_flow: number;
  total_investments: number;
  liquid_cash_end: number;
  goal_feasibility: { [key: string]: boolean };
  goal_timeline: { [key: string]: number };
  
  // AI Advice
  ai_general_advice?: string;
  ai_action_items?: string[];
  ai_risk_assessment?: string;
  ai_goal_specific_advice?: { [key: string]: string };
}

export interface UserStats {
  total_journeys: number;
  member_since: string;
  last_journey?: string;
  primary_currency?: string;
} 