const { slackClient } = require('../config/slack');
const taskService = require('../services/taskService');
const documentService = require('../services/documentService');
const analyticsService = require('../services/analyticsService');
const chartService = require('../services/chartService');
const messageParser = require('../utils/messageParser');
const fs = require('fs');

/**
 * Handle incoming Slack messages
 * @param {Object} event - Slack event object
 */
async function handleMessage(event) {
    if (!event.text || !event.channel || event.subtype === 'bot_message') return;
    console.log("Received event:", JSON.stringify(event, null, 2));

    if (event.text.toLowerCase().includes('dev build') || event.text.toLowerCase().includes('development build')) {
        console.log(`Build message received from ${event.user}: ${event.text}`);
        await handleDevBuild(event);
    }
}

/**
 * Handle dev build messages
 * @param {Object} event - Slack event object
 */
async function handleDevBuild(event) {
    try {
        const userInfo = await slackClient.users.info({ user: event.user });
        const username = userInfo.user.real_name || userInfo.user.name;
        
        const taskName = messageParser.extractTaskName(event.text);
        if (!taskName) {
            await slackClient.chat.postMessage({
                channel: event.channel,
                text: `Sorry <@${event.user}>, I couldn't find a valid task name in your message.`
            });
            return;
        }
        
        // Process the task update
        const { task, defectIDs } = await taskService.processTaskUpdate(event, username);
        
        // Prepare response message
        let responseText = `Task "${taskName}" has been updated by <@${event.user}>.`;
        if (defectIDs.length > 0) {
            responseText += ` Defects added: ${defectIDs.join(', ')}`;
        }
        
        await slackClient.chat.postMessage({
            channel: event.channel,
            text: responseText
        });

        // Check for validation completion
        if (event.text.toLowerCase().includes("validation completed working fine")) {
            console.log(`Validation completed message received from ${event.user}: ${event.text}`);
            await handleValidationCompleted(event, defectIDs);
        }
    } catch (err) {
        console.error("Error processing dev build message:", err);
        await slackClient.chat.postMessage({
            channel: event.channel,
            text: `Sorry <@${event.user}>, there was an error processing your message: ${err.message}`
        });
    }
}

/**
 * Handle validation completed messages
 * @param {Object} event - Slack event object
 */
async function handleValidationCompleted(event, defectIDs) {
    try {
        const taskName = messageParser.extractTaskName(event.text);

        if (!taskName) {
            await slackClient.chat.postMessage({
                channel: event.channel,
                text: `Sorry <@${event.user}>, I couldn't find a valid task name in your message.`
            });
            return;
        }

        // Complete the task and get related data
        const { task, updates, defects } = await taskService.completeTask(taskName, defectIDs);
        
        // Generate basic DOCX Report
        const docPath = await documentService.generateTaskReport(task, updates, defects);
        console.log(`Basic document generated at ${docPath}`);
        
        // Store document path in task
        task.documentPath = docPath;
        await task.save();
        console.log(`Task "${taskName}" marked as Completed`);

        // Open DM with task creator
        const dm = await slackClient.conversations.open({ users: task.createdBy });
        const userChannelId = dm.channel.id;

        // Send message that analytics are being generated
        await slackClient.chat.postMessage({ 
            channel: userChannelId, 
            text: `Generating analytics for task "${taskName}"... This may take a moment.` 
        });
        
        // Format task data for analytics
        const taskContent = taskService.formatTaskForAnalytics(task, updates, defects);
        
        // Generate analytics using Gemini
        const analyticsData = await analyticsService.fetchAnalyticsFromGemini(taskContent);
        
        // Generate chart from analytics data
        const chartPath = await chartService.generateChart(analyticsData);
        
        // Generate document with analytics data
        const analyticsDocPath = await documentService.generateAnalyticsReport(task, updates, defects, analyticsData, chartPath);
        
        // Store the analytics document path
        task.analyticsDocumentPath = analyticsDocPath;
        await task.save();
        
        // Send the document with analytics
        await slackClient.files.uploadV2({
            channels: userChannelId,
            file: fs.createReadStream(analyticsDocPath),
            filename: `${task.taskName}_with_analytics.docx`,
            title: `Task Report with Analytics - ${task.taskName}`,
            initial_comment: `Here is your task report with analytics for: *${task.taskName}*`
        });
        
    } catch (err) {
        console.error("Error processing validation completed message:", err);
        await slackClient.chat.postMessage({
            channel: event.channel,
            text: `Sorry <@${event.user}>, there was an error processing your validation message: ${err.message}`
        });
    }
}

module.exports = {
    handleMessage,
    handleDevBuild,
    handleValidationCompleted
};