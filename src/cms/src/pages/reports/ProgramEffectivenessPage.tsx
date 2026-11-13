import React, { useCallback, useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { LoyaltyService, ProgramEffectivenessModel } from '@/service/loyalty.service';

export const ProgramEffectivenessPage: React.FC = () => {
  const { t } = useTranslation();

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [rows, setRows] = useState<ProgramEffectivenessModel[]>([]);
  const [loading, setLoading] = useState(false);

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

  const avgLift = rows.length > 0 ? rows.reduce((s, r) => s + Number(r.incrementalLiftPercent || 0), 0) / rows.length : 0;
  const totalRevenue = rows.reduce((s, r) => s + Number(r.treatmentGroupRevenue || 0), 0);
  const totalCost = rows.reduce((s, r) => s + Number(r.rewardCost || 0), 0);

  return (
    <div>
      <AppBreadcrumb items={[{ label: t('nav.effectiveness', { defaultValue: 'Hiệu quả Chương trình (NS-03)' }) }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h4 className="m-0 text-primary font-semibold">
              {t('report.effectiveness_title', { defaultValue: 'Đo lường Hiệu quả & Tăng trưởng Lift so với Nhóm Đối chứng (NS-03)' })}
            </h4>
            <p className="m-0 text-xs text-500 mt-1">
              {t('report.effectiveness_subtitle', { defaultValue: 'So sánh trực tiếp Nhóm Tác động (Treatment) và Nhóm Đối chứng (Control Group) cùng ROI.' })}
            </p>
          </div>
          <div className="flex gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchReport} loading={loading} />
          </div>
        </div>

        <div className="grid mb-4">
          <div className="col-12 md:col-4">
            <div className="p-3 border-round surface-50 border-1 surface-border">
              <div className="text-xs text-500 uppercase">{t('report.avg_lift', { defaultValue: 'Mức tăng trưởng trung bình (Lift)' })}</div>
              <div className="text-2xl font-mono font-semibold text-green-600 mt-1">+{avgLift.toFixed(2)}%</div>
            </div>
          </div>
          <div className="col-12 md:col-4">
            <div className="p-3 border-round surface-50 border-1 surface-border">
              <div className="text-xs text-500 uppercase">{t('report.treatment_revenue', { defaultValue: 'Doanh thu Nhóm Tác động' })}</div>
              <div className="text-2xl font-mono font-semibold text-primary mt-1">{totalRevenue.toLocaleString()} HTG</div>
            </div>
          </div>
          <div className="col-12 md:col-4">
            <div className="p-3 border-round surface-50 border-1 surface-border">
              <div className="text-xs text-500 uppercase">{t('report.reward_cost', { defaultValue: 'Chi phí Trả thưởng' })}</div>
              <div className="text-2xl font-mono font-semibold text-orange-600 mt-1">{totalCost.toLocaleString()} HTG</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-column gap-2"><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /></div>
        ) : (
          <DataTable<ProgramEffectivenessModel> value={rows} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('report.no_effectiveness', { defaultValue: 'Chưa có dữ liệu so sánh Lift vs Control Group.' })}>
            <Column field="campaignCode" header={t('campaign.code', { defaultValue: 'Mã Chiến Dịch' })} body={(r) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.campaignCode}</span>} style={{ minWidth: '11rem' }} />
            <Column field="campaignName" header={t('campaign.name', { defaultValue: 'Tên Chiến Dịch' })} style={{ minWidth: '14rem' }} />
            <Column field="treatmentGroupSize" header="Treatment N" body={(r) => Number(r.treatmentGroupSize || 0).toLocaleString()} style={{ minWidth: '8rem', textAlign: 'right' }} />
            <Column field="controlGroupSize" header="Control N" body={(r) => Number(r.controlGroupSize || 0).toLocaleString()} style={{ minWidth: '8rem', textAlign: 'right' }} />
            <Column field="treatmentGroupRevenue" header="Treatment Rev." body={(r) => <span className="font-mono">{Number(r.treatmentGroupRevenue || 0).toLocaleString()} HTG</span>} style={{ minWidth: '10rem', textAlign: 'right' }} />
            <Column field="controlGroupRevenue" header="Control Rev." body={(r) => <span className="font-mono">{Number(r.controlGroupRevenue || 0).toLocaleString()} HTG</span>} style={{ minWidth: '10rem', textAlign: 'right' }} />
            <Column field="incrementalLiftPercent" header="Incremental Lift" body={(r) => <Tag value={`${Number(r.incrementalLiftPercent || 0) >= 0 ? '+' : ''}${Number(r.incrementalLiftPercent || 0).toFixed(2)}%`} severity={Number(r.incrementalLiftPercent || 0) > 0 ? 'success' : 'warning'} />} style={{ minWidth: '9rem', textAlign: 'center' }} />
            <Column field="roiRatio" header="ROI" body={(r) => <span className="font-mono font-medium">{Number(r.roiRatio || 0).toFixed(2)}x</span>} style={{ minWidth: '6.5rem', textAlign: 'right' }} />
          </DataTable>
        )}
      </div>
    </div>
  );
};

export default ProgramEffectivenessPage;
