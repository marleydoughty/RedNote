import { useState, useEffect } from 'react';

type TourStep = {
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
};

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to RedNote! 👋',
    description:
      "This is a demo account with sample data. Let's take a quick tour of the features.",
  },
  {
    title: 'Prediction Banner',
    description:
      'See your next predicted cycle and current phase. Click the phase badge to learn about cycle phases!',
    target: '.prediction-banner',
    position: 'bottom',
  },
  {
    title: 'Calendar View',
    description:
      'Pink days are logged period days. Click any date to log or edit entries.',
    target: '.calendar-wrapper',
    position: 'top',
  },
  {
    title: 'Legend',
    description:
      'The legend shows what different colors mean - period days, predictions, and ovulation windows.',
    target: '.legend',
    position: 'top',
  },
  {
    title: 'Settings',
    description: 'Access your account settings, FAQs, and sign out from here.',
    target: '.settings-btn',
    position: 'bottom',
  },
  {
    title: "You're all set!",
    description:
      "Feel free to explore. Create your own account when you're ready to start tracking!",
  },
];

type Props = {
  onComplete: () => void;
};

export default function DemoTour({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  useEffect(() => {
    if (!step.target) {
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(step.target!);
      if (!element) return;

      const rect = element.getBoundingClientRect();

      // Update highlight position
      const highlight = document.querySelector(
        '.tour-highlight'
      ) as HTMLElement;
      if (highlight) {
        highlight.style.top = `${rect.top - 8}px`;
        highlight.style.left = `${rect.left - 8}px`;
        highlight.style.width = `${rect.width + 16}px`;
        highlight.style.height = `${rect.height + 16}px`;
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep, step.target]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="tour-backdrop" onClick={handleSkip} />

      {/* Highlight target element */}
      {step.target && (
        <div className="tour-highlight" data-target={step.target} />
      )}

      {/* Tooltip - Fixed at lower middle */}
      <div
        className="tour-tooltip"
        style={{
          position: 'fixed',
          bottom: '25%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10001,
        }}>
        <div className="tour-content">
          <h3 className="tour-title">{step.title}</h3>
          <p className="tour-description">{step.description}</p>

          <div className="tour-actions">
            <button className="tour-skip" onClick={handleSkip}>
              Skip tour
            </button>
            <div className="tour-progress">
              {currentStep + 1} / {TOUR_STEPS.length}
            </div>
            <button className="tour-next" onClick={handleNext}>
              {isLastStep ? 'Got it!' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
