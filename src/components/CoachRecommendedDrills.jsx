import React, { useState } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

const CoachRecommendedDrills = () => {
  const [selectedDrill, setSelectedDrill] = useState(null);

  const recommendedDrills = [
    {
      id: 1,
      title: "QB Pocket Movement Drills",
      coach: "Coach AJ",
      duration: "30 min",
      difficulty: "Advanced",
      focus: "Decision making under pressure",
      description: "Improve pocket presence and decision-making under pressure.",
      category: "quarterback",
      color: "#3B82F6"
    },
    {
      id: 2,
      title: "QB-WR Chemistry Drills",
      coach: "Team Chemistry",
      duration: "45 min",
      difficulty: "Intermediate",
      focus: "Timing with Mike Johnson",
      description: "Build chemistry and timing with your primary receiver.",
      category: "team",
      color: "#10B981"
    },
    {
      id: 3,
      title: "Blitzer Pass Rush Drills",
      coach: "Defense Coach",
      duration: "25 min",
      difficulty: "Intermediate",
      focus: "Pass rush techniques",
      description: "Improve pass rush effectiveness and pressure.",
      category: "defense",
      color: "#F59E0B"
    },
    {
      id: 4,
      title: "DB Coverage Drills",
      coach: "Defense Coach",
      duration: "35 min",
      difficulty: "Advanced",
      focus: "Coverage techniques",
      description: "Enhance coverage skills and positioning.",
      category: "defense",
      color: "#EF4444"
    }
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return '#10B981';
      case 'Intermediate':
        return '#F59E0B';
      case 'Advanced':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const handleStartDrill = (drill) => {
    // TODO: Implement drill start functionality
  };

  const handleViewDetails = (drill) => {
    setSelectedDrill(drill);
    // TODO: Implement drill details modal/page
  };

  return (
    <div className="coach-recommended-drills">
      <div className="drills-header">
        <h3>Coach-Recommended Drills</h3>
        <p>Personalized training recommendations from your coaching staff</p>
      </div>
      
      <div className="drills-bento-grid">
        {recommendedDrills.map((drill) => (
          <Card key={drill.id} className="drill-card">
            <CardContent className="drill-content">
              <div className="drill-header">
                <h4 className="drill-title">{drill.title}</h4>
                <div className="drill-badges">
                  <Badge 
                    className="coach-badge"
                    style={{ backgroundColor: drill.color, color: 'white' }}
                  >
                    {drill.coach}
                  </Badge>
                </div>
              </div>
              
              <div className="drill-meta">
                <div className="meta-item">
                  <span className="meta-label">Duration:</span>
                  <span className="meta-value">{drill.duration}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Difficulty:</span>
                  <Badge 
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(drill.difficulty), color: 'white' }}
                  >
                    {drill.difficulty}
                  </Badge>
                </div>
              </div>
              
              <div className="drill-focus">
                <strong>Focus:</strong> {drill.focus}
              </div>
              
              <p className="drill-description">{drill.description}</p>
              
              <div className="drill-actions">
                <Button 
                  className="start-drill-btn"
                  onClick={() => handleStartDrill(drill)}
                >
                  Start Drill
                </Button>
                <Button 
                  variant="outline"
                  className="view-details-btn"
                  onClick={() => handleViewDetails(drill)}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CoachRecommendedDrills; 