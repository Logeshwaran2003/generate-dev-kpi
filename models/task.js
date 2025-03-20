const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    taskName: { type: String, required: true, unique: true },
    status: { type: String, default: 'In Progress' },
    createdBy: { type: String }, // Store user ID who first mentions the task
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    documentPath: String,
    analyticsDocumentPath: String // For storing the analytics document path
});

module.exports = mongoose.model('Task', taskSchema);
