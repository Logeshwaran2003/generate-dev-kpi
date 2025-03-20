const Task = require('../models/task');
const Update = require('../models/update');
const Defect = require('../models/defect');
const messageParser = require('../utils/messageParser');
const { slackClient } = require('../config/slack');

/**
 * Process a new task update
 * @param {Object} event - Slack event object
 * @param {string} username - User's real name
 * @returns {Promise<Object>} - Created or updated task object
 */
async function processTaskUpdate(event, username) {
    const taskName = messageParser.extractTaskName(event.text);
    if (!taskName) {
        throw new Error('No valid task name found in message');
    }
    
    // Extract defect IDs from the message
    const defectIDs = messageParser.extractDefectIDs(event.text);
    console.log(`Extracted defect IDs for task "${taskName}": ${defectIDs.join(', ') || 'none'}`);
    
    // Find or create task
    let task = await Task.findOne({ taskName });
    if (!task) {
        task = new Task({
            taskName,
            createdBy: event.user
        });
        await task.save();
    }
    
    // Create update
    const update = new Update({
        taskId: task._id,
        username,
        userType: messageParser.determineUserType(username, event.text),
        content: event.text,
        timestamp: new Date()
    });
    await update.save();
    
    // Create defects
    if (defectIDs && defectIDs.length > 0) {
        for (const defectID of defectIDs) {
            // Check if defect already exists
            const existingDefect = await Defect.findOne({ 
                taskId: task._id, 
                defectId: defectID 
            });
            
            if (!existingDefect) {
                const defect = new Defect({
                    taskId: task._id,
                    defectId: defectID,
                    status: 'Open',
                    reportedInUpdate: update._id
                });
                await defect.save();
            }
        }
    }
    
    return { task, defectIDs };
}

/**
 * Mark a task as completed
 * @param {string} taskName - Name of the task to complete
 * @returns {Promise<Object>} - Completed task with related updates and defects
 */
async function completeTask(taskName) {
    const task = await Task.findOne({ taskName });
    
    if (!task || !task.createdBy) {
        throw new Error(`Task "${taskName}" not found in the database.`);
    }

    // Mark Task as Completed
    task.status = "Completed";
    task.completedAt = new Date();
    await task.save();
    
    // Get all updates and defects for this task
    const updates = await Update.find({ taskId: task._id }).sort({ timestamp: 1 });
    const defects = await Defect.find({ taskId: task._id });
    
    return { task, updates, defects };
}

/**
 * Format task data for analytics
 * @param {Object} task - Task object
 * @param {Array} updates - Update objects
 * @param {Array} defects - Defect objects
 * @returns {Object} - Formatted task content for analytics
 */
function formatTaskForAnalytics(task, updates, defects) {
    return {
        taskName: task.taskName,
        status: task.status,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        updates: updates.map(update => ({
            username: update.username,
            userType: update.userType,
            content: update.content,
            timestamp: update.timestamp
        })),
        defects: defects.map(defect => ({
            id: defect.defectId,
            status: defect.status,
            resolvedAt: defect.resolvedAt
        })),
        cycleTime: task.completedAt ? 
            Math.round((task.completedAt - task.createdAt) / (1000 * 60 * 60 * 24)) : 
            "Not completed"
    };
}

module.exports = {
    processTaskUpdate,
    completeTask,
    formatTaskForAnalytics
};