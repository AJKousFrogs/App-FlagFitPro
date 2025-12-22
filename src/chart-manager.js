// Chart.js Integration Manager for FlagFit Pro
// Handles all data visualization and chart creation

import { logger } from "./logger.js";

// Dynamic import with fallback for older browsers
let Chart;
const chartLoadPromise = null;

// Async function to load Chart.js dynamically
async function loadChart() {
    if (Chart) {return Chart;}

    try {
        // Try window.Chart first (if already loaded via script tag)
        if (typeof window !== 'undefined' && window.Chart) {
            Chart = window.Chart;
            return Chart;
        }

        // Try dynamic import for ES modules
        const chartModule = await import('chart.js/auto');
        Chart = chartModule.default || chartModule;
        return Chart;
    } catch (error) {
        logger.warn('Chart.js not available, charts will not render:', error);
        return null;
    }
}

// Load date adapter asynchronously
async function loadDateAdapter() {
    try {
        if (typeof window !== 'undefined' && !window.chartjsDateAdapterLoaded) {
            await import('chartjs-adapter-date-fns');
            window.chartjsDateAdapterLoaded = true;
        }
    } catch (error) {
        logger.warn('Chart.js date adapter not available:', error);
    }
}

class ChartManager {
    constructor() {
        this.charts = new Map();
        this.isReady = false;
        this.chartColors = {
            primary: '#3B82F6',
            secondary: '#10B981',
            accent: '#F59E0B',
            danger: '#EF4444',
            warning: '#F97316',
            info: '#06B6D4',
            success: '#22C55E',
            neutral: '#6B7280'
        };
        this.gradientColors = {
            primary: ['#3B82F6', '#1D4ED8'],
            secondary: ['#10B981', '#059669'],
            accent: ['#F59E0B', '#D97706']
        };
    }

    async ensureChartLoaded() {
        if (!Chart) {
            Chart = await loadChart();
            await loadDateAdapter();
        }

        if (!Chart) {
            logger.error('Chart.js is not available. Charts will not render.');
            throw new Error('Chart.js library not loaded');
        }

        this.isReady = true;
        return Chart;
    }

    // Initialize all charts on the dashboard
    async initializeCharts() {
        try {
            logger.info('🎨 Initializing Chart.js charts...');

            // Check if we're in a browser environment
            if (typeof window === 'undefined' || typeof document === 'undefined') {
                throw new Error('Chart manager must run in a browser environment');
            }

            // Ensure Chart.js is loaded
            await this.ensureChartLoaded();
            
            // Performance Trends Chart
            this.createPerformanceTrendsChart();
            
            // Team Chemistry Radar Chart
            this.createTeamChemistryChart();
            
            // Training Distribution Pie Chart
            this.createTrainingDistributionChart();
            
            // Position Performance Comparison
            this.createPositionPerformanceChart();
            
            // Olympic Qualification Progress
            this.createOlympicProgressChart();
            
            // Injury Risk Gauge
            this.createInjuryRiskChart();
            
            // Speed Development Line Chart
            this.createSpeedDevelopmentChart();
            
            // User Engagement Funnel
            this.createEngagementFunnelChart();
            
            logger.info('✅ All charts initialized successfully');
        } catch (error) {
            logger.error('❌ Error initializing charts:', error);
            // Show user-friendly error message
            this.showChartError(error);
        }
    }

    // Show chart error message
    showChartError(error) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error';

        // Create elements safely without innerHTML to prevent XSS
        const container = document.createElement('div');
        container.style.textAlign = 'center';
        container.style.padding = '2rem';

        const title = document.createElement('h3');
        title.textContent = 'Chart Loading Error';

        const message = document.createElement('p');
        // Use textContent instead of innerHTML to prevent XSS
        message.textContent = `Unable to load charts: ${error.message}`;

        const button = document.createElement('button');
        button.className = 'btn btn-primary';
        button.textContent = 'Refresh Page';
        button.onclick = () => location.reload();

        container.appendChild(title);
        container.appendChild(message);
        container.appendChild(button);
        errorMessage.appendChild(container);

