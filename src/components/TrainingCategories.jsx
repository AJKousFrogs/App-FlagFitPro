import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Progress } from './ui/Progress';

const TrainingCategories = () => {
  const [trainingCategories, setTrainingCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [la28Progress, setLa28Progress] = useState(null);

  // Enhanced training categories with LA28 Olympics focus
  const enhancedTrainingCategories = [
    { id: 1, name: "Route Running", icon: "🏃", completed: 8, total: 15, color: "#3B82F6", description: "Perfect your route running techniques", category_type: "skill", priority: 1, la28_target: 85 },
    { id: 2, name: "Plyometrics", icon: "⚡", completed: 5, total: 12, color: "#F59E0B", description: "Explosive power training", category_type: "strength", priority: 2, la28_target: 80 },
    { id: 3, name: "Speed Training", icon: "🏃‍♂️", completed: 6, total: 8, color: "#EF4444", description: "Improve acceleration and top speed", category_type: "skill", priority: 1, la28_target: 88 },
    { id: 4, name: "Catching", icon: "🎯", completed: 4, total: 10, color: "#8B5CF6", description: "Enhance catching skills", category_type: "skill", priority: 2, la28_target: 90 },
    { id: 5, name: "Flag Pulling", icon: "🏁", completed: 7, total: 14, color: "#10B981", description: "Master flag pulling techniques", category_type: "technique", priority: 2, la28_target: 87 },
    { id: 6, name: "DB Technique", icon: "🛡️", completed: 3, total: 6, color: "#06B6D4", description: "Defensive back positioning", category_type: "technique", priority: 1, la28_target: 85 },
    { id: 7, name: "Pass Deflecting", icon: "✋", completed: 9, total: 16, color: "#F97316", description: "Pass deflection skills", category_type: "technique", priority: 2, la28_target: 82 },
    { id: 8, name: "Zone/Man Coverage", icon: "🎯", completed: 11, total: 18, color: "#84CC16", description: "Coverage strategies", category_type: "technique", priority: 1, la28_target: 86 },
    { id: 9, name: "Snapping", icon: "🏈", completed: 2, total: 5, color: "#EC4899", description: "Center snapping precision", category_type: "technique", priority: 3, la28_target: 89 },
    { id: 10, name: "Strength", icon: "💪", completed: 12, total: 20, color: "#10B981", description: "Functional strength", category_type: "strength", priority: 2, la28_target: 83 },
    { id: 11, name: "Recovery", icon: "🧘", completed: 3, total: 6, color: "#06B6D4", description: "Active recovery protocols", category_type: "recovery", priority: 1, la28_target: 95 },
    { id: 12, name: "Throwing", icon: "🏈", completed: 6, total: 12, color: "#3B82F6", description: "Throwing accuracy and power", category_type: "skill", priority: 1, la28_target: 88 }
  ];

  useEffect(() => {
    // Simulate loading enhanced data from backend
    const loadTrainingData = async () => {
      try {
        // In a real implementation, this would fetch from the backend
        // const response = await fetch('/api/training-categories');
        // const data = await response.json();
        
        // For now, use the enhanced data with LA28 calculations
        const categoriesWithLA28 = enhancedTrainingCategories.map(category => {
          const progress = (category.completed / category.total) * 100;
          const weeksToLA28 = calculateWeeksToLA28();
          const la28Readiness = calculateLA28Readiness(progress, category.la28_target, weeksToLA28);
          
          return {
            ...category,
            progress,
            la28Readiness,
            weeksToLA28,
            predictedFinalScore: calculatePredictedFinalScore(progress, weeksToLA28, category.priority)
          };
        });

        setTrainingCategories(categoriesWithLA28);
        
        // Calculate overall LA28 progress
        const overallProgress = calculateOverallLA28Progress(categoriesWithLA28);
        setLa28Progress(overallProgress);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading training data:', error);
        setLoading(false);
      }
    };

    loadTrainingData();
  }, []);

  const calculateWeeksToLA28 = () => {
    const la28Date = new Date('2028-07-28');
    const now = new Date();
    const timeDiff = la28Date.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24 * 7));
  };

  const calculateLA28Readiness = (currentProgress, targetScore, weeksRemaining) => {
    const progressGap = targetScore - currentProgress;
    const weeklyImprovementNeeded = progressGap / weeksRemaining;
    const weeklyImprovementCapacity = 2; // 2% improvement per week is realistic
    
    return Math.min(100, Math.max(0, (weeklyImprovementCapacity / weeklyImprovementNeeded) * 100));
  };

  const calculatePredictedFinalScore = (currentProgress, weeksRemaining, priority) => {
    const baseWeeklyImprovement = 1.5; // 1.5% base improvement
    const priorityMultiplier = 1 + (1 - priority / 3) * 0.3; // Higher priority = faster improvement
    const weeklyImprovement = baseWeeklyImprovement * priorityMultiplier;
    
    return Math.min(100, currentProgress + (weeklyImprovement * weeksRemaining));
  };

  const calculateOverallLA28Progress = (categories) => {
    const totalReadiness = categories.reduce((sum, cat) => sum + cat.la28Readiness, 0);
    const averageReadiness = totalReadiness / categories.length;
    
    const criticalCategories = categories.filter(cat => cat.priority === 1);
    const criticalReadiness = criticalCategories.reduce((sum, cat) => sum + cat.la28Readiness, 0) / criticalCategories.length;
    
    return {
      overallReadiness: Math.round(averageReadiness),
      criticalReadiness: Math.round(criticalReadiness),
      weeksToLA28: calculateWeeksToLA28(),
      onTrack: averageReadiness >= 70
    };
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#10B981';
    if (progress >= 60) return '#F59E0B';
    if (progress >= 40) return '#3B82F6';
    return '#EF4444';
  };

  const getLA28StatusColor = (readiness) => {
    if (readiness >= 80) return '#10B981';
    if (readiness >= 60) return '#F59E0B';
    if (readiness >= 40) return '#3B82F6';
    return '#EF4444';
  };

  const handleCategoryClick = (category) => {
    // In a real implementation, this would navigate to detailed training view
  };

  if (loading) {
    return (
      <div className="training-categories">
        <div className="categories-header">
          <h3>Training Categories</h3>
          <div className="header-divider"></div>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading LA28 training data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="training-categories">
      <div className="categories-header">
        <h3>Training Categories - LA28 Olympics Preparation</h3>
        <div className="header-divider"></div>
        
        {/* LA28 Progress Overview */}
        {la28Progress && (
          <div className="la28-progress-overview">
            <div className="la28-stats">
              <div className="la28-stat">
                <span className="stat-label">Overall Readiness</span>
                <span className="stat-value" style={{ color: getLA28StatusColor(la28Progress.overallReadiness) }}>
                  {la28Progress.overallReadiness}%
                </span>
              </div>
              <div className="la28-stat">
                <span className="stat-label">Critical Skills</span>
                <span className="stat-value" style={{ color: getLA28StatusColor(la28Progress.criticalReadiness) }}>
                  {la28Progress.criticalReadiness}%
                </span>
              </div>
              <div className="la28-stat">
                <span className="stat-label">Weeks to LA28</span>
                <span className="stat-value">{la28Progress.weeksToLA28}</span>
              </div>
              <div className="la28-stat">
                <span className="stat-label">Status</span>
                <span className={`stat-value ${la28Progress.onTrack ? 'on-track' : 'needs-improvement'}`}>
                  {la28Progress.onTrack ? 'On Track' : 'Needs Focus'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="categories-bento-grid">
        {trainingCategories.map((category) => {
          const progressColor = getProgressColor(category.progress);
          const la28Color = getLA28StatusColor(category.la28Readiness);
          
          return (
            <Card key={category.id} className="category-card" onClick={() => handleCategoryClick(category)}>
              <CardContent className="category-content">
                <div className="category-header">
                  <div className="category-icon">
                    <span className="icon-emoji">{category.icon}</span>
                    {category.priority === 1 && <span className="priority-badge">Critical</span>}
                  </div>
                  <div className="category-info">
                    <h4 className="category-name">{category.name}</h4>
                    <p className="category-description">{category.description}</p>
                    <div className="category-type">{category.category_type}</div>
                  </div>
                </div>
                
                <div className="category-progress">
                  <div className="progress-stats">
                    <span className="progress-text">{category.completed}/{category.total} completed</span>
                    <span className="progress-percentage">{Math.round(category.progress)}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <Progress 
                      value={category.progress} 
                      max={100} 
                      className="progress-bar" 
                      style={{ '--progress-color': progressColor }}
                    />
                  </div>
                </div>
                
                {/* LA28 Olympics Readiness */}
                <div className="la28-readiness">
                  <div className="la28-header">
                    <span className="la28-label">LA28 Target: {category.la28_target}%</span>
                    <span className="la28-readiness-score" style={{ color: la28Color }}>
                      {Math.round(category.la28Readiness)}% Ready
                    </span>
                  </div>
                  <div className="la28-progress-bar">
                    <Progress 
                      value={category.la28Readiness} 
                      max={100} 
                      className="la28-progress" 
                      style={{ '--progress-color': la28Color }}
                    />
                  </div>
                  <div className="la28-prediction">
                    <span className="prediction-label">Predicted Final:</span>
                    <span className="prediction-value">{Math.round(category.predictedFinalScore)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TrainingCategories; 