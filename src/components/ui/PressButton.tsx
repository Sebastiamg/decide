import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface PressButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: 'primary' | 'plain' | 'dark';
  size?: 'lg' | 'md' | 'sm';
  icon?: IconName;
  iconRight?: IconName;
}

const sizes = {
  lg: 'min-h-14 px-7 text-lg',
  md: 'min-h-12 px-5 text-base',
  sm: 'min-h-11 px-4 text-sm',
} as const;

const variants = {
  primary: 'bg-volt text-ink',
  plain: 'bg-card text-ink',
  dark: 'bg-ink text-white',
} as const;

/** Botón con presión física (borde de tinta y sombra que se hunde al pulsar). */
export function PressButton({
  children,
  variant = 'plain',
  size = 'md',
  icon,
  iconRight,
  className = '',
  type = 'button',
  ...props
}: PressButtonProps) {
  return (
    <button
      type={type}
      className={`pressable inline-flex items-center justify-center gap-2 font-display font-extrabold tracking-wide uppercase disabled:opacity-40 ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 22 : 18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'lg' ? 22 : 18} />}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  label: string;
}

/** Botón redondo de 44 px con texto accesible. */
export function IconButton({ icon, label, className = '', type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`pressable grid size-11 shrink-0 place-items-center rounded-full ${className}`}
      {...props}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}
