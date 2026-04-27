import { PropsWithChildren } from 'react';

const colors = {
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700'
};

type BadgeProps = PropsWithChildren<{
  color?: keyof typeof colors;
}>;

export function Badge({ children, color = 'gray' }: BadgeProps) {
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>{children}</span>;
}
