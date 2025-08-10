import React from 'react';
import jsPDF from 'jspdf';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { SimulationResult, UserFinancialData, Currency } from '../types/financial.ts';

// Register Chart.js components
Chart.register(...registerables);

interface PDFExportProps {
  simulationResult: SimulationResult;
  userData: UserFinancialData;
  aiAdvice?: any;
  className?: string;
}

const PDFExport: React.FC<PDFExportProps> = ({ 
  simulationResult, 
  userData, 
  aiAdvice,
  className = ""
}) => {

  const getCurrencySymbol = (currency: Currency): string => {
    const symbols: Record<Currency, string> = {
      [Currency.USD]: '$',
      [Currency.EUR]: '€',
      [Currency.GBP]: '£',
      [Currency.CAD]: 'C$',
      [Currency.AUD]: 'A$',
      [Currency.SGD]: 'S$',
      [Currency.AED]: 'د.إ',
      [Currency.JPY]: '¥',
      [Currency.INR]: '₹'
    };
    return symbols[currency] || '$';
  };

  const formatCurrency = (amount: number): string => {
    const symbol = getCurrencySymbol(userData.currency);
    return `${symbol}${amount.toLocaleString()}`;
  };

  // Create a chart and return its data URL
  const createChart = (config: ChartConfiguration, width: number = 400, height: number = 300): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve('');
        return;
      }

      const chart = new Chart(ctx, config);
      
      // Wait for animation to complete
      setTimeout(() => {
        const dataURL = canvas.toDataURL('image/png');
        chart.destroy();
        resolve(dataURL);
      }, 100);
    });
  };

  // Create financial breakdown pie chart
  const createFinancialBreakdownChart = async (): Promise<string> => {
    const income = userData.monthly_income || 0;
    const expenses = userData.monthly_expenses;
    const investments = userData.monthly_sip;
    const savings = Math.max(0, income - expenses - investments);

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['Expenses', 'Investments', 'Savings'],
        datasets: [{
          data: [expenses, investments, savings],
          backgroundColor: [
            '#EF4444', // Red for expenses
            '#10B981', // Green for investments
            '#3B82F6'  // Blue for savings
          ],
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: 'Monthly Financial Breakdown',
            font: { size: 16, weight: 'bold' },
            color: '#1F2937'
          },
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 12 },
              color: '#4B5563',
              padding: 15
            }
          }
        }
      }
    };

    return createChart(config);
  };

  // Create net worth projection line chart
  const createNetWorthChart = async (): Promise<string> => {
    if (!simulationResult.net_worth_by_year) return '';

    const years = Object.keys(simulationResult.net_worth_by_year).map(Number).sort((a, b) => a - b);
    const values = years.map(year => simulationResult.net_worth_by_year[year]);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: years.map(year => `Year ${year}`),
        datasets: [{
          label: 'Net Worth',
          data: values,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3B82F6',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: 'Net Worth Projection',
            font: { size: 16, weight: 'bold' },
            color: '#1F2937'
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value: any) {
                return getCurrencySymbol(userData.currency) + (value / 1000).toFixed(0) + 'K';
              },
              color: '#6B7280'
            },
            grid: {
              color: '#E5E7EB'
            }
          },
          x: {
            ticks: {
              color: '#6B7280'
            },
            grid: {
              color: '#E5E7EB'
            }
          }
        }
      }
    };

    return createChart(config);
  };

  // Create goals progress bar chart
  const createGoalsChart = async (): Promise<string> => {
    if (!userData.goals || userData.goals.length === 0) return '';

    const goalNames = userData.goals.map((goal, index) => 
      goal.description || goal.goal_type || `Goal ${index + 1}`
    );
    const goalProgress = userData.goals.map((goal, index) => {
      if (simulationResult.goal_feasibility && simulationResult.goal_feasibility[index]) {
        return simulationResult.goal_feasibility[index] ? 100 : 60; // Simplified progress
      }
      return 75; // Default progress
    });

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: goalNames,
        datasets: [{
          label: 'Achievability %',
          data: goalProgress,
          backgroundColor: goalProgress.map(progress => 
            progress >= 90 ? '#10B981' : progress >= 70 ? '#F59E0B' : '#EF4444'
          ),
          borderColor: '#FFFFFF',
          borderWidth: 1
        }]
      },
      options: {
        responsive: false,
        indexAxis: 'y' as const,
        plugins: {
          title: {
            display: true,
            text: 'Financial Goals Achievability',
            font: { size: 16, weight: 'bold' },
            color: '#1F2937'
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value: any) {
                return value + '%';
              },
              color: '#6B7280'
            },
            grid: {
              color: '#E5E7EB'
            }
          },
          y: {
            ticks: {
              color: '#6B7280'
            },
            grid: {
              color: '#E5E7EB'
            }
          }
        }
      }
    };

    return createChart(config, 500, 300);
  };

  // Create cash flow visualization
  const createCashFlowChart = async (): Promise<string> => {
    const monthlyData = [
      { label: 'Income', value: userData.monthly_income || 0, color: '#10B981' },
      { label: 'Expenses', value: -userData.monthly_expenses, color: '#EF4444' },
      { label: 'Investments', value: -userData.monthly_sip, color: '#8B5CF6' },
      { label: 'Net Cash Flow', value: simulationResult.monthly_cash_flow, color: '#3B82F6' }
    ];

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: monthlyData.map(item => item.label),
        datasets: [{
          data: monthlyData.map(item => item.value),
          backgroundColor: monthlyData.map(item => item.color),
          borderColor: '#FFFFFF',
          borderWidth: 2
        }]
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: 'Monthly Cash Flow Analysis',
            font: { size: 16, weight: 'bold' },
            color: '#1F2937'
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            ticks: {
              callback: function(value: any) {
                return getCurrencySymbol(userData.currency) + (value / 1000).toFixed(1) + 'K';
              },
              color: '#6B7280'
            },
            grid: {
              color: '#E5E7EB'
            }
          },
          x: {
            ticks: {
              color: '#6B7280'
            },
            grid: {
              color: '#E5E7EB'
            }
          }
        }
      }
    };

    return createChart(config);
  };

  const generatePDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let currentY = 20;

      // Header with background
      pdf.setFillColor(59, 130, 246); // Blue background
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      // Title
      pdf.setFontSize(28);
      pdf.setTextColor(255, 255, 255); // White text
      pdf.text('FinSight', pageWidth / 2, 20, { align: 'center' });
      pdf.setFontSize(16);
      pdf.text('AI-Powered Financial Report', pageWidth / 2, 30, { align: 'center' });
      
      currentY = 50;

      // Date and subtitle
      pdf.setFontSize(12);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;

      // Executive Summary Box
      pdf.setFillColor(249, 250, 251); // Light gray background
      pdf.setDrawColor(229, 231, 235); // Border color
      pdf.roundedRect(15, currentY, pageWidth - 30, 35, 3, 3, 'FD');
      
      pdf.setFontSize(14);
      pdf.setTextColor(17, 24, 39);
      pdf.text('Executive Summary', 20, currentY + 10);
      
      pdf.setFontSize(10);
      const cashFlow = simulationResult.monthly_cash_flow;
      const flowStatus = cashFlow >= 0 ? 'Positive' : 'Negative';
      const flowColor = cashFlow >= 0 ? [16, 185, 129] : [239, 68, 68];
      
      pdf.setTextColor(...flowColor);
      pdf.text(`${flowStatus} Cash Flow: ${formatCurrency(Math.abs(cashFlow))}`, 20, currentY + 20);
      
      pdf.setTextColor(17, 24, 39);
      pdf.text(`Total Investments: ${formatCurrency(simulationResult.total_investments)}`, 20, currentY + 27);
      
      currentY += 45;

      // Personal Information Section
      pdf.setFontSize(16);
      pdf.setTextColor(17, 24, 39);
      pdf.text('Personal Profile', 20, currentY);
      currentY += 8;

      // Draw a subtle line under section headers
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(0.5);
      pdf.line(20, currentY, 60, currentY);
      currentY += 8;

      pdf.setFontSize(11);
      const personalInfo = [
        `Age: ${userData.age} years`,
        `Marital Status: ${userData.marital_status}`,
        `Dependents: ${userData.dependents}`,
        `Base Currency: ${userData.currency}`
      ];

      personalInfo.forEach(info => {
        pdf.text(info, 25, currentY);
        currentY += 6;
      });
      currentY += 10;

      // Financial Overview with better formatting
      pdf.setFontSize(16);
      pdf.setTextColor(17, 24, 39);
      pdf.text('Financial Overview', 20, currentY);
      currentY += 8;
      pdf.line(20, currentY, 70, currentY);
      currentY += 10;

      // Create two columns for financial data
      const leftColumn = [
        `Bank Balance: ${formatCurrency(userData.current_bank_balance)}`,
        `Monthly Expenses: ${formatCurrency(userData.monthly_expenses)}`,
        `Other Investments: ${formatCurrency(userData.other_investments)}`
      ];

      const rightColumn = [
        userData.monthly_income ? `Monthly Income: ${formatCurrency(userData.monthly_income)}` : 'Income: Not specified',
        `Monthly SIP: ${formatCurrency(userData.monthly_sip)}`,
        `Annual Return: ${userData.annual_return_rate}%`
      ];

      pdf.setFontSize(10);
      leftColumn.forEach((item, index) => {
        pdf.text(item, 25, currentY + (index * 7));
      });

      rightColumn.forEach((item, index) => {
        pdf.text(item, 110, currentY + (index * 7));
      });

      currentY += 30;

      // Generate and add charts
      const charts = await Promise.all([
        createCashFlowChart(),
        createFinancialBreakdownChart(),
        createNetWorthChart(),
        createGoalsChart()
      ]);

      // Add Cash Flow Chart
      if (charts[0]) {
        if (currentY > pageHeight - 80) {
          pdf.addPage();
          currentY = 20;
        }
        
        pdf.setFontSize(16);
        pdf.setTextColor(17, 24, 39);
        pdf.text('Cash Flow Analysis', 20, currentY);
        currentY += 8;
        pdf.line(20, currentY, 75, currentY);
        currentY += 10;
        
        pdf.addImage(charts[0], 'PNG', 20, currentY, 85, 55);
        currentY += 65;
      }

      // Add Financial Breakdown Chart
      if (charts[1]) {
        if (currentY > pageHeight - 80) {
          pdf.addPage();
          currentY = 20;
        }
        
        pdf.setFontSize(16);
        pdf.setTextColor(17, 24, 39);
        pdf.text('Monthly Budget Breakdown', 20, currentY);
        currentY += 8;
        pdf.line(20, currentY, 85, currentY);
        currentY += 10;
        
        pdf.addImage(charts[1], 'PNG', 110, currentY - 75, 85, 55);
      }

      // New page for projections
      pdf.addPage();
      currentY = 20;

      // Add Net Worth Chart
      if (charts[2]) {
        pdf.setFontSize(16);
        pdf.setTextColor(17, 24, 39);
        pdf.text('Wealth Growth Projection', 20, currentY);
        currentY += 8;
        pdf.line(20, currentY, 85, currentY);
        currentY += 10;
        
        pdf.addImage(charts[2], 'PNG', 20, currentY, 170, 85);
        currentY += 95;
      }

      // Add Goals Chart
      if (charts[3] && userData.goals && userData.goals.length > 0) {
        if (currentY > pageHeight - 80) {
          pdf.addPage();
          currentY = 20;
        }
        
        pdf.setFontSize(16);
        pdf.setTextColor(17, 24, 39);
        pdf.text('Financial Goals Assessment', 20, currentY);
        currentY += 8;
        pdf.line(20, currentY, 90, currentY);
        currentY += 10;
        
        pdf.addImage(charts[3], 'PNG', 15, currentY, 180, 70);
        currentY += 80;
      }

      // Key Metrics with visual indicators
      if (currentY > pageHeight - 60) {
        pdf.addPage();
        currentY = 20;
      }

      pdf.setFontSize(16);
      pdf.setTextColor(17, 24, 39);
      pdf.text('Key Financial Metrics', 20, currentY);
      currentY += 8;
      pdf.line(20, currentY, 75, currentY);
      currentY += 15;

      // Create metric boxes
      const metrics = [
        { 
          label: 'Monthly Cash Flow', 
          value: formatCurrency(simulationResult.monthly_cash_flow),
          color: simulationResult.monthly_cash_flow >= 0 ? [16, 185, 129] : [239, 68, 68]
        },
        { 
          label: 'Cash Runway', 
          value: `${simulationResult.cash_runway_months} months`,
          color: simulationResult.cash_runway_months > 12 ? [16, 185, 129] : [245, 158, 11]
        },
        { 
          label: 'Total Investments', 
          value: formatCurrency(simulationResult.total_investments),
          color: [139, 92, 246]
        },
        { 
          label: 'Liquid Cash (End)', 
          value: formatCurrency(simulationResult.liquid_cash_end),
          color: [59, 130, 246]
        }
      ];

      metrics.forEach((metric, index) => {
        const boxX = 20 + (index % 2) * 85;
        const boxY = currentY + Math.floor(index / 2) * 25;
        
        // Draw metric box
        pdf.setFillColor(249, 250, 251);
        pdf.setDrawColor(229, 231, 235);
        pdf.roundedRect(boxX, boxY, 80, 20, 2, 2, 'FD');
        
        // Metric label
        pdf.setFontSize(9);
        pdf.setTextColor(107, 114, 128);
        pdf.text(metric.label, boxX + 5, boxY + 8);
        
        // Metric value
        pdf.setFontSize(11);
        pdf.setTextColor(...metric.color);
        pdf.text(metric.value, boxX + 5, boxY + 15);
      });

      currentY += 60;

      // AI Advice Section with better formatting
      if (aiAdvice) {
        if (currentY > pageHeight - 60) {
          pdf.addPage();
          currentY = 20;
        }

        // AI Advice header with icon-like decoration
        pdf.setFillColor(67, 56, 202);
        pdf.circle(25, currentY + 5, 3, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.text('AI', 25, currentY + 7, { align: 'center' });

        pdf.setFontSize(16);
        pdf.setTextColor(17, 24, 39);
        pdf.text('AI Financial Recommendations', 35, currentY + 8);
        currentY += 15;

        if (aiAdvice.general_advice) {
          pdf.setFillColor(239, 246, 255);
          pdf.setDrawColor(147, 197, 253);
          const textHeight = Math.max(25, pdf.splitTextToSize(aiAdvice.general_advice, pageWidth - 50).length * 5 + 10);
          pdf.roundedRect(20, currentY, pageWidth - 40, textHeight, 3, 3, 'FD');
          
          pdf.setFontSize(11);
          pdf.setTextColor(30, 64, 175);
          pdf.text('💡 General Advice', 25, currentY + 8);
          
          pdf.setFontSize(9);
          pdf.setTextColor(17, 24, 39);
          const splitText = pdf.splitTextToSize(aiAdvice.general_advice, pageWidth - 50);
          pdf.text(splitText, 25, currentY + 15);
          currentY += textHeight + 10;
        }

        if (aiAdvice.action_items && aiAdvice.action_items.length > 0) {
          if (currentY > pageHeight - 40) {
            pdf.addPage();
            currentY = 20;
          }

          pdf.setFontSize(12);
          pdf.setTextColor(239, 68, 68);
          pdf.text('🎯 Action Items:', 20, currentY);
          currentY += 10;

          aiAdvice.action_items.forEach((item: string, index: number) => {
            if (currentY > pageHeight - 20) {
              pdf.addPage();
              currentY = 20;
            }
            
            pdf.setFontSize(9);
            pdf.setTextColor(17, 24, 39);
            pdf.circle(25, currentY + 2, 1.5, 'F');
            const splitText = pdf.splitTextToSize(`${item}`, pageWidth - 50);
            pdf.text(splitText, 30, currentY + 3);
            currentY += splitText.length * 4 + 5;
          });
          currentY += 10;
        }
      }

      // Professional footer
      pdf.setFillColor(17, 24, 39);
      pdf.rect(0, pageHeight - 20, pageWidth, 20, 'F');
      
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);
      pdf.text('FinSight - AI-Powered Personal Financial Planning', pageWidth / 2, pageHeight - 12, { align: 'center' });
      pdf.text('Confidential Financial Report', pageWidth / 2, pageHeight - 6, { align: 'center' });

      // Download the PDF
      const fileName = `FinSight_Visual_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <button
      onClick={generatePDF}
      className={`inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${className}`}
    >
      <svg 
        className="w-5 h-5 mr-2" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
        />
      </svg>
      Export Visual PDF Report
    </button>
  );
};

export default PDFExport; 