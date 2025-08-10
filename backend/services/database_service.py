from sqlalchemy.orm import Session
from database import User, FinancialJourney
from models.financial_data import UserFinancialData, SimulationResult, AIAdviceResponse
from typing import Optional, List
from datetime import datetime

class DatabaseService:
    
    @staticmethod
    def get_or_create_user(db: Session, email: str) -> User:
        """Get existing user or create a new one."""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(email=email)
            db.add(user)
            db.commit()
            db.refresh(user)
        return user
    
    @staticmethod
    def update_user_profile(db: Session, user: User, user_data: UserFinancialData):
        """Update user profile with latest information."""
        user.age = user_data.age
        user.marital_status = user_data.marital_status
        user.dependents = user_data.dependents
        user.primary_currency = user_data.currency
        user.updated_at = datetime.utcnow()
        db.commit()
    
    @staticmethod
    def create_financial_journey(
        db: Session, 
        user_data: UserFinancialData, 
        simulation_result: SimulationResult,
        ai_advice: Optional[AIAdviceResponse] = None
    ) -> FinancialJourney:
        """Create a new financial journey record."""
        
        # Get or create user
        user = DatabaseService.get_or_create_user(db, user_data.email)
        
        # Update user profile
        DatabaseService.update_user_profile(db, user, user_data)
        
        # Convert goals to JSON-serializable format
        goals_json = [
            {
                "goal_type": goal.goal_type.value,
                "target_amount": goal.target_amount,
                "target_year": goal.target_year,
                "description": goal.description
            }
            for goal in user_data.goals
        ]
        
        # Convert investments to JSON-serializable format
        investments_json = [
            {
                "type": investment.type.value,
                "amount": investment.amount,
                "mode": investment.mode.value,
                "expected_yearly_return": investment.expected_yearly_return,
                "existing_value": investment.existing_value,
                "description": investment.description
            }
            for investment in user_data.investments
        ]
        
        # Create journey record
        journey = FinancialJourney(
            user_id=user.id,
            # Input data
            current_bank_balance=user_data.current_bank_balance,
            monthly_income=user_data.monthly_income,
            monthly_expenses=user_data.monthly_expenses,
            monthly_sip=0,  # Legacy field, set to 0
            other_investments=user_data.other_investments,
            currency=user_data.currency,
            age=user_data.age,
            marital_status=user_data.marital_status,
            dependents=user_data.dependents,
            annual_return_rate=8.0,  # Legacy field, set to default
            projection_years=user_data.projection_years,
            goals=goals_json,
            # Store investments as JSON in a new field or use existing field
            investments=investments_json,  # You may need to add this field to the database model
            # Simulation results
            net_worth_by_year=simulation_result.net_worth_by_year,
            cash_runway_months=simulation_result.cash_runway_months,
            monthly_cash_flow=simulation_result.monthly_cash_flow,
            total_investments=simulation_result.total_investments,
            liquid_cash_end=simulation_result.liquid_cash_end,
            goal_feasibility=simulation_result.goal_feasibility,
            goal_timeline=simulation_result.goal_timeline,
            # AI advice (if available)
            ai_general_advice=ai_advice.general_advice if ai_advice else None,
            ai_action_items=ai_advice.action_items if ai_advice else None,
            ai_risk_assessment=ai_advice.risk_assessment if ai_advice else None,
            ai_goal_specific_advice=ai_advice.goal_specific_advice if ai_advice else None,
        )
        
        db.add(journey)
        db.commit()
        db.refresh(journey)
        
        return journey
    
    @staticmethod
    def get_user_journeys(db: Session, email: str, limit: int = 10) -> List[FinancialJourney]:
        """Get user's financial journeys, most recent first."""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return []
        
        journeys = db.query(FinancialJourney)\
            .filter(FinancialJourney.user_id == user.id)\
            .order_by(FinancialJourney.created_at.desc())\
            .limit(limit)\
            .all()
        
        return journeys
    
    @staticmethod
    def get_journey_by_id(db: Session, journey_id: int, user_email: str) -> Optional[FinancialJourney]:
        """Get a specific journey by ID, ensuring it belongs to the user."""
        user = db.query(User).filter(User.email == user_email).first()
        if not user:
            return None
        
        journey = db.query(FinancialJourney)\
            .join(User, FinancialJourney.user_id == User.id)\
            .filter(
                FinancialJourney.id == journey_id,
                FinancialJourney.user_id == user.id
            )\
            .first()
        
        return journey
    
    @staticmethod
    def update_financial_journey(
        db: Session,
        journey_id: int,
        user_email: str,
        simulation_result: Optional[SimulationResult] = None,
        ai_advice: Optional[AIAdviceResponse] = None
    ) -> Optional[FinancialJourney]:
        """Update an existing financial journey with new simulation results and/or AI advice."""
        journey = DatabaseService.get_journey_by_id(db, journey_id, user_email)
        if not journey:
            return None
        if simulation_result:
            journey.net_worth_by_year = simulation_result.net_worth_by_year
            journey.cash_runway_months = simulation_result.cash_runway_months
            journey.monthly_cash_flow = simulation_result.monthly_cash_flow
            journey.total_investments = simulation_result.total_investments
            journey.liquid_cash_end = simulation_result.liquid_cash_end
            journey.goal_feasibility = simulation_result.goal_feasibility
            journey.goal_timeline = simulation_result.goal_timeline
            journey.projection_years = simulation_result.projection_years
        if ai_advice:
            journey.ai_general_advice = ai_advice.general_advice
            journey.ai_action_items = ai_advice.action_items
            journey.ai_risk_assessment = ai_advice.risk_assessment
            journey.ai_goal_specific_advice = ai_advice.goal_specific_advice
        db.commit()
        db.refresh(journey)
        return journey
    
    @staticmethod
    def get_user_stats(db: Session, email: str) -> dict:
        """Get user statistics."""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return {}
        
        journey_count = db.query(FinancialJourney)\
            .filter(FinancialJourney.user_id == user.id)\
            .count()
        
        latest_journey = db.query(FinancialJourney)\
            .filter(FinancialJourney.user_id == user.id)\
            .order_by(FinancialJourney.created_at.desc())\
            .first()
        
        return {
            "total_journeys": journey_count,
            "member_since": user.created_at.isoformat(),
            "last_journey": latest_journey.created_at.isoformat() if latest_journey else None,
            "primary_currency": user.primary_currency.value if user.primary_currency else None
        } 