        // Find a good place to show the error
        const dashboardContainer = document.querySelector('.dashboard-container');
        if (dashboardContainer) {
            dashboardContainer.appendChild(errorMessage);
        } else {
            document.body.appendChild(errorMessage);
        }
    }

    // Create performance trends line chart
    createPerformanceTrendsChart() {
        const ctx = this.getChartContext('performanceTrendsChart');
        if (!ctx) {return;}

        try {
            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'],
                    datasets: [{
                        label: 'Overall Performance Score',
                        data: [78, 82, 79, 85, 87, 89, 91],
                        borderColor: this.chartColors.primary,
                        backgroundColor: this.createGradient(ctx, this.gradientColors.primary),
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: this.chartColors.primary,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6
                    }, {
                        label: 'Training Effectiveness',
                        data: [75, 78, 80, 83, 86, 88, 90],
                        borderColor: this.chartColors.secondary,
                        backgroundColor: this.createGradient(ctx, this.gradientColors.secondary),
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: this.chartColors.secondary,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Performance Trends - Last 7 Weeks',
                            font: { size: 16, weight: 'bold' },
                            color: '#1F2937'
                        },
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: { size: 12 }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: this.chartColors.primary,
                            borderWidth: 1
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 70,
                            max: 100,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)',
                                drawBorder: false
                            },
                            ticks: {
                                font: { size: 12 },
                                color: '#6B7280'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: { size: 12 },
                                color: '#6B7280'
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });

            this.charts.set('performanceTrends', chart);
        } catch (error) {
            logger.error('Error creating performance trends chart:', error);
        }
    }

    // Create team chemistry radar chart
    createTeamChemistryChart() {
        const ctx = this.getChartContext('teamChemistryChart');
        if (!ctx) {return;}

        try {
            const chart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: ['Communication', 'Coordination', 'Trust', 'Cohesion', 'Leadership', 'Adaptability'],
                    datasets: [{
                        label: 'Current Team Chemistry',
                        data: [8.5, 7.8, 9.1, 8.2, 7.5, 8.8],
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: this.chartColors.primary,
                        borderWidth: 3,
                        pointBackgroundColor: this.chartColors.primary,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5
                    }, {
                        label: 'Target Chemistry',
                        data: [9.0, 8.5, 9.5, 8.8, 8.0, 9.2],
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        borderColor: this.chartColors.secondary,
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointBackgroundColor: this.chartColors.secondary,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Team Chemistry Analysis',
                            font: { size: 16, weight: 'bold' },
                            color: '#1F2937'
                        },
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: { size: 12 }
                            }
                        }
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 10,
                            ticks: {
                                stepSize: 2,
                                font: { size: 12 },
                                color: '#6B7280'
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            pointLabels: {
                                font: { size: 12, weight: 'bold' },
                                color: '#374151'
                            }
                        }
                    }
                }
            });

            this.charts.set('teamChemistry', chart);
        } catch (error) {
            logger.error('Error creating team chemistry chart:', error);
        }
    }

    // Create training distribution pie chart
    createTrainingDistributionChart() {
        const ctx = this.getChartContext('trainingDistributionChart');
        if (!ctx) {return;}

        try {
            const chart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Agility Training', 'Speed Development', 'Technical Skills', 'Strength Training', 'Recovery Sessions'],
                    datasets: [{
                        data: [30, 25, 20, 15, 10],
                        backgroundColor: [
                            this.chartColors.primary,
                            this.chartColors.secondary,
                            this.chartColors.accent,
                            this.chartColors.warning,
                            this.chartColors.info
                        ],
                        borderColor: '#ffffff',
                        borderWidth: 3,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Training Session Distribution',
                            font: { size: 16, weight: 'bold' },
                            color: '#1F2937'
                        },
                        legend: {
                            position: 'right',
                            labels: {
                                padding: 20,
                                font: { size: 12 },
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: ${value} sessions (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });

            this.charts.set('trainingDistribution', chart);
        } catch (error) {
            logger.error('Error creating training distribution chart:', error);
        }
    }

    // Create position performance comparison bar chart
    createPositionPerformanceChart() {
        const ctx = this.getChartContext('positionPerformanceChart');
        if (!ctx) {return;}

        try {
            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Quarterback', 'Wide Receiver', 'Running Back', 'Defensive Back', 'Rusher'],
                    datasets: [{
                        label: 'Current Performance',
                        data: [87, 92, 89, 85, 78],
                        backgroundColor: this.chartColors.primary,
                        borderColor: this.chartColors.primary,
                        borderWidth: 1,
                        borderRadius: 8,
                        borderSkipped: false
                    }, {
                        label: 'Target Performance',
                        data: [90, 95, 92, 88, 82],
                        backgroundColor: this.chartColors.secondary,
                        borderColor: this.chartColors.secondary,
                        borderWidth: 1,
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Position Performance Comparison',
                            font: { size: 16, weight: 'bold' },
                            color: '#1F2937'
                        },
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: { size: 12 }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)',
                                drawBorder: false
                            },
                            ticks: {
                                font: { size: 12 },
                                color: '#6B7280'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: { size: 12 },
                                color: '#6B7280'
                            }
                        }
                    }
                }
            });

            this.charts.set('positionPerformance', chart);
        } catch (error) {
            logger.error('Error creating position performance chart:', error);
        }
    }

    // Create Olympic qualification progress gauge
    createOlympicProgressChart() {
        const ctx = this.getChartContext('olympicProgressChart');
        if (!ctx) {return;}

        try {
            const chart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Qualification Progress', 'Remaining'],
                    datasets: [{
                        data: [73, 27],
                        backgroundColor: [
                            this.chartColors.success,
                            '#E5E7EB'
                        ],
                        borderColor: '#ffffff',
                        borderWidth: 4,
                        cutout: '75%'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Olympic Qualification Progress',
                            font: { size: 16, weight: 'bold' },
                            color: '#1F2937'
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: false
                        }
                    },
                    cutout: '75%'
                }
            });

            // Add center text if supported
            if (chart.options && chart.options.plugins) {
                const centerText = {
                    id: 'centerText',
                    afterDatasetsDraw: function(chart, args, options) {
                        const { ctx, chartArea: { left, right, top, bottom, width, height } } = chart;
                        
                        ctx.save();
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        
                        // Main percentage
                        ctx.font = 'bold 24px Arial';
                        ctx.fillStyle = '#1F2937';
                        ctx.fillText('73%', width / 2, height / 2 - 10);
                        
                        // Subtitle
                        ctx.font = '14px Arial';
                        ctx.fillStyle = '#6B7280';
                        ctx.fillText('Qualified', width / 2, height / 2 + 15);
                        
                        ctx.restore();
                    }
                };

                chart.options.plugins.centerText = centerText;
            }

            this.charts.set('olympicProgress', chart);
        } catch (error) {
            logger.error('Error creating Olympic progress chart:', error);
        }
    }

    // Create injury risk gauge chart
    createInjuryRiskChart() {
        const ctx = this.getChartContext('injuryRiskChart');
        if (!ctx) {return;}

        try {
            const chart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Low Risk', 'Medium Risk', 'High Risk'],
                    datasets: [{
                        data: [75, 20, 5],
                        backgroundColor: [
                            this.chartColors.success,
                            this.chartColors.warning,
                            this.chartColors.danger
                        ],
                        borderColor: '#ffffff',
                        borderWidth: 3,
                        cutout: '60%'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Team Injury Risk Assessment',
                            font: { size: 16, weight: 'bold' },
                            color: '#1F2937'
                        },
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                font: { size: 12 },
                                usePointStyle: true
                            }
                        }
                    },
                    cutout: '60%'
                }
            });

            this.charts.set('injuryRisk', chart);
        } catch (error) {
            logger.error('Error creating injury risk chart:', error);
        }
    }

    // Create speed development line chart
    createSpeedDevelopmentChart() {
        const ctx = this.getChartContext('speedDevelopmentChart');
        if (!ctx) {return;}

        try {
            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'],
                    datasets: [{
                        label: '40-Yard Dash Time',
                        data: [4.65, 4.62, 4.58, 4.55, 4.52, 4.49, 4.46],
                        borderColor: this.chartColors.accent,
                        backgroundColor: this.createGradient(ctx, this.gradientColors.accent),
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: this.chartColors.accent,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        yAxisID: 'y'
                    }, {
                        label: '10-Yard Sprint Time',
                        data: [1.68, 1.65, 1.62, 1.60, 1.58, 1.56, 1.54],
                        borderColor: this.chartColors.warning,
                        backgroundColor: this.createGradient(ctx, this.gradientColors.accent),
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: this.chartColors.warning,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        yAxisID: 'y'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Speed Development Progress',
                            font: { size: 16, weight: 'bold' },
                            color: '#1F2937'
                        },
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: { size: 12 }
                            }
                        }
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            reverse: true,
                            min: 1.0,
                            max: 5.0,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)',
                                drawBorder: false
                            },
                            ticks: {
                                font: { size: 12 },
                                color: '#6B7280',
                                callback: function(value) {
                                    return value.toFixed(2) + 's';
                                }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });

            this.charts.set('speedDevelopment', chart);
        } catch (error) {
            logger.error('Error creating speed development chart:', error);
        }
    }

    // Create user engagement funnel chart
    createEngagementFunnelChart() {
        const ctx = this.getChartContext('engagementFunnelChart');
        if (!ctx) {return;}

        try {
            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['App Opens', 'Dashboard Views', 'Training Started', 'Session Complete', 'Goal Set', 'Goal Achieved'],
                    datasets: [{
                        label: 'User Engagement Funnel',
                        data: [1000, 850, 720, 680, 450, 320],
                        backgroundColor: [
                            this.chartColors.primary,
                            this.chartColors.secondary,
                            this.chartColors.accent,
                            this.chartColors.warning,
                            this.chartColors.info,
                            this.chartColors.success
                        ],
                        borderColor: '#ffffff',
                        borderWidth: 2,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        title: {
                            display: true,
                            text: 'User Engagement Funnel',
                            font: { size: 16, weight: 'bold' },
                            color: '#1F2937'
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed.x;
                                    const total = context.dataset.data[0];
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${value} users (${percentage}%)`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)',
                                drawBorder: false
                            },
                            ticks: {
                                font: { size: 12 },
                                color: '#6B7280'
                            }
                        },
                        y: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: { size: 12 },
                                color: '#6B7280'
                            }
                        }
                    }
                }
            });

            this.charts.set('engagementFunnel', chart);
        } catch (error) {
            logger.error('Error creating engagement funnel chart:', error);
        }
    }

    // Get chart context with error handling
    getChartContext(canvasId) {
        try {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                logger.warn(`Canvas element with id '${canvasId}' not found`);
                return null;
            }
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                logger.error(`Unable to get 2D context for canvas '${canvasId}'`);
                return null;
            }
            
            return ctx;
        } catch (error) {
            logger.error(`Error getting chart context for '${canvasId}':`, error);
            return null;
        }
    }

    // Create gradient background for charts with fallback
    createGradient(ctx, colors) {
        try {
            if (!ctx || !ctx.createLinearGradient) {
                // Fallback to solid color if gradient not supported
                return colors[0];
            }
            
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, colors[0]);
            gradient.addColorStop(1, colors[1]);
            return gradient;
        } catch (error) {
            logger.warn('Gradient creation failed, using solid color:', error);
            return colors[0];
        }
    }

    // Update chart data dynamically
    updateChart(chartName, newData) {
        try {
            const chart = this.charts.get(chartName);
            if (chart && chart.data) {
                chart.data = newData;
                chart.update();
            }
        } catch (error) {
            logger.error(`Error updating chart '${chartName}':`, error);
        }
    }

    // Resize all charts (useful for responsive design)
    resizeCharts() {
        try {
            this.charts.forEach(chart => {
                if (chart && typeof chart.resize === 'function') {
                    chart.resize();
                }
            });
        } catch (error) {
            logger.error('Error resizing charts:', error);
        }
    }

    // Destroy all charts (cleanup)
    destroyCharts() {
        try {
            this.charts.forEach(chart => {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                }
            });
            this.charts.clear();
        } catch (error) {
            logger.error('Error destroying charts:', error);
        }
    }

    // Get chart instance by name
    getChart(chartName) {
        return this.charts.get(chartName);
    }

    // Check if charts are working
    isChartsAvailable() {
        return typeof Chart !== 'undefined' && Chart !== null;
    }
}

export default ChartManager;
