const mongoose = require('mongoose');

const defectSchema = new mongoose.Schema({
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    defectId: { type: String, required: true },
    status: { type: String, default: 'Open' },
    reportedInUpdate: { type: mongoose.Schema.Types.ObjectId, ref: 'Update' },
    resolvedAt: { type: Date }
});

module.exports = mongoose.model('Defect', defectSchema);
