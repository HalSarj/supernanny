import React from 'react';
import * as LucideIcons from 'lucide-react';

export type IconName = keyof typeof LucideIcons;

interface IconProps {
  name: IconName;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

/**
 * Icon component that renders Lucide icons
 * @param name - The name of the icon from Lucide icons
 * @param size - The size of the icon (default: 24)
 * @param color - The color of the icon (default: currentColor)
 * @param strokeWidth - The stroke width of the icon (default: 2)
 * @param className - Additional CSS classes
 */
export const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 24, 
  color = 'currentColor', 
  strokeWidth = 2,
  className = '',
}) => {
  const LucideIcon = LucideIcons[name];

  if (!LucideIcon) {
    console.error(`Icon "${name}" not found in Lucide icons`);
    return null;
  }

  return (
    <LucideIcon
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
    />
  );
};

export default Icon;
