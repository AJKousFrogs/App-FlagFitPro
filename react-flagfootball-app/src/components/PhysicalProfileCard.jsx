import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Progress } from './ui/Progress';
import GestureRecognition from './mobile/GestureRecognition';
import { universalRankingService } from '../services/UniversalRankingService';
import { getPositionConfig, getPositionColor, getPositionIcon } from '../utils/positionConfig';

const PhysicalProfileCard = ({ 
  metric, 
  value, 
  position, 
  isClickable = true,
  previousValue = null,
  className = "",
  onMetricAction = null
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Enhanced metric data using UniversalRankingService
  const enhancedMetric = useMemo(() => {
    const rawMetrics = { [metric]: value };
    const enhanced = universalRankingService.enhanceMetrics(rawMetrics, position, 22, 
      previousValue ? { [metric]: previousValue } : null
    );
    return enhanced[metric];
  }, [metric, value, position, previousValue]);

  const positionConfig = getPositionConfig(position);
  const positionColor = getPositionColor(position);

  // Get trend icon and color
  const getTrendDisplay = () => {
    switch (enhancedMetric.trend) {
      case 'improving':
        return { icon: '📈', color: 'text-green-600 dark:text-green-400', label: 'Improving' };
      case 'declining':
        return { icon: '📉', color: 'text-red-600 dark:text-red-400', label: 'Declining' };
      default:
        return { icon: '➡️', color: 'text-gray-600 dark:text-gray-400', label: 'Stable' };
    }
  };

  // Get percentile color based on performance level
  const getPercentileColor = (percentile) => {
    if (percentile >= 90) return 'text-purple-600 dark:text-purple-400';
    if (percentile >= 75) return 'text-green-600 dark:text-green-400';
    if (percentile >= 50) return 'text-blue-600 dark:text-blue-400';
    if (percentile >= 25) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Get importance badge styling
  const getImportanceBadge = (importance) => {
    switch (importance) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const trendDisplay = getTrendDisplay();
  const metricDisplayName = metric.replace(/([A-Z])/g, ' $1').trim();

  const handleCardClick = () => {
    if (isClickable) {
      setExpanded(!expanded);
    }
  };

  // Handle gestures
  const handleGesture = (gestureData) => {
    switch (gestureData.type) {
      case 'tap':
        if (isClickable) {
          handleCardClick();
        }
        break;
      case 'double_tap':
        // Quick action for high importance metrics
        if (enhancedMetric.importance === 'high' && onMetricAction) {
          onMetricAction(metric, 'quick_action');
        }
        break;
      case 'long_press':
        // Show detailed analysis
        if (isClickable) {
          setExpanded(true);
        }
        break;
      case 'swipe_up':
        // Mark as improving
        if (onMetricAction) {
          onMetricAction(metric, 'mark_improving');
        }
        break;
      case 'swipe_down':
        // Mark as declining
        if (onMetricAction) {
          onMetricAction(metric, 'mark_declining');
        }
        break;
      case 'swipe_left':
        // Previous metric (if in a carousel)
        if (onMetricAction) {
          onMetricAction(metric, 'previous');
        }
        break;
      case 'swipe_right':
        // Next metric (if in a carousel)
        if (onMetricAction) {
          onMetricAction(metric, 'next');
        }
        break;
    }
  };

  return (
    <GestureRecognition
      onGesture={handleGesture}
      enabledGestures={['tap', 'double_tap', 'long_press', 'swipe_up', 'swipe_down', 'swipe_left', 'swipe_right']}
      showVisualFeedback={true}
      className="physical-profile-card-container"
    >
      <motion.div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card 
          className={`relative transition-all duration-200 hover:shadow-lg ${
            isClickable ? 'cursor-pointer' : ''
          } ${expanded ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''} ${className}`}
          onClick={handleCardClick}
        >
          <CardContent className="p-4">
            {/* Header with metric name and importance */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                  {metricDisplayName}
                </h3>
                {enhancedMetric.importance === 'high' && (
                  <Badge className={`text-xs ${getImportanceBadge('high')}`}>
                    Key Metric
                  </Badge>
                )}
              </div>
              
              {/* Trend indicator */}
              <div className="flex items-center space-x-1">
                <span className="text-sm">{trendDisplay.icon}</span>
                {expanded && (
                  <span className={`text-xs ${trendDisplay.color}`}>
                    {trendDisplay.label}
                  </span>
                )}
              </div>
            </div>

            {/* Main value display */}
            <motion.div 
              className="text-center mb-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {enhancedMetric.value}
              </div>
              
              {/* Percentile with enhanced styling */}
              <div className={`text-sm font-medium ${getPercentileColor(enhancedMetric.percentile)}`}>
                {enhancedMetric.percentile}th percentile
              </div>
              
              {/* Rank display */}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                #{enhancedMetric.rank.toLocaleString()}/{enhancedMetric.total.toLocaleString()}
              </div>
            </motion.div>

            {/* Progress bar for percentile visualization */}
            <div className="mb-3">
              <Progress 
                value={enhancedMetric.percentile} 
                className="h-2"
                color={enhancedMetric.percentile >= 75 ? 'green' : enhancedMetric.percentile >= 50 ? 'blue' : 'yellow'}
              />
            </div>

            {/* Position relevance indicator */}
            {enhancedMetric.importance === 'high' && (
              <motion.div 
                className="flex items-center justify-center space-x-1 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className={`text-${positionColor}-600 dark:text-${positionColor}-400`}>
                  {getPositionIcon(position)}
                </span>
                <span className={`text-xs text-${positionColor}-600 dark:text-${positionColor}-400 font-medium`}>
                  Critical for {positionConfig.displayName}
                </span>
              </motion.div>
            )}

            {/* Expanded details */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Insight */}
                  <motion.div 
                    className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>💡 Insight:</strong> {enhancedMetric.insight}
                    </p>
                  </motion.div>

                  {/* Detailed breakdown */}
                  <motion.div 
                    className="grid grid-cols-2 gap-3 text-xs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Raw Value:</span>
                      <span className="ml-2 font-medium">{enhancedMetric.rawValue.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">League Avg:</span>
                      <span className="ml-2 font-medium">
                        {universalRankingService.formatValueForDisplay(
                          enhancedMetric.distribution?.mean || 0, 
                          metric
                        )}
                      </span>
                    </div>
                    {enhancedMetric.trendValue !== 0 && (
                      <div className="col-span-2">
                        <span className="text-gray-600 dark:text-gray-400">Change:</span>
                        <span className={`ml-2 font-medium ${
                          enhancedMetric.trendValue > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {enhancedMetric.trendValue > 0 ? '+' : ''}{enhancedMetric.trendValue.toFixed(1)} percentile points
                        </span>
                      </div>
                    )}
                  </motion.div>

                  {/* Position comparison */}
                  <motion.div 
                    className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {positionConfig.displayName} Comparison
                    </h4>
                    <div className="space-y-1 text-xs">
                      {enhancedMetric.percentile >= 75 && (
                        <p className="text-green-600 dark:text-green-400">
                          ✅ Strong asset for {positionConfig.displayName} position
                        </p>
                      )}
                      {enhancedMetric.percentile < 40 && enhancedMetric.importance === 'high' && (
                        <p className="text-red-600 dark:text-red-400">
                          ⚠️ Priority development area for {positionConfig.displayName}
                        </p>
                      )}
                      {enhancedMetric.percentile >= 40 && enhancedMetric.percentile < 75 && (
                        <p className="text-blue-600 dark:text-blue-400">
                          📈 Good foundation with room for improvement
                        </p>
                      )}
                    </div>
                  </motion.div>

                  {/* Quick action button for improvement */}
                  {enhancedMetric.percentile < 60 && enhancedMetric.importance === 'high' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onMetricAction) {
                            onMetricAction(metric, 'start_training');
                          } else {
                            console.log(`Navigate to ${metric} training`);
                          }
                        }}
                      >
                        🎯 Start {metricDisplayName} Training
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Click hint for unexpanded cards */}
            {!expanded && isClickable && (
              <motion.div 
                className="text-center mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Tap for details • Long press for quick actions
                </span>
              </motion.div>
            )}

            {/* Gesture hints for mobile */}
            {isHovered && (
              <motion.div
                className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                💡 Swipe up/down to mark trend
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </GestureRecognition>
  );
};

// Grid component for displaying multiple physical profile cards
export const PhysicalProfileGrid = ({ 
  metrics, 
  position, 
  previousMetrics = null,
  showPositionPriority = true,
  onMetricAction = null
}) => {
  const positionConfig = getPositionConfig(position);
  const priorityMetrics = positionConfig.physicalPriorities || [];
  
  // Separate priority metrics from others
  const priorityData = [];
  const otherData = [];
  
  Object.entries(metrics).forEach(([key, value]) => {
    const metricData = { key, value };
    if (priorityMetrics.includes(key)) {
      priorityData.push(metricData);
    } else {
      otherData.push(metricData);
    }
  });

  return (
    <div className="space-y-6">
      {/* Position Priority Metrics */}
      {showPositionPriority && priorityData.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
            <span>{getPositionIcon(position)}</span>
            <span>{positionConfig.displayName} Priority Metrics</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {priorityData.map(({ key, value }) => (
              <PhysicalProfileCard
                key={key}
                metric={key}
                value={value}
                position={position}
                previousValue={previousMetrics?.[key]}
                className="border-2 border-blue-100 dark:border-blue-900"
                onMetricAction={onMetricAction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Metrics */}
      {otherData.length > 0 && (
        <div>
          {showPositionPriority && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Additional Metrics
            </h3>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {otherData.map(({ key, value }) => (
              <PhysicalProfileCard
                key={key}
                metric={key}
                value={value}
                position={position}
                previousValue={previousMetrics?.[key]}
                onMetricAction={onMetricAction}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhysicalProfileCard;