import React, { useState, useEffect } from 'react';
import { sequentialThoughtService } from '../services/SequentialThoughtService';

const InjuryRiskDecisionTree = ({ 
  initialData = {}, 
  onAssessmentComplete = () => {},
  showFullTree = true 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [assessmentData, setAssessmentData] = useState(initialData);
  const [reasoning, setReasoning] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const assessmentSteps = [
    {
      id: 'symptoms',
      title: '🩺 Current Symptoms',
      description: 'Tell us about any pain, discomfort, or concerns',
      questions: [
        {
          key: 'painLevel',
          label: 'Pain Level (0-10)',
          type: 'slider',
          min: 0,
          max: 10,
          step: 1
        },
        {
          key: 'symptoms',
          label: 'Select all symptoms you\'re experiencing',
          type: 'checkbox',
          options: [
            'Sharp pain',
            'Dull ache',
            'Stiffness',
            'Swelling',
            'Reduced range of motion',
            'Weakness',
            'Tingling/numbness',
            'Catching/locking'
          ]
        },
        {
          key: 'onsetType',
          label: 'How did symptoms start?',
          type: 'radio',
          options: [
            'Sudden/acute',
            'Gradual onset',
            'After specific activity',
            'Unknown'
          ]
        }
      ]
    },
    {
      id: 'history',
      title: '📋 Medical & Training History',
      description: 'Information about your background and previous injuries',
      questions: [
        {
          key: 'previousInjuries',
          label: 'Have you had previous injuries?',
          type: 'radio',
          options: ['Yes', 'No']
        },
        {
          key: 'age',
          label: 'Age',
          type: 'number',
          min: 10,
          max: 80
        },
        {
          key: 'experienceLevel',
          label: 'Training Experience',
          type: 'radio',
          options: [
            'Beginner (< 1 year)',
            'Intermediate (1-3 years)', 
            'Advanced (3-5 years)',
            'Expert (> 5 years)'
          ]
        },
        {
          key: 'biomechanicalIssues',
          label: 'Known movement or posture issues?',
          type: 'radio',
          options: ['Yes', 'No', 'Not sure']
        }
      ]
    },
    {
      id: 'training',
      title: '💪 Current Training',
      description: 'Details about your current training routine',
      questions: [
        {
          key: 'weeklyTrainingHours',
          label: 'Weekly training hours',
          type: 'slider',
          min: 0,
          max: 20,
          step: 0.5
        },
        {
          key: 'averageIntensity',
          label: 'Average training intensity (1-10)',
          type: 'slider',
          min: 1,
          max: 10,
          step: 1
        },
        {
          key: 'trainingIntensity',
          label: 'Recent training intensity compared to normal',
          type: 'radio',
          options: [
            'Much higher than usual',
            'Slightly higher',
            'About the same',
            'Lower than usual'
          ]
        },
        {
          key: 'inadequateRecovery',
          label: 'Do you feel adequately recovered between sessions?',
          type: 'radio',
          options: ['Always', 'Usually', 'Sometimes', 'Rarely', 'Never']
        }
      ]
    },
    {
      id: 'environment',
      title: '🌡️ Environmental Factors',
      description: 'Training environment and conditions',
      questions: [
        {
          key: 'surface',
          label: 'Primary training surface',
          type: 'radio',
          options: [
            'Grass/turf',
            'Track/rubber',
            'Concrete/asphalt',
            'Indoor court',
            'Mixed surfaces'
          ]
        },
        {
          key: 'weather',
          label: 'Recent training conditions',
          type: 'checkbox',
          options: [
            'High temperature (>85°F)',
            'High humidity (>70%)',
            'Cold conditions (<40°F)',
            'Wet/slippery conditions',
            'Indoor/controlled'
          ]
        },
        {
          key: 'equipment',
          label: 'Equipment condition',
          type: 'radio',
          options: [
            'Excellent - new/well-maintained',
            'Good - some wear but functional',
            'Fair - noticeable wear',
            'Poor - needs replacement'
          ]
        }
      ]
    }
  ];

  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      setAssessmentData(initialData);
      if (initialData.autoAnalyze) {
        performAnalysis();
      }
    }
  }, [initialData]);

  const handleAnswerChange = (questionKey, value) => {
    setAssessmentData(prev => ({
      ...prev,
      [questionKey]: value
    }));
  };

  const nextStep = () => {
    if (currentStep < assessmentSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      performAnalysis();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const performAnalysis = async () => {
    setLoading(true);
    setShowResults(true);

    try {
      console.log('🧠 Starting injury risk analysis with Sequential Thought...');
      
      const result = await sequentialThoughtService.performReasoning(
        'injury-risk',
        assessmentData,
        { 
          includeAlternatives: true,
          depth: 3
        }
      );

      setReasoning(result);
      onAssessmentComplete(result);

    } catch (error) {
      console.error('Analysis error:', error);
      setReasoning({
        error: error.message,
        fallback: true,
        reasoning: {
          conclusions: [
            'Unable to complete full analysis',
            'Recommend consulting healthcare professional',
            'Monitor symptoms and adjust training accordingly'
          ]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const resetAssessment = () => {
    setCurrentStep(0);
    setAssessmentData({});
    setReasoning(null);
    setShowResults(false);
  };

  const renderQuestion = (question) => {
    const value = assessmentData[question.key];

    switch (question.type) {
      case 'slider':
        return (
          <div className="question-slider">
            <label>{question.label}</label>
            <div className="slider-container">
              <input
                type="range"
                min={question.min}
                max={question.max}
                step={question.step}
                value={value || question.min}
                onChange={(e) => handleAnswerChange(question.key, Number(e.target.value))}
                className="slider"
              />
              <div className="slider-value">{value || question.min}</div>
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div className="question-checkbox">
            <label>{question.label}</label>
            <div className="checkbox-options">
              {question.options.map(option => (
                <label key={option} className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={(value || []).includes(option)}
                    onChange={(e) => {
                      const currentValues = value || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option]
                        : currentValues.filter(v => v !== option);
                      handleAnswerChange(question.key, newValues);
                    }}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'radio':
        return (
          <div className="question-radio">
            <label>{question.label}</label>
            <div className="radio-options">
              {question.options.map(option => (
                <label key={option} className="radio-option">
                  <input
                    type="radio"
                    name={question.key}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleAnswerChange(question.key, e.target.value)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'number':
        return (
          <div className="question-number">
            <label>{question.label}</label>
            <input
              type="number"
              min={question.min}
              max={question.max}
              value={value || ''}
              onChange={(e) => handleAnswerChange(question.key, Number(e.target.value))}
              className="number-input"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const renderReasoningStep = (step, index) => (
    <div key={index} className="reasoning-step">
      <div className="step-header">
        <span className="step-number">{index + 1}</span>
        <h4>{step.step.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
        <div className={`confidence confidence-${step.confidence > 0.8 ? 'high' : step.confidence > 0.6 ? 'medium' : 'low'}`}>
          {Math.round(step.confidence * 100)}%
        </div>
      </div>
      <div className="step-analysis">
        <p>{step.analysis}</p>
      </div>
      <div className="step-findings">
        <h5>Findings:</h5>
        <ul>
          {step.findings.map((finding, idx) => (
            <li key={idx}>{finding}</li>
          ))}
        </ul>
      </div>
    </div>
  );

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'moderate': return '#f59e0b'; 
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (showResults) {
    return (
      <div className="injury-risk-results">
        <div className="results-header">
          <h2>🩺 Injury Risk Assessment Results</h2>
          <button onClick={resetAssessment} className="reset-button">
            🔄 New Assessment
          </button>
        </div>

        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Analyzing injury risk with sequential reasoning...</p>
          </div>
        )}

        {reasoning && !loading && (
          <div className="assessment-results">
            {reasoning.error ? (
              <div className="error-result">
                <h3>⚠️ Analysis Error</h3>
                <p>{reasoning.error}</p>
                <div className="fallback-recommendations">
                  <h4>General Recommendations:</h4>
                  <ul>
                    {reasoning.reasoning?.conclusions?.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <>
                {/* Risk Level Summary */}
                <div className="risk-summary">
                  <div className="risk-level-indicator">
                    <div 
                      className="risk-circle"
                      style={{ 
                        backgroundColor: getRiskLevelColor(
                          reasoning.recommendations?.[0]?.split(': ')[1] || 'unknown'
                        )
                      }}
                    >
                      <span className="risk-text">
                        {reasoning.recommendations?.[0]?.split(': ')[1] || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div className="risk-details">
                    <h3>Overall Risk Assessment</h3>
                    <p>Confidence Level: {Math.round(reasoning.confidence * 100)}%</p>
                    <p>Analysis Method: {reasoning.reasoning?.method?.replace('-', ' ')}</p>
                  </div>
                </div>

                {/* Sequential Reasoning Steps */}
                {reasoning.reasoning?.steps && (
                  <div className="reasoning-steps">
                    <h3>🧠 Reasoning Process</h3>
                    <div className="steps-container">
                      {reasoning.reasoning.steps.map(renderReasoningStep)}
                    </div>
                  </div>
                )}

                {/* Key Recommendations */}
                <div className="recommendations-section">
                  <h3>💡 Key Recommendations</h3>
                  <div className="recommendations-grid">
                    {reasoning.recommendations.map((rec, idx) => (
                      <div key={idx} className="recommendation-card">
                        <span className="rec-icon">
                          {idx === 0 ? '🎯' : idx === 1 ? '⚡' : idx === 2 ? '🛡️' : '📋'}
                        </span>
                        <p>{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Steps */}
                {reasoning.nextSteps && (
                  <div className="next-steps-section">
                    <h3>📋 Next Steps</h3>
                    <div className="next-steps-timeline">
                      {reasoning.nextSteps.map((step, idx) => (
                        <div key={idx} className="timeline-item">
                          <div className="timeline-marker">{idx + 1}</div>
                          <div className="timeline-content">{step}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Research Backing */}
                {reasoning.reasoning?.researchBacking?.length > 0 && (
                  <div className="research-section">
                    <h3>🔬 Research Support</h3>
                    <div className="research-items">
                      {reasoning.reasoning.researchBacking.map((research, idx) => (
                        <div key={idx} className="research-item">
                          <span className="research-bullet">•</span>
                          <p>{research}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <style jsx>{`
          .injury-risk-results {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }

          .results-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
          }

          .results-header h2 {
            margin: 0;
            color: #1f2937;
          }

          .reset-button {
            padding: 8px 16px;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .reset-button:hover {
            background: #e5e7eb;
          }

          .loading-state {
            text-align: center;
            padding: 40px;
            color: #6b7280;
          }

          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #f3f4f6;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .risk-summary {
            display: flex;
            align-items: center;
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 24px;
          }

          .risk-circle {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 24px;
            color: white;
            font-weight: bold;
            font-size: 18px;
            text-align: center;
          }

          .risk-details h3 {
            margin: 0 0 8px 0;
            color: #1f2937;
          }

          .risk-details p {
            margin: 4px 0;
            color: #6b7280;
          }

          .reasoning-steps {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 24px;
          }

          .reasoning-steps h3 {
            margin: 0 0 20px 0;
            color: #1f2937;
          }

          .reasoning-step {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
          }

          .step-header {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
          }

          .step-number {
            width: 28px;
            height: 28px;
            background: #3b82f6;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            margin-right: 12px;
          }

          .step-header h4 {
            flex: 1;
            margin: 0;
            color: #1f2937;
          }

          .confidence {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }

          .confidence-high { background: #d1fae5; color: #065f46; }
          .confidence-medium { background: #fef3c7; color: #92400e; }
          .confidence-low { background: #fee2e2; color: #991b1b; }

          .step-analysis {
            margin-bottom: 12px;
            color: #4b5563;
          }

          .step-findings h5 {
            margin: 0 0 8px 0;
            color: #374151;
            font-size: 14px;
          }

          .step-findings ul {
            margin: 0;
            padding-left: 20px;
          }

          .step-findings li {
            margin-bottom: 4px;
            color: #6b7280;
          }

          .recommendations-section {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 24px;
          }

          .recommendations-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 16px;
            margin-top: 16px;
          }

          .recommendation-card {
            display: flex;
            align-items: flex-start;
            padding: 16px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
          }

          .rec-icon {
            font-size: 20px;
            margin-right: 12px;
            margin-top: 2px;
          }

          .recommendation-card p {
            margin: 0;
            color: #374151;
            line-height: 1.5;
          }

          .next-steps-section {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 24px;
          }

          .next-steps-timeline {
            margin-top: 16px;
          }

          .timeline-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 16px;
          }

          .timeline-marker {
            width: 32px;
            height: 32px;
            background: #3b82f6;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 16px;
            flex-shrink: 0;
          }

          .timeline-content {
            color: #374151;
            line-height: 1.5;
            margin-top: 4px;
          }

          .research-section {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }

          .research-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 12px;
          }

          .research-bullet {
            color: #3b82f6;
            font-weight: bold;
            margin-right: 8px;
            margin-top: 2px;
          }

          .research-item p {
            margin: 0;
            color: #4b5563;
            line-height: 1.5;
          }

          .error-result {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 20px;
          }

          .error-result h3 {
            color: #dc2626;
            margin: 0 0 12px 0;
          }

          .fallback-recommendations {
            margin-top: 16px;
          }

          .fallback-recommendations h4 {
            color: #374151;
            margin: 0 0 8px 0;
          }

          @media (max-width: 640px) {
            .risk-summary {
              flex-direction: column;
              text-align: center;
            }

            .risk-circle {
              margin-right: 0;
              margin-bottom: 16px;
            }

            .recommendations-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    );
  }

  if (!showFullTree) {
    return null;
  }

  const currentStepData = assessmentSteps[currentStep];

  return (
    <div className="injury-risk-decision-tree">
      <div className="assessment-header">
        <h2>🩺 Injury Risk Assessment</h2>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentStep + 1) / assessmentSteps.length) * 100}%` }}
          ></div>
        </div>
        <div className="step-indicator">
          Step {currentStep + 1} of {assessmentSteps.length}
        </div>
      </div>

      <div className="assessment-step">
        <div className="step-content">
          <h3>{currentStepData.title}</h3>
          <p className="step-description">{currentStepData.description}</p>
          
          <div className="questions-container">
            {currentStepData.questions.map(question => (
              <div key={question.key} className="question-item">
                {renderQuestion(question)}
              </div>
            ))}
          </div>
        </div>

        <div className="navigation-buttons">
          <button 
            onClick={prevStep} 
            disabled={currentStep === 0}
            className="nav-button prev-button"
          >
            ← Previous
          </button>
          
          <button 
            onClick={nextStep}
            className="nav-button next-button"
          >
            {currentStep === assessmentSteps.length - 1 ? '🧠 Analyze Risk' : 'Next →'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .injury-risk-decision-tree {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        .assessment-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .assessment-header h2 {
          margin: 0 0 20px 0;
          color: #1f2937;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.3s ease;
        }

        .step-indicator {
          color: #6b7280;
          font-size: 14px;
        }

        .assessment-step {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .step-content h3 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 1.5rem;
        }

        .step-description {
          color: #6b7280;
          margin-bottom: 30px;
        }

        .questions-container {
          space-y: 24px;
        }

        .question-item {
          margin-bottom: 24px;
        }

        .question-slider label,
        .question-checkbox label,
        .question-radio label,
        .question-number label {
          display: block;
          font-weight: 500;
          color: #374151;
          margin-bottom: 12px;
        }

        .slider-container {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .slider {
          flex: 1;
          height: 6px;
          border-radius: 3px;
          background: #e5e7eb;
          outline: none;
          -webkit-appearance: none;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }

        .slider-value {
          min-width: 30px;
          text-align: center;
          font-weight: bold;
          color: #3b82f6;
        }

        .checkbox-options,
        .radio-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .checkbox-option,
        .radio-option {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .checkbox-option:hover,
        .radio-option:hover {
          background: #f3f4f6;
        }

        .checkbox-option input,
        .radio-option input {
          margin-right: 8px;
        }

        .number-input {
          width: 100px;
          padding: 8px 12px;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          font-size: 16px;
        }

        .number-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .navigation-buttons {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .nav-button {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .prev-button {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .prev-button:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .prev-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .next-button {
          background: #3b82f6;
          color: white;
          border: 1px solid #3b82f6;
        }

        .next-button:hover {
          background: #2563eb;
          border-color: #2563eb;
        }

        @media (max-width: 640px) {
          .injury-risk-decision-tree {
            padding: 16px;
          }

          .assessment-step {
            padding: 20px;
          }

          .navigation-buttons {
            flex-direction: column;
            gap: 12px;
          }

          .nav-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default InjuryRiskDecisionTree;