import React from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface AppBreadcrumbProps {
  items: BreadcrumbItem[];
}

export const AppBreadcrumb: React.FC<AppBreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex align-items-center gap-2 text-sm text-color-secondary mb-2">
      <Link to="/" className="text-color-secondary hover:text-primary no-underline flex align-items-center">
        <i className="pi pi-home" />
      </Link>
      {items.map((item, idx) => (
        <React.Fragment key={`${item.label}-${idx}`}>
          <i className="pi pi-angle-right text-xs" />
          {item.to && idx < items.length - 1 ? (
            <Link to={item.to} className="text-color-secondary hover:text-primary no-underline font-medium">
              {item.label}
            </Link>
          ) : (
            <span className="text-color font-semibold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
