import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { AppBreadcrumb } from 'components';

interface DeadLetterItem {
  id: number;
  tenantId: string;
  eventType: string;
  targetUrl: string;
  retryCount: number;
  errorMessage: string;
  payload: string;
  failedAt: string;
}

const INITIAL_DEAD_LETTERS: DeadLetterItem[] = [
  {
    id: 1,
    tenantId: 'TENANT_NATCASH',
    eventType: 'TIER_STATUS_UPDATED',
    targetUrl: 'https://gateway.natcash.com/wallet/v1/webhooks/loyalty-tier-update',
    retryCount: 5,
    errorMessage: 'HTTP 504 Gateway Timeout sau 5 lần thử lại',
    payload: JSON.stringify({ userId: '0987654321', tier: 'DIAMOND', multiplier: 2.0 }, null, 2),
    failedAt: '2026-08-23 18:45:10',
  },
  {
    id: 2,
    tenantId: 'TENANT_NATCASH',
    eventType: 'POINT_BALANCE_CHANGED',
    targetUrl: 'https://gateway.natcash.com/wallet/v1/webhooks/point-balance-change',
    retryCount: 5,
    errorMessage: 'Connection Refused 503 Service Unavailable',
    payload: JSON.stringify({ userId: '0987112233', actionType: 'BURN_AT_POS', pointChange: -500 }, null, 2),
    failedAt: '2026-08-23 19:12:05',
  },
];

export const DeadLetterPage: React.FC = () => {
  const { t } = useTranslation();
  const [deadLetters, setDeadLetters] = useState<DeadLetterItem[]>(INITIAL_DEAD_LETTERS);
  const [selectedItem, setSelectedItem] = useState<DeadLetterItem | null>(null);
  const [showPayloadModal, setShowPayloadModal] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRetrigger = (item: DeadLetterItem) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setDeadLetters((prev) => prev.filter((dl) => dl.id !== item.id));
      setIsSubmitting(false);
    }, 600);
  };

  const handleBatchRetrigger = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setDeadLetters([]);
      setShowBatchConfirm(false);
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="p-4 space-y-4">
      <AppBreadcrumb
        items={[
          { label: t('nav.admin') },
          { label: t('nav.dead_letter') },
        ]}
      />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            {t('nav.dead_letter', { defaultValue: 'Lỗi Webhook (Dead-Letter)' })}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('dead_letter.subtitle', { defaultValue: 'Theo dõi và bơm gửi bù các sự kiện Webhook lỗi mạng sau 5 lần thử lại lũy thừa' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            label={t('dead_letter.batch_retrigger', { defaultValue: 'Bơm gửi bù toàn bộ (Batch Re-trigger)' })}
            icon="pi pi-replay"
            severity="danger"
            disabled={deadLetters.length === 0 || isSubmitting}
            onClick={() => setShowBatchConfirm(true)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <DataTable
          value={deadLetters}
          emptyMessage={t('common.no_data', { defaultValue: 'Không có dữ liệu hiển thị' })}
          paginator
          rows={10}
          className="p-datatable-sm"
        >
          <Column
            header="#"
            body={(_data, options) => options.rowIndex + 1}
            style={{ width: '60px', textAlign: 'center' }}
          />
          <Column
            header={t('common.actions', { defaultValue: 'Thao tác' })}
            body={(rowData: DeadLetterItem) => (
              <div className="flex items-center gap-2">
                <Button
                  icon="pi pi-eye"
                  rounded
                  text
                  severity="info"
                  tooltip={t('dead_letter.view_payload', { defaultValue: 'Xem Payload JSON' })}
                  onClick={() => {
                    setSelectedItem(rowData);
                    setShowPayloadModal(true);
                  }}
                />
                <Button
                  icon="pi pi-refresh"
                  rounded
                  text
                  severity="warning"
                  tooltip={t('dead_letter.retrigger_single', { defaultValue: 'Gửi lại sự kiện này' })}
                  loading={isSubmitting}
                  onClick={() => handleRetrigger(rowData)}
                />
              </div>
            )}
            style={{ width: '120px' }}
          />
          <Column field="eventType" header={t('dead_letter.event_type', { defaultValue: 'Tên Sự Kiện' })} style={{ fontWeight: 600 }} />
          <Column field="tenantId" header="Tenant" style={{ width: '150px' }} />
          <Column
            field="retryCount"
            header={t('dead_letter.retry_count', { defaultValue: 'Số lần thử' })}
            body={(row: DeadLetterItem) => (
              <Tag value={`${row.retryCount} / 5`} severity="danger" />
            )}
            style={{ width: '110px', textAlign: 'center' }}
          />
          <Column field="errorMessage" header={t('dead_letter.error_message', { defaultValue: 'Lý do lỗi mạng' })} style={{ color: '#ef4444' }} />
          <Column field="failedAt" header={t('dead_letter.failed_at', { defaultValue: 'Thời điểm thất bại' })} style={{ width: '170px' }} />
        </DataTable>
      </div>

      {/* Modal Xem Payload JSON */}
      <Dialog
        header={t('dead_letter.payload_detail', { id: selectedItem?.id, defaultValue: `Chi tiết Payload sự kiện #${selectedItem?.id}` })}
        visible={showPayloadModal}
        style={{ width: '600px' }}
        onHide={() => setShowPayloadModal(false)}
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Target URL</label>
            <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">{selectedItem?.targetUrl}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Payload JSONB</label>
            <pre className="text-xs font-mono bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto max-h-80">
              {selectedItem?.payload}
            </pre>
          </div>
        </div>
      </Dialog>

      {/* Modal Xác nhận Bơm gửi bù hàng loạt */}
      <Dialog
        header={t('deadletter.batch_confirm_title', { defaultValue: 'Xác nhận Bơm gửi bù Hàng loạt' })}
        visible={showBatchConfirm}
        style={{ width: '480px' }}
        onHide={() => setShowBatchConfirm(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button label={t('common.cancel', { defaultValue: 'Hủy' })} text severity="secondary" onClick={() => setShowBatchConfirm(false)} />
            <Button label={t('deadletter.batch_confirm_btn', { defaultValue: 'Xác nhận Bơm lại' })} severity="danger" icon="pi pi-check" loading={isSubmitting} onClick={handleBatchRetrigger} />
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <i className="pi pi-exclamation-triangle text-3xl text-yellow-500" />
          <div>
            <p className="font-semibold text-gray-800">{t('deadletter.batch_confirm_question', { defaultValue: 'Bạn có chắc chắn muốn phát lại toàn bộ sự kiện Dead-Letter?' })}</p>
            <p className="text-sm text-gray-600 mt-1">
              {t('deadletter.batch_confirm_desc', { count: deadLetters.length, defaultValue: `Toàn bộ ${deadLetters.length} sự kiện sẽ được chuyển về hàng đợi Outbox để tiến trình nền thực hiện gửi lại cho đối tác với chữ ký bảo mật HMAC-SHA256.` })}
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
