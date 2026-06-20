import { useCallback, useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import WizardSteps from '../components/wizard/WizardSteps';
import Step1Upload from '../components/wizard/Step1Upload';
import Step2Sheet from '../components/wizard/Step2Sheet';
import Step3Analyze from '../components/wizard/Step3Analyze';
import Step7Processing from '../components/wizard/Step7Processing';
import Step8Results from '../components/wizard/Step8Results';
import RulesPanel from '../components/wizard/RulesPanel';

/**
 * ComparePage - Wizard controller
 *
 * wizardData shape:
 * {
 *   uploadId: string,
 *   fileAInfo: { name, size, sheets },
 *   fileBInfo: { name, size, sheets },
 *   sheetA: string,
 *   sheetB: string,
 *   analysis: { fileA, fileB, suggestedMapping, matchedTemplate },
 *   compareRules: { tolerance, caseInsensitive, ignoreAccents, ignoreRounding },
 *   identityMapping: { mssv, hoten, lop },
 *   scoreMappings: [...],
 *   jobId: string,
 *   result: object (summary),
 * }
 */
export default function ComparePage() {
  const [step, setStep] = useState(1);
  const [wizardData, setWizardData] = useState({});

  // Merge partial updates vào wizardData
  const updateData = useCallback((newData) => {
    setWizardData((prev) => ({ ...prev, ...newData }));
  }, []);

  const goNext = useCallback(() => setStep((s) => Math.min(s + 1, 5)), []);
  const goBack = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);

  const reset = useCallback(() => {
    setStep(1);
    setWizardData({});
  }, []);

  // Nếu bị HMR (Hot Module Replacement) hoặc reload trang làm mất state,
  // tự động quay lại bước 1 để tránh lỗi "Upload session không tồn tại"
  useEffect(() => {
    if (step > 1 && !wizardData.uploadId) {
      setStep(1);
    }
  }, [step, wizardData.uploadId]);

  // ── Step 1: Upload xong → lưu uploadId + fileInfo rồi sang bước 2 ──────────
  const handleStep1Next = () => {
    // wizardData đã có uploadId, fileAInfo, fileBInfo (được set bởi Step1Upload qua onData)
    goNext();
  };

  // ── Step 2: Chọn sheet xong → lưu sheetA/sheetB rồi sang bước 3 ───────────
  const handleStep2Next = () => {
    // wizardData đã có sheetA, sheetB (được set bởi Step2Sheet qua onData)
    goNext();
  };

  // ── Step 3: Phân tích xong, RulesPanel đã set compareRules → sang bước 4 ──
  const handleStep3Next = () => {
    const suggested = wizardData.analysis?.suggestedMapping;

    // Tự động build identity mapping từ kết quả analyze
    const identityMapping = {
      mssv:  {
        a: suggested?.suggestedIdentity?.mssv?.a?.colIndex  ?? null,
        b: suggested?.suggestedIdentity?.mssv?.b?.colIndex  ?? null,
      },
      hoten: {
        a: suggested?.suggestedIdentity?.hoten?.a?.colIndex ?? null,
        b: suggested?.suggestedIdentity?.hoten?.b?.colIndex ?? null,
      },
      lop:   {
        a: suggested?.suggestedIdentity?.lop?.a?.colIndex   ?? null,
        b: suggested?.suggestedIdentity?.lop?.b?.colIndex   ?? null,
      },
    };

    // Tự động build score mappings
    const scoreMappings = (suggested?.suggestedScores || [])
      .filter((m) => m.colIndexA !== null && m.colIndexA !== undefined
                   && m.colIndexB !== null && m.colIndexB !== undefined);

    // Validation bắt buộc
    if (identityMapping.mssv.a === null || identityMapping.mssv.b === null) {
      alert('⚠️ Hệ thống không tự tìm thấy cột MSSV.\n\nVui lòng kiểm tra lại tên cột trong file Excel.\nCột MSSV thường có tên như: "Mã SV", "MSSV", "Mã sinh viên", "StudentID"...');
      return;
    }

    if (scoreMappings.length === 0) {
      alert('⚠️ Hệ thống không tìm thấy cột điểm nào để so sánh.\n\nVui lòng kiểm tra lại cấu trúc file Excel.\nCột điểm thường chứa giá trị số từ 0–10 hoặc 0–100.');
      return;
    }

    // Merge compareRules vào wizardData (dùng mặc định nếu chưa có)
    const compareRules = wizardData.compareRules || {
      tolerance:       0.001,
      caseInsensitive: true,
      ignoreAccents:   false,
      ignoreRounding:  false,
    };

    updateData({ identityMapping, scoreMappings, compareRules });
    goNext();
  };

  // ── Step 4: Processing xong → sang bước 5 (result) ────────────────────────
  const handleStep4Next = () => {
    goNext();
  };

  // ── Render theo step hiện tại ──────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // ── BƯỚC 1: Upload ─────────────────────────────────────────────────────
      case 1:
        return (
          <Step1Upload
            data={wizardData}
            onNext={handleStep1Next}
            onBack={goBack}
            onData={updateData}
          />
        );

      // ── BƯỚC 2: Chọn sheet ─────────────────────────────────────────────────
      case 2:
        return (
          <Step2Sheet
            data={wizardData}
            onNext={handleStep2Next}
            onBack={goBack}
            onData={updateData}
          />
        );

      // ── BƯỚC 3: Phân tích + Tùy chỉnh luật ────────────────────────────────
      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* RulesPanel luôn hiển thị phía trên — collapsed mặc định */}
            <RulesPanel
              rules={wizardData.compareRules}
              onRulesChange={(r) => updateData({ compareRules: r })}
            />
            {/* Step3Analyze: tự gọi /analyze ngay khi mount — uploadId phải tồn tại ở bước này */}
            <Step3Analyze
              data={wizardData}
              onNext={handleStep3Next}
              onBack={goBack}
              onData={updateData}
            />
          </div>
        );

      // ── BƯỚC 4: Đang xử lý (Worker Thread) ────────────────────────────────
      case 4:
        return (
          <Step7Processing
            data={wizardData}
            onNext={handleStep4Next}
            onBack={goBack}
            onData={updateData}
          />
        );

      // ── BƯỚC 5: Kết quả ────────────────────────────────────────────────────
      case 5:
        return (
          <Step8Results
            data={wizardData}
            onReset={reset}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Layout
      title="So sánh bảng điểm"
      subtitle={`Bước ${step}/5 — tự động ghép theo MSSV`}
    >
      <div className="wizard-container">
        <WizardSteps currentStep={step} />
        {renderStep()}
      </div>
    </Layout>
  );
}
