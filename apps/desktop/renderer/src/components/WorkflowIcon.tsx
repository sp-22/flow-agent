import { Rocket, ClipboardList, CircleDollarSign, Sparkles, type LucideIcon } from 'lucide-react';
import type { WorkflowIconName } from '../types';

const ICONS: Record<WorkflowIconName, LucideIcon> = {
  rocket: Rocket,
  clipboard: ClipboardList,
  money: CircleDollarSign,
  sparkles: Sparkles,
};

const ICON_COLOR: Record<WorkflowIconName, string> = {
  rocket: 'text-hold',
  clipboard: 'text-[#4C8BF5]',
  money: 'text-go',
  sparkles: 'text-[#A78BFA]',
};

export interface WorkflowIconProps {
  name: WorkflowIconName;
  size?: number;
  className?: string;
}

export function WorkflowIcon({ name, size = 16, className }: WorkflowIconProps): JSX.Element {
  const Icon = ICONS[name] ?? Sparkles;
  const color = ICON_COLOR[name] ?? ICON_COLOR.sparkles;
  const merged = [color, className].filter(Boolean).join(' ');
  return <Icon size={size} className={merged} aria-hidden="true" />;
}
