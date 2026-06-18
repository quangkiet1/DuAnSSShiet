/**
 * Wizard Steps Progress Bar Component
 */
const STEPS = [
  { num: 1, label: 'Upload' },
  { num: 2, label: 'Sheet' },
  { num: 3, label: 'Phân tích' },
  { num: 4, label: 'So sánh' },
  { num: 5, label: 'Kết quả' },
];

export default function WizardSteps({ currentStep }) {
  return (
    <div className="wizard-steps">
      {STEPS.map((step, idx) => (
        <div key={step.num} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <div className={`wizard-step ${currentStep === step.num ? 'active' : ''} ${currentStep > step.num ? 'completed' : ''}`}>
            <div className="wizard-step-num">
              {currentStep > step.num ? '✓' : step.num}
            </div>
            <span className="wizard-step-label">{step.label}</span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`wizard-connector ${currentStep > step.num ? 'completed' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
}
