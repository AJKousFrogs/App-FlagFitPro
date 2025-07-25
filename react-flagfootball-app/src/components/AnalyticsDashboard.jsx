import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Select, DatePicker, Spin, Alert } from 'antd';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrophyOutlined, UserOutlined, FireOutlined, ClockCircleOutlined, BarChartOutlined, DashboardOutlined } from '@ant-design/icons';
// Removed direct import - will use dynamic import when needed

const { Option } = Select;
const { RangePicker } = DatePicker;

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [userBehaviorData, setUserBehaviorData] = useState(null);
  const [error, setError] = useState(null);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [analytics, performance, behavior] = await Promise.all([
        hybridAnalyticsService.getAdvancedAnalytics({ timeframe }),
        hybridAnalyticsService.getPerformanceReport({ timeframe }),
        hybridAnalyticsService.getUserBehavior({ timeframe })
      ]);

      setAnalyticsData(analytics);
      setPerformanceData(performance);
      setUserBehaviorData(behavior);
    } catch (err) {
      setError('Failed to load analytics data. Using basic analytics.');
      console.error('Analytics error:', err);
      
      // Fallback to basic analytics
      try {
        const basicAnalytics = await hybridAnalyticsService.getBasicAnalytics({ timeframe });
        setAnalyticsData(basicAnalytics);
      } catch (basicErr) {
        console.error('Basic analytics also failed:', basicErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe]);

  const handleTimeframeChange = (value) => {
    setTimeframe(value);
  };

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  const metrics = analyticsData?.metrics || {};
  const events = analyticsData?.events || [];
  const topPages = analyticsData?.topPages || [];

  // Transform data for charts
  const eventTypeData = events.reduce((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(eventTypeData).map(([type, count]) => ({
    name: type.replace('_', ' ').toUpperCase(),
    value: count,
    percentage: ((count / events.length) * 100).toFixed(1)
  }));

  // Daily activity data
  const dailyActivity = events.reduce((acc, event) => {
    const date = new Date(event.created_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const lineData = Object.entries(dailyActivity)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([date, count]) => ({ date, events: count }));

  // Feature usage data
  const featureUsage = userBehaviorData?.featureUsage || [];
  const featureBarData = featureUsage.slice(0, 8).map(feature => ({
    feature: feature.feature,
    usage: feature.usageCount,
    users: feature.uniqueUsers
  }));

  // Performance metrics
  const performanceSummary = performanceData?.summary || {};
  const performanceTrends = performanceData?.trends || [];

  // User journey data
  const userJourneys = userBehaviorData?.userJourneys || [];
  const conversionFunnel = userBehaviorData?.conversionFunnel || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive app usage and performance insights</p>
        </div>
        <div className="flex space-x-4">
          <Select
            value={timeframe}
            onChange={handleTimeframeChange}
            className="w-32"
          >
            <Option value="1d">Last 24h</Option>
            <Option value="7d">Last 7 days</Option>
            <Option value="30d">Last 30 days</Option>
            <Option value="90d">Last 90 days</Option>
          </Select>
        </div>
      </div>

      {error && (
        <Alert
          message="Limited Analytics"
          description={error}
          type="warning"
          showIcon
          closable
        />
      )}

      {/* Key Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Events"
              value={metrics.totalEvents || 0}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#3B82F6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Unique Users"
              value={metrics.uniqueUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#10B981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Training Sessions"
              value={metrics.trainingEvents || 0}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#F59E0B' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Load Time"
              value={performanceSummary.avgLoadTime || 0}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#EF4444' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Daily Activity" extra={<DashboardOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="events" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Event Types Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Feature Usage">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={featureBarData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="feature" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="usage" fill="#3B82F6" />
                <Bar dataKey="users" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Performance Trends">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgLoadTime" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Load Time (ms)"
                />
                <Line 
                  type="monotone" 
                  dataKey="avgApiResponse" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  name="API Response (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Tables Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Top Pages">
            <Table
              dataSource={topPages}
              columns={[
                {
                  title: 'Page',
                  dataKey: 'page_url',
                  key: 'page_url',
                  render: (url) => {
                    try {
                      return new URL(url).pathname;
                    } catch {
                      return url;
                    }
                  }
                },
                {
                  title: 'Visits',
                  dataKey: 'visits',
                  key: 'visits',
                  sorter: (a, b) => a.visits - b.visits,
                  defaultSortOrder: 'descend'
                }
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="User Journeys">
            <Table
              dataSource={userJourneys.slice(0, 10)}
              columns={[
                {
                  title: 'Journey',
                  dataKey: 'journey',
                  key: 'journey',
                  ellipsis: true
                },
                {
                  title: 'Frequency',
                  dataKey: 'frequency',
                  key: 'frequency',
                  sorter: (a, b) => a.frequency - b.frequency,
                  defaultSortOrder: 'descend'
                },
                {
                  title: 'Avg Duration',
                  dataKey: 'avgDurationSeconds',
                  key: 'duration',
                  render: (seconds) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`
                }
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Performance Details */}
      {performanceSummary.totalMeasurements > 0 && (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="Performance Metrics">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Average Load Time"
                    value={performanceSummary.avgLoadTime}
                    suffix="ms"
                    precision={2}
                  />
                  <Progress 
                    percent={Math.min((performanceSummary.avgLoadTime / 3000) * 100, 100)} 
                    status={performanceSummary.avgLoadTime > 3000 ? 'exception' : 'success'}
                    showInfo={false}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="95th Percentile Load Time"
                    value={performanceSummary.p95LoadTime}
                    suffix="ms"
                    precision={2}
                  />
                  <Progress 
                    percent={Math.min((performanceSummary.p95LoadTime / 5000) * 100, 100)} 
                    status={performanceSummary.p95LoadTime > 5000 ? 'exception' : 'success'}
                    showInfo={false}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Average API Response"
                    value={performanceSummary.avgApiResponse}
                    suffix="ms"
                    precision={2}
                  />
                  <Progress 
                    percent={Math.min((performanceSummary.avgApiResponse / 1000) * 100, 100)} 
                    status={performanceSummary.avgApiResponse > 1000 ? 'exception' : 'success'}
                    showInfo={false}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      {/* Conversion Funnel */}
      {conversionFunnel.length > 0 && (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="Conversion Funnel">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conversionFunnel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="step" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="uniqueUsers" fill="#3B82F6" name="Unique Users" />
                  <Bar dataKey="totalEvents" fill="#10B981" name="Total Events" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default AnalyticsDashboard;