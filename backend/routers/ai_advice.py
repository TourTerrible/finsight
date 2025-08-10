from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.financial_data import AIAdviceRequest, AIAdviceResponse
from openai import OpenAI
import os
import json
import google.generativeai as genai
from services.currency_service import CurrencyService
from typing import Dict, List


# Initialize OpenAI client
def get_openai_client():
    """Get OpenAI client if API key is available."""
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("DEBUG: No OpenAI API key found")
        return None
        
    try:
       # Simplified client creation without extra parameters
        return OpenAI(api_key=api_key)
    except Exception as e:
        print(f"DEBUG: Failed to create OpenAI client: {e}")
        return None

# Initialize Gemini client
def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        print("DEBUG: No valid Gemini API key found")
        return None
    
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-1.5-flash')


router = APIRouter()


class GeminiService:
    """Gemini AI service for generating financial advice."""
    
    def __init__(self):
        self.client = get_gemini_client()
        
    def generate_advice(self, user_data, simulation_result, specific_concerns=None) -> AIAdviceResponse:
        """Generate financial advice using Gemini."""
        print(f"DEBUG: Gemini client available: {self.client is not None}")
        
        if not self.client:
            print("DEBUG: No Gemini client, falling back to mock service")
            return MockAIService().generate_advice(user_data, simulation_result, specific_concerns)
        
        try:
            print("DEBUG: Starting Gemini API call")
            # Prepare data for Gemini
            financial_summary = self._prepare_financial_summary(user_data, simulation_result)
            
            # Create prompt for Gemini
            prompt = self._create_advice_prompt(financial_summary, specific_concerns)
            print("DEBUG: Prompt created, calling Gemini API...")
            
            # Call Gemini API
            response = self.client.generate_content(prompt)
            
            # Parse response
            advice_text = response.text
            print("DEBUG: Gemini API call successful, parsing response...")
            return self._parse_gemini_response(advice_text, user_data, simulation_result)
            
        except Exception as e:
            print(f"DEBUG: Gemini API error: {e}")
            print("DEBUG: Falling back to mock service")
            return MockAIService().generate_advice(user_data, simulation_result, specific_concerns)
    
    def _prepare_financial_summary(self, user_data, simulation_result):
        """Prepare financial data summary for Gemini."""
        # Calculate total monthly investment contribution
        monthly_investment_contribution = 0
        for investment in user_data.investments:
            if investment.mode.value == "monthly":
                monthly_investment_contribution += investment.amount
            elif investment.mode.value == "yearly":
                monthly_investment_contribution += investment.amount / 12
        
        # Calculate weighted average return rate
        if user_data.investments:
            total_value = sum(inv.existing_value for inv in user_data.investments)
            if total_value > 0:
                weighted_return = sum(
                    inv.existing_value * inv.expected_yearly_return 
                    for inv in user_data.investments
                ) / total_value
            else:
                weighted_return = 8.0
        else:
            weighted_return = 8.0
        
        return {
            "age": user_data.age,
            "marital_status": user_data.marital_status.value if user_data.marital_status else "unknown",
            "dependents": user_data.dependents or 0,
            "currency": user_data.currency.value,
            "current_bank_balance": user_data.current_bank_balance,
            "monthly_income": user_data.monthly_income or 0,
            "monthly_expenses": user_data.monthly_expenses,
            "monthly_investment_contribution": monthly_investment_contribution,
            "total_existing_investments": sum(inv.existing_value for inv in user_data.investments),
            "weighted_return_rate": weighted_return,
            "projection_years": user_data.projection_years,
            "cash_runway_months": simulation_result.cash_runway_months,
            "monthly_cash_flow": simulation_result.monthly_cash_flow,
            "total_investments": simulation_result.total_investments,
            "goals": [{"type": goal.goal_type.value, "description": goal.description, "amount": goal.target_amount, "years": goal.target_year} for goal in user_data.goals],
            "investments": [{"type": inv.type.value, "amount": inv.amount, "mode": inv.mode.value, "return_rate": inv.expected_yearly_return, "existing_value": inv.existing_value} for inv in user_data.investments]
        }
    
    def _create_advice_prompt(self, financial_summary, specific_concerns):
        """Create a structured prompt for Gemini."""
        # Get currency info for formatting
        from services.currency_service import CurrencyService
        
        currency = financial_summary.get('currency', 'INR')
        currency_symbol = CurrencyService.get_currency_symbol(currency)
        
        prompt = f"""
        You are a professional financial advisor. Analyze this financial profile and provide structured advice:

        Financial Profile:
        - Age: {financial_summary['age']} years
        - Marital Status: {financial_summary['marital_status']}
        - Dependents: {financial_summary['dependents']}
        - Currency: {currency}
        - Bank Balance: {currency_symbol}{financial_summary['current_bank_balance']:,.0f}
        - Monthly Income: {currency_symbol}{financial_summary['monthly_income']:,.0f}
        - Monthly Expenses: {currency_symbol}{financial_summary['monthly_expenses']:,.0f}
        - Monthly Investment Contribution: {currency_symbol}{financial_summary['monthly_investment_contribution']:,.0f}
        - Total Existing Investments: {currency_symbol}{financial_summary['total_existing_investments']:,.0f}
        - Weighted Return Rate: {financial_summary['weighted_return_rate']:.1f}%
        
        Current Financial Health:
        - Cash Runway: {financial_summary['cash_runway_months']} months
        - Monthly Cash Flow: {currency_symbol}{financial_summary['monthly_cash_flow']:,.0f}
        - Total Investments: {currency_symbol}{financial_summary['total_investments']:,.0f}
        
        Goals: {financial_summary['goals']}
        
        {f"Specific Concerns: {specific_concerns}" if specific_concerns else ""}
        
        Please provide advice in this exact JSON format:
        {{
            "general_advice": "Brief overall financial advice (1-2 sentences)",
            "goal_specific_advice": {{"goal_key": "advice for each goal"}},
            "action_items": ["specific action 1", "specific action 2", "specific action 3"],
            "risk_assessment": "Overall risk assessment (1-2 sentences)"
        }}
        
        Make advice practical and actionable for the user's currency and region.
        """
        return prompt
    
    def _parse_gemini_response(self, advice_text, user_data, simulation_result):
        """Parse Gemini response into structured format."""
        try:
            # Try to extract JSON from response
            start_idx = advice_text.find('{')
            end_idx = advice_text.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                json_text = advice_text[start_idx:end_idx]
                parsed = json.loads(json_text)
                
                return AIAdviceResponse(
                    general_advice=parsed.get("general_advice", ""),
                    goal_specific_advice=parsed.get("goal_specific_advice", {}),
                    action_items=parsed.get("action_items", []),
                    risk_assessment=parsed.get("risk_assessment", "")
                )
        except Exception as e:
            print(f"DEBUG: Failed to parse Gemini JSON response: {e}")
            pass
        
        # Fallback to mock service if parsing fails
        return MockAIService().generate_advice(user_data, simulation_result)


class OpenAIService:
    """Real OpenAI service for generating financial advice."""
    
    def __init__(self):
        self.client = get_openai_client()
        
    def generate_advice(self, user_data, simulation_result, specific_concerns=None) -> AIAdviceResponse:
        """Generate financial advice using OpenAI GPT."""
        print(f"DEBUG: OpenAI client available: {self.client is not None}")
        
        if not self.client:
            print("DEBUG: No OpenAI client, falling back to mock service")
            # Fallback to mock service if no API key
            return MockAIService().generate_advice(user_data, simulation_result, specific_concerns)
        
        try:
            print("DEBUG: Starting OpenAI API call")
            # Prepare data for OpenAI
            financial_summary = self._prepare_financial_summary(user_data, simulation_result)
            
            # Create prompt for OpenAI
            prompt = self._create_advice_prompt(financial_summary, specific_concerns)
            print("DEBUG: Prompt created, calling OpenAI API...")
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a professional financial advisor. Provide personalized, actionable financial advice in a structured format."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1500,
                temperature=0.7
            )
            
            # Parse response
            advice_text = response.choices[0].message.content
            print("DEBUG: OpenAI API call successful, parsing response...")
            return self._parse_openai_response(advice_text, user_data, simulation_result)
            
        except Exception as e:
            print(f"DEBUG: OpenAI API error: {e}")
            print("DEBUG: Falling back to mock service")
            # Fallback to mock service
            return MockAIService().generate_advice(user_data, simulation_result, specific_concerns)
    
    def _prepare_financial_summary(self, user_data, simulation_result):
        """Prepare financial data summary for OpenAI."""
        return {
            "age": user_data.age,
            "marital_status": user_data.marital_status.value if user_data.marital_status else "unknown",
            "dependents": user_data.dependents or 0,
            "currency": user_data.currency.value,
            "current_bank_balance": user_data.current_bank_balance,
            "monthly_income": user_data.monthly_income or 0,
            "monthly_expenses": user_data.monthly_expenses,
            "monthly_investment_contribution": 0, # OpenAI service doesn't use this directly
            "total_existing_investments": 0, # OpenAI service doesn't use this directly
            "weighted_return_rate": 0, # OpenAI service doesn't use this directly
            "projection_years": user_data.projection_years,
            "cash_runway_months": simulation_result.cash_runway_months,
            "monthly_cash_flow": simulation_result.monthly_cash_flow,
            "total_investments": simulation_result.total_investments,
            "goals": [{"type": goal.goal_type.value, "description": goal.description, "amount": goal.target_amount, "years": goal.target_year} for goal in user_data.goals],
            "investments": [{"type": inv.type.value, "amount": inv.amount, "mode": inv.mode.value, "return_rate": inv.expected_yearly_return, "existing_value": inv.existing_value} for inv in user_data.investments]
        }
    
    def _create_advice_prompt(self, financial_summary, specific_concerns):
        """Create a structured prompt for OpenAI."""
        # Get currency info for formatting
        from services.currency_service import CurrencyService
        
        currency = financial_summary.get('currency', 'INR')
        currency_symbol = CurrencyService.get_currency_symbol(currency)
        
        prompt = f"""
        Analyze this financial profile and provide structured advice:

        Financial Profile:
        - Age: {financial_summary['age']} years
        - Marital Status: {financial_summary['marital_status']}
        - Dependents: {financial_summary['dependents']}
        - Currency: {currency}
        - Bank Balance: {currency_symbol}{financial_summary['current_bank_balance']:,.0f}
        - Monthly Income: {currency_symbol}{financial_summary['monthly_income']:,.0f}
        - Monthly Expenses: {currency_symbol}{financial_summary['monthly_expenses']:,.0f}
        - Monthly Investment Contribution: {currency_symbol}{financial_summary['monthly_investment_contribution']:,.0f}
        - Total Existing Investments: {currency_symbol}{financial_summary['total_existing_investments']:,.0f}
        - Weighted Return Rate: {financial_summary['weighted_return_rate']:.1f}%
        
        Current Financial Health:
        - Cash Runway: {financial_summary['cash_runway_months']} months
        - Monthly Cash Flow: {currency_symbol}{financial_summary['monthly_cash_flow']:,.0f}
        - Total Investments: {currency_symbol}{financial_summary['total_investments']:,.0f}
        
        Goals: {financial_summary['goals']}
        
        {f"Specific Concerns: {specific_concerns}" if specific_concerns else ""}
        
        Please provide advice in this exact JSON format:
        {{
            "general_advice": "Brief overall financial advice (1-2 sentences)",
            "goal_specific_advice": {{"goal_key": "advice for each goal"}},
            "action_items": ["specific action 1", "specific action 2", "specific action 3"],
            "risk_assessment": "Overall risk assessment (1-2 sentences)"
        }}
        
        Make advice practical and actionable for the user's currency and region.
        """
        return prompt
    
    def _parse_openai_response(self, advice_text, user_data, simulation_result):
        """Parse OpenAI response into structured format."""
        try:
            # Try to extract JSON from response
            start_idx = advice_text.find('{')
            end_idx = advice_text.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                json_text = advice_text[start_idx:end_idx]
                parsed = json.loads(json_text)
                
                return AIAdviceResponse(
                    general_advice=parsed.get("general_advice", ""),
                    goal_specific_advice=parsed.get("goal_specific_advice", {}),
                    action_items=parsed.get("action_items", []),
                    risk_assessment=parsed.get("risk_assessment", "")
                )
        except:
            pass
        
        # Fallback to mock service if parsing fails
        return MockAIService().generate_advice(user_data, simulation_result)


