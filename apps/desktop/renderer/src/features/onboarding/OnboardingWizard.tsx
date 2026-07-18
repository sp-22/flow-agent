import * as React from 'react';
import { Button } from '../../components/Button';
import { useOnboarding } from '../../store/onboarding.store';
import { StepWelcome } from './steps/StepWelcome';
import { StepAdapter } from './steps/StepAdapter';
import { StepProxyCert } from './steps/StepProxyCert';
import { StepFirstRecord, type OnboardingExit } from './steps/StepFirstRecord';

const STEP_LABELS = ['Welcome', 'Adapter', 'Proxy', 'Record'] as const;

export interface OnboardingWizardProps {
  onDone(dest: OnboardingExit): void;
}

export function OnboardingWizard({ onDone }: OnboardingWizardProps): JSX.Element {
  const { adapterReady, certTrusted } = useOnboarding();
  const [step, setStep] = React.useState(0);

  const gatePassed = step === 1 ? adapterReady : step === 2 ? certTrusted : true;

  const goNext = React.useCallback(() => {
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  }, []);

  const goBack = React.useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const showNav = step > 0 && step < STEP_LABELS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 p-6 backdrop-blur-sm"
      data-testid="onboarding-overlay"
    >
      <div className="flex w-full max-w-lg flex-col gap-6 rounded-lg border border-wire bg-surface p-8">
        <div className="flex items-center justify-center gap-4" role="list" aria-label="Onboarding progress">
          {STEP_LABELS.map((label, i) => (
            <div key={label} role="listitem" className="flex items-center gap-2">
              <span
                aria-current={i === step ? 'step' : undefined}
                className={
                  'h-2 w-2 rounded-full transition-colors duration-150 ease-[var(--ease)] ' +
                  (i <= step ? 'bg-high' : 'bg-elevated')
                }
              />
              <span className={'text-xs ' + (i === step ? 'text-heading' : 'text-muted')}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex-1">
          {step === 0 ? <StepWelcome onNext={goNext} /> : null}
          {step === 1 ? <StepAdapter /> : null}
          {step === 2 ? <StepProxyCert /> : null}
          {step === 3 ? <StepFirstRecord onDone={onDone} /> : null}
        </div>

        {showNav ? (
          <div className="flex items-center justify-between gap-3 border-t border-wire pt-4">
            <Button variant="ghost" onClick={goBack}>
              Back
            </Button>
            <Button variant="primary" onClick={goNext} disabled={!gatePassed}>
              Continue
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
