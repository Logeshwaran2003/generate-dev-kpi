const fs = require('fs');
const path = require('path');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

/**
 * Generate chart from analytics data
 * @param {Object} data - Analytics data
 * @returns {Promise<string>} - Path to generated chart image
 */
async function generateChart(data) {
    const width = 800;
    const height = 600;
    const chartNodeCanvas = new ChartJSNodeCanvas({ width, height });
    
    // Determine chart type based on data
    const chartType = data.labels.length <= 3 ? 'bar' : 'line';
    
    const config = {
        type: chartType,
        data: {
            labels: data.labels,
            datasets: [{
                label: "Task Analytics",
                data: data.values,
                backgroundColor: "rgba(75,192,192,0.2)",
                borderColor: "rgba(75,192,192,1)",
                borderWidth: 1,
                fill: chartType === 'line' ? false : undefined
            }]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Task Performance Analytics',
                    font: {
                        size: 18
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Value'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Metrics'
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: true
        }
    };
    
    // Generate and save the chart
    const image = await chartNodeCanvas.renderToBuffer(config);
    const chartPath = path.join(__dirname, '..', `analytics-${Date.now()}.png`);
    fs.writeFileSync(chartPath, image);
    return chartPath;
}

module.exports = {
    generateChart
};