import { Check, ChevronRight, Circle, type LucideIcon } from 'lucide-react';
import type { RunStep } from '../types';

const ICONS: Record<RunStep['status'], LucideIcon> = {
  done: Check,
  active: ChevronRight,
  pending: Circle,
};

export interface StepStatusIconProps {
  status: RunStep['status'];
  size?: number;
  className?: string;
}

export function StepStatusIcon({ status, size = 14, className }: StepStatusIconProps): JSX.Element {
  const Icon = ICONS[status];
  return <Icon size={size} className={className} aria-hidden="true" />;
}