class MockAIService:
    """Mock AI service for when OpenAI is not available."""
    
    def generate_advice(self, user_data, simulation_result, specific_concerns=None) -> AIAdviceResponse:
        """Generate financial advice based on user data and simulation results."""
        
        # Analyze the financial situation
        cash_runway = simulation_result.cash_runway_months
        monthly_cash_flow = simulation_result.monthly_cash_flow
        age = user_data.age
        goals = user_data.goals
        
        # Generate general advice
        general_advice = self._generate_general_advice(user_data, simulation_result)
        
        # Generate goal-specific advice
        goal_specific_advice = self._generate_goal_advice(goals, simulation_result)
        
        # Generate action items
        action_items = self._generate_action_items(user_data, simulation_result)
        
        # Generate risk assessment
        risk_assessment = self._generate_risk_assessment(user_data, simulation_result)
        
        return AIAdviceResponse(
            general_advice=general_advice,
            goal_specific_advice=goal_specific_advice,
            action_items=action_items,
            risk_assessment=risk_assessment
        )
    
    def _generate_general_advice(self, user_data, simulation_result) -> str:
        """Generate currency-aware general financial advice."""
        advice_parts = []
        currency = user_data.currency
        
        # Emergency fund advice using currency service
        _, emergency_status = CurrencyService.get_emergency_fund_status(
            user_data.current_bank_balance, 
            user_data.monthly_expenses, 
            currency
        )
        advice_parts.append(emergency_status)
        
        # Cash flow advice using currency service
        _, cash_flow_status = CurrencyService.get_cash_flow_status(
            simulation_result.monthly_cash_flow, 
            currency
        )
        advice_parts.append(cash_flow_status)
        
        # Regional advice
        regional_advice = CurrencyService.get_regional_advice(currency, user_data.age)
        advice_parts.append(f"🌍 {regional_advice}")
        
        return " ".join(advice_parts)
    
    def _generate_goal_advice(self, goals, simulation_result) -> Dict[str, str]:
        """Generate advice for specific goals."""
        advice = {}
        
        for goal in goals:
            goal_key = f"{goal.goal_type}_{goal.description or 'default'}"
            
            if goal_key in simulation_result.goal_feasibility:
                is_feasible = simulation_result.goal_feasibility[goal_key]
                timeline = simulation_result.goal_timeline.get(goal_key, -1)
                
                if is_feasible:
                    advice[goal_key] = f"✅ Your goal '{goal.description}' is achievable in {timeline} years. Stay consistent with your savings plan."
                else:
                    advice[goal_key] = f"❌ Your goal '{goal.description}' may not be achievable within the projection period. Consider adjusting the timeline or increasing savings."
            else:
                advice[goal_key] = f"📋 Goal '{goal.description}' needs more analysis. Consider setting specific target amounts and timelines."
        
        return advice
    
    def _generate_action_items(self, user_data, simulation_result) -> List[str]:
        """Generate currency-aware actionable next steps."""
        actions = []
        currency = user_data.currency
        
        # Emergency fund actions
        if simulation_result.cash_runway_months < 6:
            emergency_needed = max(0, user_data.monthly_expenses * 6 - user_data.current_bank_balance)
            if emergency_needed > 0:
                formatted_amount = CurrencyService.format_currency(emergency_needed, currency)
                actions.append(f"💰 Build emergency fund: Save {formatted_amount} more to reach 6 months of expenses")
        
        # Investment optimization using currency service
        monthly_income = user_data.monthly_income or (user_data.monthly_expenses + simulation_result.monthly_cash_flow)
        if monthly_income > 0:
            # Calculate current monthly investment contribution
            monthly_investment_contribution = 0
            for investment in user_data.investments:
                if investment.mode.value == "monthly":
                    monthly_investment_contribution += investment.amount
                elif investment.mode.value == "yearly":
                    monthly_investment_contribution += investment.amount / 12
            
            is_adequate, recommended_amount, sip_advice = CurrencyService.get_sip_recommendation(
                monthly_income, monthly_investment_contribution, currency
            )
            if not is_adequate:
                actions.append(f"📈 {sip_advice}")
        
        # Investment diversification using currency service
        total_existing_investments = sum(inv.existing_value for inv in user_data.investments)
        diversification_advice = CurrencyService.get_investment_diversification_advice(
            user_data.current_bank_balance, total_existing_investments, currency
        )
        if not diversification_advice.startswith("✅"):
            actions.append(diversification_advice)
        
        # Expense optimization
        if simulation_result.monthly_cash_flow < 0:
            actions.append("💡 Review expenses: Track your spending and identify areas to cut back")
        
        # Goal planning
        if not user_data.goals:
            actions.append("🎯 Set financial goals: Define specific, measurable financial objectives")
        
        return actions
    
    def _generate_risk_assessment(self, user_data, simulation_result) -> str:
        """Generate risk assessment."""
        risks = []
        
        # Low emergency fund risk
        if simulation_result.cash_runway_months < 3:
            risks.append("HIGH RISK: Insufficient emergency fund")
        elif simulation_result.cash_runway_months < 6:
            risks.append("MEDIUM RISK: Emergency fund below recommended level")
        
        # Negative cash flow risk
        if simulation_result.monthly_cash_flow < 0:
            risks.append("HIGH RISK: Negative cash flow - unsustainable")
        
        # Investment concentration risk
        total_existing_investments = sum(inv.existing_value for inv in user_data.investments)
        if total_existing_investments < user_data.current_bank_balance * 0.5:
            risks.append("MEDIUM RISK: Over-concentration in cash")
        
        # Age-appropriate risk (using weighted average return rate)
        if user_data.investments:
            total_value = sum(inv.existing_value for inv in user_data.investments)
            if total_value > 0:
                weighted_return = sum(
                    inv.existing_value * inv.expected_yearly_return 
                    for inv in user_data.investments
                ) / total_value
            else:
                weighted_return = 8.0
        else:
            weighted_return = 8.0
        
        if user_data.age < 30 and weighted_return < 8.0:
            risks.append("LOW RISK: Consider higher-return investments for your age")
        elif user_data.age > 50 and weighted_return > 15.0:
            risks.append("HIGH RISK: Investment strategy may be too aggressive for your age")
        
        if not risks:
            return "✅ LOW RISK: Your financial profile shows good risk management"
        else:
            return "⚠️ RISKS IDENTIFIED: " + "; ".join(risks)


