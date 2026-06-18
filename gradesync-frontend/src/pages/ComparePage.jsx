import { useCallback, useState } from 'react';
import Layout from '../components/layout/Layout';
import WizardSteps from '../components/wizard/WizardSteps';
import Step1Upload from '../components/wizard/Step1Upload';
import Step2Sheet from '../components/wizard/Step2Sheet';
import Step3Analyze from '../components/wizard/Step3Analyze';
import Step7Processing from '../components/wizard/Step7Processing';
import Step8Results from '../components/wizard/Step8Results';

export default function ComparePage() {
  const [step, setStep] = useState(1);
  const [wizardData, setWizardData] = useState({});

  const updateData = useCallback((newData) => {
    setWizardData((prev) => ({ ...prev, ...newData }));
  }, []);

  const nextStep = useCallback(() => setStep((s) => Math.min(s + 1, 5)), []);
  const prevStep = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);

  const reset = useCallback(() => {
    setStep(1);
    setWizardData({});
  }, []);

  // Tự động map dữ liệu thay vì bắt người dùng làm thủ công 3 bước
  const handleAnalyzeNext = () => {
    const suggested = wizardData.analysis?.suggestedMapping;
    
    // Tự động lấy mapping định danh (MSSV, Họ tên, Lớp)
    const identityMapping = {
      mssv: { a: suggested?.suggestedIdentity?.mssv?.a?.colIndex ?? null, b: suggested?.suggestedIdentity?.mssv?.b?.colIndex ?? null },
      hoten: { a: suggested?.suggestedIdentity?.hoten?.a?.colIndex ?? null, b: suggested?.suggestedIdentity?.hoten?.b?.colIndex ?? null },
      lop: { a: suggested?.suggestedIdentity?.lop?.a?.colIndex ?? null, b: suggested?.suggestedIdentity?.lop?.b?.colIndex ?? null },
    };

    // Tự động lấy các cặp cột điểm theo thứ tự ngang; vẫn giữ cột bị trống một bên.
    const scoreMappings = (suggested?.suggestedScores || [])
      .filter(m => m.colIndexA !== null || m.colIndexB !== null);

    // Tự động cấu hình luật so sánh mặc định
    const compareRules = {
      tolerance: 0.001,
      caseInsensitive: true,
      ignoreAccents: false,
    };

    // Validate: Đảm bảo có cột MSSV (bắt buộc)
    if (identityMapping.mssv.a === null || identityMapping.mssv.b === null) {
      alert("Hệ thống không tự động tìm thấy cột MSSV. Vui lòng kiểm tra lại file Excel.");
      return;
    }

    // Lớp không bắt buộc — nếu có sẽ kiểm tra, không có thì bỏ qua cảnh báo lớp

    if (scoreMappings.length === 0) {
      alert("Hệ thống không tìm thấy cột điểm nào để so sánh. Vui lòng kiểm tra lại cấu trúc file.");
      return;
    }

    updateData({ identityMapping, scoreMappings, compareRules });
    nextStep();
  };

  const renderStep = () => {
    const props = { data: wizardData, onNext: nextStep, onBack: prevStep, onData: updateData };
    switch (step) {
      case 1: return <Step1Upload {...props} />;
      case 2: return <Step2Sheet {...props} />;
      case 3: return <Step3Analyze {...props} onNext={handleAnalyzeNext} />;
      case 4: return <Step7Processing {...props} />;
      case 5: return <Step8Results data={wizardData} onReset={reset} />;
      default: return null;
    }
  };

  return (
    <Layout
      title="So sánh bảng điểm"
      subtitle={`Bước ${step}/5 - tự động ghép theo MSSV`}
    >
      <div className="wizard-container">
        <WizardSteps currentStep={step} />
        {renderStep()}
      </div>
    </Layout>
  );
}
