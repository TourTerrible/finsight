from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime
import os
from models.financial_data import Currency, MaritalStatus, GoalType

# Database URL - using SQLite for development, can be changed to PostgreSQL for production
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./finsight.db")

# Global variables for lazy initialization
engine = None
SessionLocal = None
Base = declarative_base()

def init_database():
    """Initialize database connection lazily"""
    global engine, SessionLocal
    if engine is None:
        if DATABASE_URL.startswith("sqlite"):
            engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
        else:
            print("Using PostgreSQL")
            print(DATABASE_URL)
            engine = create_engine(DATABASE_URL)
        
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # User profile info (latest from most recent journey)
    age = Column(Integer)
    marital_status = Column(Enum(MaritalStatus, native_enum=False))
    dependents = Column(Integer, default=0)
    primary_currency = Column(Enum(Currency, native_enum=False), default=Currency.USD)
    
    # Relationships
    journeys = relationship("FinancialJourney", back_populates="user", cascade="all, delete-orphan")

class FinancialJourney(Base):
    __tablename__ = "financial_journeys"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Input data snapshot
    current_bank_balance = Column(Float, nullable=False)
    monthly_income = Column(Float)
    monthly_expenses = Column(Float, nullable=False)
    monthly_sip = Column(Float, nullable=False)
    other_investments = Column(Float, nullable=False)
    currency = Column(Enum(Currency, native_enum=False), nullable=False)
    age = Column(Integer, nullable=False)
    marital_status = Column(Enum(MaritalStatus, native_enum=False), nullable=False)
    dependents = Column(Integer, default=0)
    annual_return_rate = Column(Float, nullable=False)
    projection_years = Column(Integer, nullable=False)
    
    # Goals (stored as JSON)
    goals = Column(JSON)
    
    # Investments (stored as JSON)
    investments = Column(JSON)
    
    # Results snapshot
    net_worth_by_year = Column(JSON)
    cash_runway_months = Column(Integer)
    monthly_cash_flow = Column(Float)
    total_investments = Column(Float)
    liquid_cash_end = Column(Float)
    goal_feasibility = Column(JSON)
    goal_timeline = Column(JSON)
    
    # AI Advice snapshot
    ai_general_advice = Column(Text)
    ai_action_items = Column(JSON)
    ai_risk_assessment = Column(Text)
    ai_goal_specific_advice = Column(JSON)
    
    # Relationships
    user = relationship("User", back_populates="journeys")

# Database dependency
def get_db():
    init_database()  # Ensure database is initialized
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
def create_tables():
    engine = init_database()  # Ensure database is initialized
    Base.metadata.create_all(bind=engine) 