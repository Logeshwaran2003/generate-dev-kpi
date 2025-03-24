const { slackClient } = require('../config/slack');
const Task = require('../models/task');
const Update = require('../models/update');
const Defect = require('../models/defect');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { Document, Packer, Paragraph, TextRun } = require('docx');

async function handleFiltersCommand(req, res) {
    try {
        const { text, channel_id } = req.body;

        if (text === 'clear') {
            const responseMessage = await deleteMessages(channel_id);
            return res.json({ text: responseMessage });
        }


        console.log(`Filter command received: ${text}`);

        await slackClient.chat.postMessage({
            channel: channel_id,
            text: `Fetching Filtered Report....`
        });

        // Parse the command arguments
        const args = text.trim().split(/\s+/);
        let userMention, startDate, endDate, status;

        for (const arg of args) {
            if (arg.startsWith('@')) {
                userMention = arg.substring(1); // Remove the @ symbol
            } else if (arg.match(/^\d{4}-\d{2}-\d{2}$/)) {
                if (!startDate) {
                    startDate = arg;
                } else {
                    endDate = arg;
                }
            } else if (['In Progress', 'Completed'].includes(arg)) {
                status = arg;
            }
        }

        // If we have a username mention, we need to find the corresponding user ID
        let userId;
        if (userMention) {
            try {
                // This assumes you have a function or method to look up user ID by name
                // You might need to implement this with Slack API
                const userInfo = await getUserIdFromName(userMention);
                userId = userInfo.id;
            } catch (error) {
                console.error(`Failed to find user ID for ${userMention}:`, error);
                await slackClient.chat.postMessage({
                    channel: channel_id,
                    text: `Couldn't find user "${userMention}". Please check the username and try again.`
                });
                return res.status(200).send();
            }
        }

        const query = {};
        if (userId) query.createdBy = userId;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59');
        }
        if (status) query.status = status;

        const tasks = await Task.find(query).sort({ createdAt: -1 });

        if (tasks.length === 0) {
            await slackClient.chat.postMessage({
                channel: channel_id,
                text: `No tasks found matching your criteria.`
            });
            return res.status(200).send();
        }

        const reportPath = await generateFilteredReport(tasks);

        await slackClient.files.uploadV2({
            channels: channel_id,
            file: fs.createReadStream(reportPath),
            filename: `filtered_tasks_report.docx`,
            title: `Filtered Tasks Report`,
            initial_comment: `Here is your filtered tasks report. Found ${tasks.length} tasks matching your criteria.`
        });

        setTimeout(() => fs.unlinkSync(reportPath), 60000);
        res.status(200).send();

    } catch (err) {
        console.error("Error processing filter command:", err);
        res.status(500).send();
    }
}

// Function to get user ID from name using Slack API
async function getUserIdFromName(username) {
    try {
        // Use Slack users.list API method to get all users
        const result = await slackClient.users.list();
        
        // Find the user whose name matches (case insensitive)
        const user = result.members.find(
            member => member.name.toLowerCase() === username.toLowerCase() || 
                     (member.profile.display_name && 
                      member.profile.display_name.toLowerCase() === username.toLowerCase())
        );
        
        if (!user) {
            throw new Error(`User "${username}" not found`);
        }
        
        return { id: user.id, name: user.name };
    } catch (error) {
        console.error(`Error finding user "${username}":`, error);
        throw error;
    }
}

async function deleteMessages(channelId) {
    try {
        // Fetch messages in the channel
        const result = await slackClient.conversations.history({
            channel: channelId,
            limit: 100, // Adjust as needed
        });

        const messages = result.messages;

        for (const message of messages) {
            if (message.ts) {
                await slackClient.chat.delete({
                    channel: channelId,
                    ts: message.ts,
                });
            }
        }

        return `✅ Deleted ${messages.length} messages from <#${channelId}>`;
    } catch (error) {
        console.error('Error deleting messages:', error);
        return '❌ Failed to delete messages.';
    }
}

async function generateFilteredReport(tasks) {
    const tempDir = path.join(__dirname, '../temp');

    // Ensure the temp directory exists
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const doc = new Document({
        sections: [
            {
                children: [
                    new Paragraph({
                        children: [new TextRun({ text: "Filtered Tasks Report", bold: true, size: 28 })]
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: `Report generated on: ${moment().format('YYYY-MM-DD HH:mm')}`, italics: true })]
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: `Total tasks found: ${tasks.length}`, bold: true })]
                    }),
                    new Paragraph(" ")
                ]
            }
        ]
    });

    for (const task of tasks) {
        const updates = await Update.find({ taskId: task._id }).sort({ timestamp: 1 });
        const defects = await Defect.find({ taskId: task._id });

        doc.addSection({
            children: [
                new Paragraph({ children: [new TextRun({ text: `Task: ${task.taskName}`, bold: true, size: 24 })] }),
                new Paragraph({
                    children: [
                        new TextRun(`Status: ${task.status}`),
                        new TextRun("\nCreated By: " + task.createdBy),
                        new TextRun("\nCreated: " + moment(task.createdAt).format('YYYY-MM-DD HH:mm')),
                        task.completedAt ? new TextRun("\nCompleted: " + moment(task.completedAt).format('YYYY-MM-DD HH:mm')) : new TextRun(""),
                        new TextRun("\nCycle Time: " + (task.completedAt ? Math.round((task.completedAt - task.createdAt) / (1000 * 60 * 60 * 24)) + " days" : "Not completed"))
                    ]
                }),
                new Paragraph({ children: [new TextRun({ text: `Updates (${updates.length})`, bold: true })] }),
                ...updates.map(update => new Paragraph({
                    children: [
                        new TextRun(`${moment(update.timestamp).format('YYYY-MM-DD HH:mm')} - ${update.username} (${update.userType}): ${update.content.substring(0, 100)}${update.content.length > 100 ? '...' : ''}`)
                    ]
                })),
                new Paragraph({ children: [new TextRun({ text: `Defects (${defects.length})`, bold: true })] }),
                ...defects.map(defect => new Paragraph({
                    children: [
                        new TextRun(`${defect.defectId} - Status: ${defect.status}${defect.resolvedAt ? ' (Resolved: ' + moment(defect.resolvedAt).format('YYYY-MM-DD HH:mm') + ')' : ''}`)
                    ]
                })),
                new Paragraph({ children: [new TextRun({ text: "─".repeat(50), color: "999999" })] })
            ]
        });
    }

    const buffer = await Packer.toBuffer(doc);
    const docPath = path.join(tempDir, `filtered_tasks_${Date.now()}.docx`);
    fs.writeFileSync(docPath, buffer);
    return docPath;
}

// Add this function to your existing code
async function sendWelcomeMessage(channelId) {
    await slackClient.chat.postMessage({
      channel: channelId,
      text: "Welcome to the Dev KPI bot! Here are some useful filter commands:",
      blocks: [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "*Welcome to the Dev KPI bot!* Here are some useful filter commands:"
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "• `/filters U1234567890` - Filter by user only\n• `/filters 2023-01-01 2023-01-31` - Filter by date range only\n• `/filters Completed` - Filter by status only"
          }
        }
      ]
    });
  }

module.exports = { handleFiltersCommand, sendWelcomeMessage };