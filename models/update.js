const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    username: { type: String, required: true },
    userType: { type: String },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Update', updateSchema);