class IntelligentAIService:
    """Intelligent AI service that tries multiple providers in order."""
    
    def __init__(self):
        self.openai_service = OpenAIService()
        self.gemini_service = GeminiService()
        self.mock_service = MockAIService()
        
    def generate_advice(self, user_data, simulation_result, specific_concerns=None) -> AIAdviceResponse:
        """Try AI services in order: OpenAI -> Gemini -> Mock"""
        
        # Try OpenAI first
        # if self.openai_service.client:
        #     try:
        #         print("DEBUG: Trying OpenAI service...")
        #         return self.openai_service.generate_advice(user_data, simulation_result, specific_concerns)
        #     except Exception as e:
        #         print(f"DEBUG: OpenAI failed: {e}")
        
        # Try Gemini if OpenAI fails
        # if self.gemini_service.client:
        #     try:
        #         print("DEBUG: Trying Gemini service...")
        #         return self.gemini_service.generate_advice(user_data, simulation_result, specific_concerns)
        #     except Exception as e:
        #         print(f"DEBUG: Gemini failed: {e}")
        
        # Fall back to mock service
        print("DEBUG: Using mock service as fallback")
        return self.mock_service.generate_advice(user_data, simulation_result, specific_concerns)


# Initialize AI service - will try OpenAI, then Gemini, then Mock
ai_service = IntelligentAIService()

