const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { Document, Packer, Paragraph, TextRun, ImageRun } = require('docx');

/**
 * Generate basic task report document
 * @param {Object} task - Task object
 * @param {Array} updates - Update objects
 * @param {Array} defects - Defect objects
 * @returns {Promise<string>} - Path to the generated document
 */
async function generateTaskReport(task, updates, defects) {
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Task Report: ${task.taskName}`,
                                bold: true,
                                size: 28
                            })
                        ]
                    }),
                    new Paragraph(" "),
                    new Paragraph({
                        children: [
                            new TextRun(`Status: ${task.status}`),
                            new TextRun("\nCreated: " + moment(task.createdAt).format('YYYY-MM-DD HH:mm')),
                            task.completedAt ? new TextRun("\nCompleted: " + moment(task.completedAt).format('YYYY-MM-DD HH:mm')) : new TextRun("")
                        ]
                    }),
                    new Paragraph(" "),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Updates:",
                                bold: true
                            })
                        ]
                    }),
                    ...updates.map(update => new Paragraph({
                        children: [
                            new TextRun(`${moment(update.timestamp).format('YYYY-MM-DD HH:mm')} - ${update.username} (${update.userType}): ${update.content}`)
                        ]
                    })),
                    new Paragraph(" "),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Defects:",
                                bold: true
                            })
                        ]
                    }),
                    ...defects.map(defect => new Paragraph({
                        children: [
                            new TextRun(`${defect.defectId} - Status: ${defect.status}${defect.resolvedAt ? ' (Resolved: ' + moment(defect.resolvedAt).format('YYYY-MM-DD HH:mm') + ')' : ''}`)
                        ]
                    }))
                ]
            }
        ]
    });
    const buffer = await Packer.toBuffer(doc);
    const docPath = path.join(__dirname, '..', `${task.taskName}.docx`);
    fs.writeFileSync(docPath, buffer);
    return docPath;
}

/**
 * Generate analytics report document
 * @param {Object} task - Task object
 * @param {Array} updates - Update objects
 * @param {Array} defects - Defect objects
 * @param {Object} analyticsData - Analytics data
 * @param {string} chartPath - Path to the chart image
 * @returns {Promise<string>} - Path to the generated document
 */
async function generateAnalyticsReport(task, updates, defects, analyticsData, chartPath) {
    // Read the chart image
    const chartImageData = fs.readFileSync(chartPath);
    
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Task Report with Analytics: ${task.taskName}`,
                                bold: true,
                                size: 28
                            })
                        ]
                    }),
                    new Paragraph(" "),
                    new Paragraph({
                        children: [
                            new TextRun(`Status: ${task.status}`),
                            new TextRun("\nCreated: " + moment(task.createdAt).format('YYYY-MM-DD HH:mm')),
                            task.completedAt ? new TextRun("\nCompleted: " + moment(task.completedAt).format('YYYY-MM-DD HH:mm')) : new TextRun("")
                        ]
                    }),
                    new Paragraph(" "),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Updates:",
                                bold: true
                            })
                        ]
                    }),
                    ...updates.map(update => new Paragraph({
                        children: [
                            new TextRun(`${moment(update.timestamp).format('YYYY-MM-DD HH:mm')} - ${update.username} (${update.userType}): ${update.content}`)
                        ]
                    })),
                    new Paragraph(" "),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Defects:",
                                bold: true
                            })
                        ]
                    }),
                    ...defects.map(defect => new Paragraph({
                        children: [
                            new TextRun(`${defect.defectId} - Status: ${defect.status}${defect.resolvedAt ? ' (Resolved: ' + moment(defect.resolvedAt).format('YYYY-MM-DD HH:mm') + ')' : ''}`)
                        ]
                    })),
                    new Paragraph(" "),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Analytics Summary",
                                bold: true,
                                size: 24
                            })
                        ]
                    }),
                    new Paragraph(" "),
                    ...analyticsData.summary.split('\n').map(point => new Paragraph({
                        children: [
                            new TextRun(point)
                        ]
                    })),
                    new Paragraph(" "),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Key Metrics",
                                bold: true
                            })
                        ]
                    }),
                    ...analyticsData.labels.map((label, i) => new Paragraph({
                        children: [
                            new TextRun(`${label}: ${analyticsData.values[i]}`)
                        ]
                    })),
                    new Paragraph(" "),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Analytics Chart",
                                bold: true
                            })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data: chartImageData,
                                transformation: {
                                    width: 600,
                                    height: 400
                                }
                            })
                        ]
                    })
                ]
            }
        ]
    });
    const buffer = await Packer.toBuffer(doc);
    const docPath = path.join(__dirname, '..', `${task.taskName}_with_analytics.docx`);
    fs.writeFileSync(docPath, buffer);
    return docPath;
}

module.exports = {
    generateTaskReport,
    generateAnalyticsReport
};