const Application = require('../models/Application');

async function getAll(req, res) {
  try {
    const applications = await Application.find().sort({ created_at: -1 });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getOne(req, res) {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ error: 'Application not found' });
    res.json(application);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    const { company_name, position, resume_content, cover_letter_content, status, created_at } = req.body;
    const application = await Application.create({
      company_name,
      position,
      resume_content,
      cover_letter_content,
      status,
      ...(created_at && { created_at })
    });
    res.status(201).json(application);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const { company_name, position, resume_content, cover_letter_content, status } = req.body;
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { company_name, position, resume_content, cover_letter_content, status },
      { new: true, runValidators: true }
    );
    if (!application) return res.status(404).json({ error: 'Application not found' });
    res.json(application);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) return res.status(404).json({ error: 'Application not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, getOne, create, update, remove };