@router.post("/advice", response_model=AIAdviceResponse)
async def get_ai_advice(request: AIAdviceRequest, db: Session = Depends(get_db)):
    """
    Get AI-generated financial advice based on user's financial data and simulation results.
    
    This endpoint provides:
    - General financial advice
    - Goal-specific recommendations
    - Actionable next steps
    - Risk assessment
    
    Also saves the complete journey with AI advice to the database.
    """
    try:
        advice = ai_service.generate_advice(
            request.user_data,
            request.simulation_result,
            request.specific_concerns
        )
        
        # Save the complete journey with AI advice to database
        try:
            from services.database_service import DatabaseService
            if request.journey_id:
                # Update existing journey with advice
                updated = DatabaseService.update_financial_journey(
                    db,
                    journey_id=request.journey_id,
                    user_email=request.user_data.email,
                    simulation_result=request.simulation_result,
                    ai_advice=advice
                )
                print(f"DEBUG: Updated journey {request.journey_id} with AI advice for user {request.user_data.email}")
            else:
                # Create new journey as fallback
                DatabaseService.create_financial_journey(
                    db, request.user_data, request.simulation_result, advice
                )
                print(f"DEBUG: Complete journey with AI advice saved for user {request.user_data.email}")
        except Exception as db_error:
            # Log the error but don't fail the advice generation
            print(f"WARNING: Failed to save complete journey to database: {db_error}")
        
        return advice
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate advice: {str(e)}")

@router.post("/advice/quick")
async def get_quick_advice(user_data):
    """
    Get quick financial advice without full simulation.
    """
    try:
        # Create a basic simulation result for quick advice
        from services.simulation_logic import FinancialSimulator
        simulator = FinancialSimulator()
        simulation_result = simulator.simulate_financial_projection(user_data)
        
        advice = ai_service.generate_advice(user_data, simulation_result)
        return {
            "quick_advice": advice.general_advice,
            "emergency_fund_status": "Good" if simulation_result.cash_runway_months >= 6 else "Needs improvement",
            "cash_flow_status": "Positive" if simulation_result.monthly_cash_flow > 0 else "Negative"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quick advice: {str(e)}") 