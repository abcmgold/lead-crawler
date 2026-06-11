const dbRepo = require('../repositories/db.repository');

async function getTemplates(req, res) {
  try {
    const templates = await dbRepo.getTemplates();
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createTemplate(req, res) {
  try {
    const { name, subject, body } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tên mẫu email không được để trống' });
    }
    const template = {
      id: 'tpl_' + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      subject: (subject || '').trim(),
      body: body || '',
      createdAt: new Date().toISOString()
    };
    await dbRepo.insertTemplate(template);
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateTemplate(req, res) {
  try {
    const { id } = req.params;
    const { name, subject, body } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tên mẫu email không được để trống' });
    }
    const template = {
      name: name.trim(),
      subject: (subject || '').trim(),
      body: body || ''
    };
    await dbRepo.updateTemplate(id, template);
    res.json({ success: true, message: 'Đã cập nhật mẫu email' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteTemplate(req, res) {
  try {
    const { id } = req.params;
    await dbRepo.deleteTemplate(id);
    res.json({ success: true, message: 'Đã xóa mẫu email' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
