import React from 'react';
import { BreadCrumb } from 'primereact/breadcrumb';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

import { paths } from '@/paths';

const pathToLabelMap: { [key: string]: string } = {
  dashboard: 'nav.dashboard',
  partners: 'nav.partners',
  customers: 'nav.customers',
  transactions: 'nav.transactions',
  'system-parameters': 'nav.system_parameters',
  admin: 'nav.admin',
  users: 'user.management',
  roles: 'role.management',
  'audit-logs': 'nav.audit_logs',
  profile: 'profile.title',
  'change-profile': 'profile.change_profile',
  'change-password': 'profile.change_password',
};

const Breadcrumb: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const home = { icon: 'pi pi-home text-primary', command: () => navigate(paths.dashboard) };

  const exactValidPaths = Object.values(paths).filter((p) => !p.includes(':'));

  const breadcrumbItems = location.pathname
    .split('/')
    .filter(Boolean)
    .map((path, index, array) => {
      const fullPath = `/${array.slice(0, index + 1).join('/')}`;
      const translationKey = pathToLabelMap[path] || path;
      const isClickable = exactValidPaths.includes(fullPath as any) && index !== array.length - 1;

      return {
        label: t(translationKey, { defaultValue: path }),
        command: isClickable ? () => navigate(fullPath) : undefined,
      };
    });

  if (location.pathname === paths.dashboard || location.pathname === '/') {
    return null;
  }

  return (
    <div className="px-3 md:px-4 pt-3 pb-1" style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      <BreadCrumb
        model={breadcrumbItems}
        home={home}
        className="border-none bg-transparent p-0 text-sm font-medium text-600"
      />
    </div>
  );
};

export default Breadcrumb;
