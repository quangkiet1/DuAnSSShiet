/**
 * Template Store
 * Persists mapping templates in PostgreSQL and falls back to memory in local dev.
 */
const { initDatabase, query } = require('../config/database');

const templates = new Map();

function toTemplate(row) {
  return {
    id: row.id,
    templateName: row.template_name,
    description: row.description || '',
    mappingJson: row.mapping_json || {},
    rulesJson: row.rules_json || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeTemplate(template) {
  const now = new Date();
  return {
    ...template,
    description: template.description || '',
    mappingJson: template.mappingJson || {},
    rulesJson: template.rulesJson || {},
    createdAt: template.createdAt || now,
    updatedAt: now,
  };
}

function logFallback(operation, err) {
  console.error(`[TemplateStore] PostgreSQL ${operation} failed, using memory fallback:`, err.message);
}

class TemplateStore {
  static async save(template) {
    const normalized = normalizeTemplate(template);
    templates.set(normalized.id, normalized);

    if (await initDatabase()) {
      try {
        const result = await query(
          `
            INSERT INTO comparison_templates (
              id, template_name, description, mapping_json, rules_json, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)
            ON CONFLICT (id) DO UPDATE SET
              template_name = EXCLUDED.template_name,
              description = EXCLUDED.description,
              mapping_json = EXCLUDED.mapping_json,
              rules_json = EXCLUDED.rules_json,
              updated_at = EXCLUDED.updated_at
            RETURNING *
          `,
          [
            normalized.id,
            normalized.templateName,
            normalized.description,
            JSON.stringify(normalized.mappingJson),
            JSON.stringify(normalized.rulesJson),
            normalized.createdAt,
            normalized.updatedAt,
          ]
        );
        const saved = toTemplate(result.rows[0]);
        templates.set(saved.id, saved);
        return saved;
      } catch (err) {
        logFallback('save', err);
      }
    }

    return normalized;
  }

  static async getById(id) {
    if (await initDatabase()) {
      try {
        const result = await query('SELECT * FROM comparison_templates WHERE id = $1', [id]);
        if (result.rows[0]) {
          const template = toTemplate(result.rows[0]);
          templates.set(template.id, template);
          return template;
        }
      } catch (err) {
        logFallback('getById', err);
      }
    }

    return templates.get(id) || null;
  }

  static async list() {
    if (await initDatabase()) {
      try {
        const result = await query('SELECT * FROM comparison_templates ORDER BY created_at DESC');
        const list = result.rows.map(toTemplate);
        list.forEach((template) => templates.set(template.id, template));
        return list;
      } catch (err) {
        logFallback('list', err);
      }
    }

    return [...templates.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async delete(id) {
    const deletedFromMemory = templates.delete(id);

    if (await initDatabase()) {
      try {
        const result = await query('DELETE FROM comparison_templates WHERE id = $1', [id]);
        return result.rowCount > 0 || deletedFromMemory;
      } catch (err) {
        logFallback('delete', err);
      }
    }

    return deletedFromMemory;
  }

  static async findMatching(headersA, headersB) {
    const normalize = (h) => String(h || '').toLowerCase().trim().replace(/\s+/g, '');
    const normA = (headersA || []).map(normalize);
    const normB = (headersB || []).map(normalize);

    let bestMatch = null;
    let bestScore = 0;
    const list = await this.list();

    for (const tmpl of list) {
      const tmplHeadersA = (tmpl.mappingJson?.headersA || []).map(normalize);
      const tmplHeadersB = (tmpl.mappingJson?.headersB || []).map(normalize);

      const overlapA = tmplHeadersA.filter((h) => normA.includes(h)).length;
      const overlapB = tmplHeadersB.filter((h) => normB.includes(h)).length;
      const totalRef = tmplHeadersA.length + tmplHeadersB.length;

      if (totalRef === 0) continue;
      const score = (overlapA + overlapB) / totalRef;

      if (score > bestScore && score > 0.6) {
        bestScore = score;
        bestMatch = { template: tmpl, similarity: Math.round(score * 100) };
      }
    }

    return bestMatch;
  }
}

module.exports = { TemplateStore };
