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

    // Dedup: same company + position applied same calendar day → update existing record
    // instead of inserting a new one (re-running `npm start` for the same job shouldn't
    // create duplicate log entries).
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const companyRegex = new RegExp(`^${company_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const positionRegex = new RegExp(`^${position.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const existing = await Application.findOne({
      company_name: companyRegex,
      position: positionRegex,
      created_at: { $gte: startOfDay }
    });

    let application;
    if (existing) {
      existing.resume_content = resume_content;
      existing.cover_letter_content = cover_letter_content;
      await existing.save();
      application = existing;
    } else {
      application = await Application.create({
        company_name,
        position,
        resume_content,
        cover_letter_content,
        status,
        ...(created_at && { created_at })
      });
    }

    // Defensive cleanup: a stale server process (deployed before this dedup logic
    // existed, or simply not yet restarted) can let same-day duplicates slip in.
    // Clear out any other same company+position+day records so npm start re-runs
    // self-heal instead of accumulating dupes.
    await Application.deleteMany({
      _id: { $ne: application._id },
      company_name: companyRegex,
      position: positionRegex,
      created_at: { $gte: startOfDay }
    });

    res.status(existing ? 200 : 201).json(application);
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
