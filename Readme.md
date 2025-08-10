# Finsight - AI-Powered Personal Financial Planner

Finsight is a comprehensive personal finance SaaS tool that helps users track their finances, plan for life goals, and get AI-generated financial advice.

## 🎯 Features

- **Financial Projection Engine**: Calculate net worth projections over 10+ years
- **Cash Runway Analysis**: See how many months you can survive without income
- **Goal Planning**: Set and track financial goals (car, house, retirement, etc.)
- **AI-Powered Advice**: Get personalized financial recommendations
- **Interactive Charts**: Visualize your financial future with beautiful charts
- **Emergency Fund Analysis**: Assess your financial safety net
- **Investment Optimization**: Get suggestions for better investment strategies

## 🧱 Tech Stack

### Backend
- **FastAPI** (Python) - High-performance web framework
- **Pydantic** - Data validation and serialization
- **Python** - Core logic and calculations
- **Uvicorn** - ASGI server

### Frontend
- **React** - User interface
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **React Hook Form** - Form management

### AI Integration
- **Mock AI Service** (Ready for OpenAI/Gemini integration)
- **Structured Financial Analysis**
- **Personalized Recommendations**

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the backend server:**
   ```bash
   python main.py
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## 📊 API Endpoints

### Simulation Endpoints
- `POST /api/v1/simulate` - Calculate financial projections
- `POST /api/v1/goals/suggestions` - Get goal suggestions
- `GET /api/v1/goals/defaults` - Get default goal amounts
- `POST /api/v1/cash-runway` - Calculate cash runway

### AI Advice Endpoints
- `POST /api/v1/advice` - Get comprehensive AI advice
- `POST /api/v1/advice/quick` - Get quick financial advice

## 🎨 User Interface

The application features a modern, responsive design with:

- **Dashboard Layout**: Clean, organized interface
- **Interactive Forms**: Easy data input with validation
- **Real-time Charts**: Visual financial projections
- **AI Recommendations**: Personalized advice sections
- **Mobile Responsive**: Works on all devices

## 📈 Key Calculations

### Net Worth Projection
- Compound interest on SIP investments
- Monthly cash flow analysis
- Investment growth projections
- Goal feasibility assessment

### Cash Runway
- Emergency fund analysis
- Monthly expense coverage
- Financial safety assessment

### AI Advice Generation
- Risk assessment
- Goal-specific recommendations
- Actionable next steps
- Investment optimization tips

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```env
# AI Service Configuration
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key

# Database Configuration (for future use)
DATABASE_URL=your_database_url

# Security
SECRET_KEY=your_secret_key
```

### Customization
- Modify default goal amounts in `backend/services/simulation_logic.py`
- Adjust AI advice logic in `backend/routers/ai_advice.py`
- Customize UI themes in `frontend/tailwind.config.js`

## 🧪 Testing

### Backend Testing
```bash
cd backend
python -m pytest
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📁 Project Structure

```
FinSight/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt        # Python dependencies
│   ├── models/
│   │   └── financial_data.py   # Pydantic models
│   ├── routers/
│   │   ├── simulate.py         # Simulation endpoints
│   │   └── ai_advice.py        # AI advice endpoints
│   └── services/
│       └── simulation_logic.py # Core calculation logic
├── frontend/
│   ├── package.json           # Node.js dependencies
│   ├── tailwind.config.js     # Tailwind configuration
│   ├── public/
│   │   └── index.html         # Main HTML file
│   └── src/
│       ├── index.tsx          # React entry point
│       ├── App.tsx            # Main app component
│       ├── index.css          # Global styles
│       ├── types/
│       │   └── financial.ts   # TypeScript types
│       ├── components/
│       │   ├── FinancialForm.tsx    # Input form
│       │   ├── FinancialCharts.tsx  # Data visualization
│       │   └── AIAdvice.tsx         # AI recommendations
│       └── pages/
│           └── Dashboard.tsx        # Main dashboard
└── README.md                  # This file
```

## 🚀 Deployment

### Backend Deployment
1. Set up a Python environment on your server
2. Install dependencies: `pip install -r requirements.txt`
3. Configure environment variables
4. Run with production server: `uvicorn main:app --host 0.0.0.0 --port 8000`

### Frontend Deployment
1. Build the application: `npm run build`
2. Serve the `build` folder with a web server
3. Configure API proxy settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `http://localhost:8000/docs`
- Review the code comments for implementation details

## 🔮 Future Enhancements

- [ ] PDF statement parsing (PyMuPDF integration)
- [ ] Real AI service integration (OpenAI/Gemini)
- [ ] User authentication and data persistence
- [ ] Mobile app development
- [ ] Advanced investment portfolio analysis
- [ ] Tax optimization recommendations
- [ ] Real-time market data integration
- [ ] Social features and goal sharing

---

**Finsight** - Making financial planning accessible and intelligent for everyone! 💰📊🤖
