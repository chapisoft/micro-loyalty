import React from 'react';
import { BreadCrumb as PrimeBreadCrumb, BreadCrumbProps } from 'primereact/breadcrumb';
import { MenuItem } from 'primereact/menuitem';

export interface AppBreadcrumbProps extends Omit<BreadCrumbProps, 'model'> {
  items?: MenuItem[];
  model?: MenuItem[];
  home?: MenuItem;
}

export const AppBreadcrumb: React.FC<AppBreadcrumbProps> = ({ items, model, home, ...props }) => {
  const breadcrumbModel = items || model || [];
  return <PrimeBreadCrumb model={breadcrumbModel} home={home} {...props} />;
};
