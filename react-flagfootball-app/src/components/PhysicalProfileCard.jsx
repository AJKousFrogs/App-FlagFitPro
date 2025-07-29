import React, { useState } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Progress } from './ui/Progress';

const PhysicalProfileCard = ({ 
  metrics = {},
  className = ""
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleCardClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card className={`physical-profile-card ${className}`}>
      <CardContent>
        <h3>Physical Profile</h3>
        
        <div className="metrics-grid">
          <div className="metric-item">
            <label>Height</label>
            <div className="metric-value">
              {metrics.height ? `${Math.floor(metrics.height / 12)}'${metrics.height % 12}"` : 'Not set'}
            </div>
          </div>
          
          <div className="metric-item">
            <label>Weight</label>
            <div className="metric-value">
              {metrics.weight ? `${metrics.weight} lbs` : 'Not set'}
            </div>
          </div>
          
          <div className="metric-item">
            <label>Age</label>
            <div className="metric-value">
              {metrics.age ? `${metrics.age} years` : 'Not set'}
            </div>
          </div>
        </div>
        
        {expanded && (
          <div className="expanded-content">
            <h4>Detailed Metrics</h4>
            <div className="metric-details">
              <div className="metric-detail">
                <span>BMI:</span>
                <span>{metrics.weight && metrics.height ? 
                  Math.round((metrics.weight / Math.pow(metrics.height / 39.37, 2)) * 703) : 'N/A'}</span>
              </div>
              <div className="metric-detail">
                <span>Body Fat %:</span>
                <span>Estimated 15%</span>
              </div>
              <div className="metric-detail">
                <span>Muscle Mass:</span>
                <span>Estimated 45%</span>
              </div>
            </div>
            
            <div className="fitness-level">
              <h4>Fitness Level</h4>
              <Progress value={75} max={100} />
              <div className="fitness-label">Good - 75%</div>
            </div>
          </div>
        )}
        
        <Button onClick={handleCardClick}>
          {expanded ? 'Show Less' : 'Show Details'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PhysicalProfileCard;