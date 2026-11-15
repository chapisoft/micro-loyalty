import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { LoyaltyService, ProgramEffectivenessModel } from '@/service/loyalty.service';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { exportToExcel } from '@/components/exportHelper';

export const ProgramEffectivenessPage: React.FC = () => {
  const { t } = useTranslation();

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [rows, setRows] = useState<ProgramEffectivenessModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await LoyaltyService.getProgramEffectiveness(undefined, selectedTenant);
      setRows(Array.isArray(res) ? res : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const filteredRows = useMemo(() => {
    if (!keyword.trim()) return rows;
    const kw = keyword.toLowerCase();
    return rows.filter(
      (r) =>
        r.campaignCode?.toLowerCase().includes(kw) ||
        r.campaignName?.toLowerCase().includes(kw)
    );
  }, [rows, keyword]);

  const avgLift =
    rows.length > 0
      ? rows.reduce((s, r) => s + Number(r.liftPercent || 0), 0) / rows.length
      : 0;
  const totalRevenue = rows.reduce(
    (s, r) => s + Number(r.incrementalRevenue || 0),
    0
  );
  const avgRoi =
    rows.length > 0
      ? rows.reduce((s, r) => s + Number(r.roiPercent || 0), 0) / rows.length
      : 0;

  const handleExport = () => {
    exportToExcel(
      filteredRows,
      [
        { header: t('campaign.code'), field: 'campaignCode' },
        { header: t('campaign.name'), field: 'campaignName' },
        { header: t('report.test_group_size'), field: 'testGroupSize' },
        { header: t('report.control_group_size'), field: 'controlGroupSize' },
        { header: t('report.test_conv_rate'), field: 'testConversionRate' },
        { header: t('report.control_conv_rate'), field: 'controlConversionRate' },
        { header: t('report.incremental_rev'), field: 'incrementalRevenue' },
        { header: t('report.lift_percent'), field: 'liftPercent' },
        { header: t('report.roi_percent'), field: 'roiPercent' },
      ],
      'hieu_qua_chuong_trinh'
    );
  };

  return (
    <div className="w-full">
      <AppBreadcrumb items={[{ label: t('nav.effectiveness') }]} />

      <StandardPageHeader
        title={t('report.effectiveness_title')}
        subtitle={t('report.effectiveness_subtitle')}
        extraLeft={<TenantSelector value={selectedTenant} onChange={setSelectedTenant} />}
        onRefresh={fetchReport}
        refreshLoading={loading}
      />

      <div className="card shadow-1 border-round surface-card p-4">
        {/* KPI Summary Cards */}
        <div className="grid mb-4">
          <div className="col-12 md:col-4">
            <div className="p-3 border-round surface-50 border-1 surface-border">
              <div className="text-xs text-500 uppercase">{t('report.avg_lift')}</div>
              <div className="text-2xl font-mono font-semibold text-green-600 mt-1">
                +{avgLift.toFixed(2)}%
              </div>
            </div>
          </div>
          <div className="col-12 md:col-4">
            <div className="p-3 border-round surface-50 border-1 surface-border">
              <div className="text-xs text-500 uppercase">{t('report.treatment_revenue')}</div>
              <div className="text-2xl font-mono font-semibold text-primary mt-1">
                {totalRevenue.toLocaleString()} HTG
              </div>
            </div>
          </div>
          <div className="col-12 md:col-4">
            <div className="p-3 border-round surface-50 border-1 surface-border">
              <div className="text-xs text-500 uppercase">{t('report.avg_roi')}</div>
              <div className="text-2xl font-mono font-semibold text-orange-600 mt-1">
                {avgRoi.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        <UniversalFilterBar
          keyword={keyword}
          onKeywordChange={setKeyword}
          searchPlaceholder={t('common.search')}
          onReset={() => setKeyword('')}
          onExport={handleExport}
        />

        {loading ? (
          <div className="flex flex-column gap-2 mt-3">
            <Skeleton height="2.75rem" />
            <Skeleton height="2.75rem" />
          </div>
        ) : (
          <DataTable<ProgramEffectivenessModel[]>
            value={filteredRows}
            paginator
            rows={10}
            stripedRows
            responsiveLayout="scroll"
            emptyMessage={t('report.no_effectiveness')}
            className="mt-3"
          >
            <Column
              field="campaignCode"
              header={t('campaign.code')}
              body={(r: ProgramEffectivenessModel) => (
                <span className="font-bold font-mono text-900">{r.campaignCode}</span>
              )}
              style={{ minWidth: '11rem' }}
            />
            <Column
              field="campaignName"
              header={t('campaign.name')}
              body={(r: ProgramEffectivenessModel) => (
                <span className="text-900">{r.campaignName}</span>
              )}
              style={{ minWidth: '14rem' }}
            />
            <Column
              field="testGroupSize"
              header={t('report.test_group_size')}
              body={(r: ProgramEffectivenessModel) => (
                <span className="text-900 font-mono">
                  {Number(r.testGroupSize || 0).toLocaleString()}
                </span>
              )}
              style={{ minWidth: '8rem', textAlign: 'right' }}
            />
            <Column
              field="controlGroupSize"
              header={t('report.control_group_size')}
              body={(r: ProgramEffectivenessModel) => (
                <span className="text-900 font-mono">
                  {Number(r.controlGroupSize || 0).toLocaleString()}
                </span>
              )}
              style={{ minWidth: '8rem', textAlign: 'right' }}
            />
            <Column
              field="testConversionRate"
              header={t('report.test_conv_rate')}
              body={(r: ProgramEffectivenessModel) => (
                <span className="text-900 font-mono">
                  {Number(r.testConversionRate || 0).toFixed(2)}%
                </span>
              )}
              style={{ minWidth: '8rem', textAlign: 'right' }}
            />
            <Column
              field="controlConversionRate"
              header={t('report.control_conv_rate')}
              body={(r: ProgramEffectivenessModel) => (
                <span className="text-900 font-mono">
                  {Number(r.controlConversionRate || 0).toFixed(2)}%
                </span>
              )}
              style={{ minWidth: '8rem', textAlign: 'right' }}
            />
            <Column
              field="incrementalRevenue"
              header={t('report.incremental_rev')}
              body={(r: ProgramEffectivenessModel) => (
                <span className="text-900 font-mono">
                  {Number(r.incrementalRevenue || 0).toLocaleString()} HTG
                </span>
              )}
              style={{ minWidth: '10rem', textAlign: 'right' }}
            />
            <Column
              field="liftPercent"
              header={t('report.lift_percent')}
              body={(r: ProgramEffectivenessModel) => (
                <Tag
                  value={`${Number(r.liftPercent || 0) >= 0 ? '+' : ''}${Number(r.liftPercent || 0).toFixed(2)}%`}
                  severity={Number(r.liftPercent || 0) > 0 ? 'success' : 'warning'}
                />
              )}
              style={{ minWidth: '9rem', textAlign: 'center' }}
            />
            <Column
              field="roiPercent"
              header={t('report.roi_percent')}
              body={(r: ProgramEffectivenessModel) => (
                <span className="text-900 font-mono font-medium">
                  {Number(r.roiPercent || 0).toFixed(1)}%
                </span>
              )}
              style={{ minWidth: '7rem', textAlign: 'right' }}
            />
          </DataTable>
        )}
      </div>
    </div>
  );
};

export default ProgramEffectivenessPage;
