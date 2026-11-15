import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { useTranslation } from 'react-i18next';

export interface UniversalFilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  keyword?: string;
  onKeywordChange?: (value: string) => void;
  searchPlaceholder?: string;
  primaryFilters?: React.ReactNode;
  advancedFilters?: React.ReactNode;
  activeAdvancedCount?: number;
  onReset?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  exportLabel?: string;
  isLoading?: boolean;
  extraActions?: React.ReactNode;
  className?: string;
}

export const UniversalFilterBar: React.FC<UniversalFilterBarProps> = ({
  searchValue,
  onSearchChange,
  keyword,
  onKeywordChange,
  searchPlaceholder,
  primaryFilters,
  advancedFilters,
  activeAdvancedCount = 0,
  onReset,
  onRefresh,
  onExport,
  exportLabel,
  isLoading = false,
  extraActions,
  className = '',
}) => {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentSearch = keyword !== undefined ? keyword : searchValue;
  const handleSearchChange = onKeywordChange || onSearchChange;

  const hasAdvanced = Boolean(advancedFilters);

  return (
    <div className={`universal-filter-bar flex flex-column gap-2 mb-3 ${className}`}>
      <div className="flex flex-wrap align-items-center justify-content-between gap-2 w-full">
        {/* Left side: Search + Primary filters + Advanced toggle + Reset + Refresh */}
        <div className="flex flex-wrap align-items-center gap-2 flex-1">
          {handleSearchChange !== undefined && (
            <span className="p-input-icon-left" style={{ minWidth: '14rem', maxWidth: '20rem' }}>
              <i className="pi pi-search text-400" />
              <InputText
                value={currentSearch || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={searchPlaceholder || t('common.search')}
                className="p-inputtext-sm w-full"
              />
            </span>
          )}

          {primaryFilters}

          {hasAdvanced && (
            <Button
              type="button"
              icon="pi pi-filter"
              label={t('common.advanced_filter', 'Lọc nâng cao')}
              badge={activeAdvancedCount > 0 ? String(activeAdvancedCount) : undefined}
              badgeClassName="p-badge-warning"
              outlined={!showAdvanced}
              size="small"
              onClick={() => setShowAdvanced(!showAdvanced)}
              tooltip={t('common.advanced_filter_tooltip', 'Ẩn/hiện bộ lọc nâng cao')}
              tooltipOptions={{ position: 'top' }}
              className="p-button-sm font-medium"
            />
          )}

          {onReset && (
            <Button
              type="button"
              icon="pi pi-refresh"
              label={t('common.reset', 'Đặt lại')}
              outlined
              severity="secondary"
              size="small"
              onClick={onReset}
              className="p-button-sm font-medium"
            />
          )}

          {onRefresh && (
            <Button
              type="button"
              icon="pi pi-sync"
              outlined
              severity="secondary"
              size="small"
              loading={isLoading}
              onClick={onRefresh}
              tooltip={t('common.refresh', 'Làm mới')}
              tooltipOptions={{ position: 'top' }}
              className="p-button-sm"
            />
          )}
        </div>

        {/* Right side: Export/Import/Add New buttons */}
        <div className="flex align-items-center gap-2 ml-auto">
          {onExport && (
            <Button
              type="button"
              icon="pi pi-download"
              label={exportLabel || t('common.export_excel', 'Xuất Excel')}
              outlined
              size="small"
              onClick={onExport}
              className="p-button-sm font-medium"
            />
          )}

          {extraActions}
        </div>
      </div>

      {/* Collapsible Advanced Filters Panel */}
      {hasAdvanced && showAdvanced && (
        <div className="surface-50 border-round p-3 border-1 surface-border flex flex-wrap align-items-center gap-3 w-full transition-all transition-duration-200">
          <div className="flex align-items-center gap-2 text-xs font-semibold text-500 uppercase tracking-wider mb-1 w-full">
            <i className="pi pi-sliders-h text-primary text-xs" />
            <span>{t('common.advanced_filters_title', 'Điều kiện lọc nâng cao')}</span>
          </div>
          <div className="flex flex-wrap align-items-center gap-3 w-full">
            {advancedFilters}
          </div>
        </div>
      )}
    </div>
  );
};
