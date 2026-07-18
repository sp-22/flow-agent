import { Rocket, ClipboardList, CircleDollarSign, Sparkles, type LucideIcon } from 'lucide-react';
import type { WorkflowIconName } from '../types';

const ICONS: Record<WorkflowIconName, LucideIcon> = {
  rocket: Rocket,
  clipboard: ClipboardList,
  money: CircleDollarSign,
  sparkles: Sparkles,
};

export interface WorkflowIconProps {
  name: WorkflowIconName;
  size?: number;
  className?: string;
}

export function WorkflowIcon({ name, size = 16, className }: WorkflowIconProps): JSX.Element {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon size={size} className={className} aria-hidden="true" />;
}
