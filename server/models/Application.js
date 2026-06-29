const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  company_name: { type: String, required: true, trim: true },
  position: { type: String, required: true, trim: true },
  resume_content: { type: String, default: '' },
  cover_letter_content: { type: String, default: '' },
  status: {
    type: String,
    enum: ['applied', 'interview', 'rejected', 'offer', 'ghosted'],
    default: 'applied'
  },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Application', applicationSchema);
