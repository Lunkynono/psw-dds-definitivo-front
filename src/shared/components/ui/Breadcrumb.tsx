import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

type BreadcrumbItem = {
  label: string;
  to?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm mb-6">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight size={13} className="text-gray-300" />}
            {isLast || !item.to ? (
              <span className={isLast ? 'text-gray-800 font-medium' : 'text-gray-400'}>
                {item.label}
              </span>
            ) : (
              <Link to={item.to} className="text-gray-400 hover:text-indigo-600 transition-colors">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
