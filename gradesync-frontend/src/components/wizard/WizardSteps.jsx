/**
 * Wizard Steps Progress Bar with GSAP animation
 */
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const STEPS = [
  { num: 1, label: 'Upload' },
  { num: 2, label: 'Sheet' },
  { num: 3, label: 'Phân tích' },
  { num: 4, label: 'So sánh' },
  { num: 5, label: 'Kết quả' },
];

export default function WizardSteps({ currentStep }) {
  const ref = useRef(null);
  const prevStep = useRef(currentStep);

  useEffect(() => {
    if (!ref.current) return;

    // Animate active step badge when step changes
    if (prevStep.current !== currentStep) {
      const activeEl = ref.current.querySelector('.wizard-step.active .wizard-step-num');
      if (activeEl) {
        gsap.fromTo(activeEl,
          { scale: 0.7, rotate: -10 },
          { scale: 1, rotate: 0, duration: 0.35, ease: 'back.out(2)' }
        );
      }
      prevStep.current = currentStep;
    }
  }, [currentStep]);

  useEffect(() => {
    if (!ref.current) return;
    // Initial entrance animation
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current.querySelectorAll('.wizard-step'),
        { opacity: 0, scale: 0.85 },
        { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out', stagger: 0.06 }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div className="wizard-steps" ref={ref}>
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
