/**
 * Templates Page - Manage mapping templates
 */
import { useState, useEffect } from 'react';
import { Trash2, BookTemplate } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { getTemplates, deleteTemplate } from '../services/api';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getTemplates()
      .then((r) => setTemplates(r.templates || []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    getTemplates()
      .then((r) => {
        if (active) setTemplates(r.templates || []);
      })
      .catch(() => {
        if (active) setTemplates([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa template này?')) return;
    await deleteTemplate(id).catch(console.error);
    load();
  };

  return (
    <Layout title="Template Mapping" subtitle="Lưu và tái sử dụng cấu hình mapping cột">
      <div className="alert alert-info" style={{ marginBottom: 24 }}>
        <BookTemplate size={16} />
        Template được lưu trong phiên làm việc hiện tại. Để lưu vĩnh viễn, cần kết nối PostgreSQL (Phase 3).
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title"><BookTemplate size={18} style={{ marginRight: 6 }} />Danh sách Template</div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }} />
            </div>
          ) : templates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>Chưa có template</h3>
              <p>Lưu template trong bước Cấu hình khi thực hiện so sánh</p>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tên Template</th>
                    <th>Headers File A</th>
                    <th>Headers File B</th>
                    <th>Mapping điểm</th>
                    <th>Tạo lúc</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{t.templateName}</td>
                      <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                        {t.mappingJson?.headersA?.slice(0, 3).join(', ')}
                        {t.mappingJson?.headersA?.length > 3 ? '...' : ''}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                        {t.mappingJson?.headersB?.slice(0, 3).join(', ')}
                        {t.mappingJson?.headersB?.length > 3 ? '...' : ''}
                      </td>
                      <td>
                        <span className="badge badge-success">
                          {t.mappingJson?.scoreMappings?.filter(m => m.colIndexA !== null)?.length || 0} cặp
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                        {new Date(t.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>
                          <Trash2 size={13} /> Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
