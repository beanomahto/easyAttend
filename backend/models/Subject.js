// models/Subject.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const subjectSchema = new Schema({
    subjectCode: { // Keep consistent naming
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    // REMOVED branch and semester - Subjects are defined generally
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);