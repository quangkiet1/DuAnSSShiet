/**
 * Template Controller
 */
const { v4: uuidv4 } = require('uuid');
const { TemplateStore } = require('../utils/templateStore');
const { createError } = require('../middlewares/error.middleware');

async function listTemplates(req, res) {
  const list = await TemplateStore.list();
  res.json({ success: true, templates: list });
}

async function createTemplate(req, res) {
  const { templateName, description, headersA, headersB, identityMapping, scoreMappings, rules } = req.body;
  if (!templateName) throw createError('Tên template là bắt buộc', 'VALIDATION_ERROR');

  const tmpl = {
    id: uuidv4(),
    templateName,
    description: description || '',
    mappingJson: { headersA: headersA || [], headersB: headersB || [], identityMapping, scoreMappings },
    rulesJson: rules || {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const saved = await TemplateStore.save(tmpl);
  res.json({ success: true, template: saved });
}

async function getTemplate(req, res) {
  const tmpl = await TemplateStore.getById(req.params.id);
  if (!tmpl) throw createError('Template không tồn tại', 'NOT_FOUND');
  res.json({ success: true, template: tmpl });
}

async function deleteTemplate(req, res) {
  const deleted = await TemplateStore.delete(req.params.id);
  res.json({ success: true, deleted });
}

module.exports = { listTemplates, createTemplate, getTemplate, deleteTemplate };
