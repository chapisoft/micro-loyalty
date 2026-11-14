import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { AppBreadcrumb } from 'components';
import { apiClient } from '@/service/config';

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

export const DeadLetterPage: React.FC = () => {
  const { t } = useTranslation();
  const [deadLetters, setDeadLetters] = useState<DeadLetterItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<DeadLetterItem | null>(null);
  const [showPayloadModal, setShowPayloadModal] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDeadLetters = useCallback(async () => {
    try {
      const response: any = await apiClient.get('/loyalty/v1/admin/dead-letter');
      const items = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];
      setDeadLetters(items);
    } catch (err) {
      console.error('[DeadLetterPage] Failed to load dead-letter events:', err);
      setDeadLetters([]);
    }
  }, []);

  useEffect(() => {
    loadDeadLetters();
  }, [loadDeadLetters]);

  const handleRetrigger = async (item: DeadLetterItem) => {
    setIsSubmitting(true);
    try {
      await apiClient.post(`/loyalty/v1/admin/dead-letter/${item.id}/retrigger`);
      await loadDeadLetters();
    } catch (err) {
      console.error('[DeadLetterPage] Failed to retrigger dead-letter event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchRetrigger = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.post('/loyalty/v1/admin/dead-letter/batch-retrigger');
      setShowBatchConfirm(false);
      await loadDeadLetters();
    } catch (err) {
      console.error('[DeadLetterPage] Failed to batch retrigger dead-letter events:', err);
    } finally {
      setIsSubmitting(false);
    }
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
            {t('nav.dead_letter')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('dead_letter.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            label={t('dead_letter.batch_retrigger')}
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
          emptyMessage={t('common.no_data')}
          paginator
          rows={10}
          className="p-datatable-sm"
        >
          <Column
            header={t('common.stt')}
            body={(_data, options) => (
              <span className="font-mono text-xs text-600">{options.rowIndex + 1}</span>
            )}
            style={{ width: '60px', textAlign: 'center' }}
          />
          <Column
            header={t('common.actions')}
            body={(rowData: DeadLetterItem) => (
              <div className="flex items-center gap-2">
                <Button
                  icon="pi pi-eye"
                  rounded
                  text
                  severity="info"
                  tooltip={t('dead_letter.view_payload')}
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
                  tooltip={t('dead_letter.retrigger_single')}
                  loading={isSubmitting}
                  onClick={() => handleRetrigger(rowData)}
                />
              </div>
            )}
            style={{ width: '120px' }}
          />
          <Column field="eventType" header={t('dead_letter.event_type')} style={{ fontWeight: 600 }} />
          <Column field="tenantId" header={t('dead_letter.tenant')} style={{ width: '150px' }} />
          <Column
            field="retryCount"
            header={t('dead_letter.retry_count')}
            body={(row: DeadLetterItem) => (
              <Tag value={`${row.retryCount} / 5`} severity="danger" />
            )}
            style={{ width: '110px', textAlign: 'center' }}
          />
          <Column field="errorMessage" header={t('dead_letter.error_message')} style={{ color: '#ef4444' }} />
          <Column field="failedAt" header={t('dead_letter.failed_at')} style={{ width: '170px' }} />
        </DataTable>
      </div>

      {/* Modal Xem Payload JSON */}
      <Dialog
        header={t('dead_letter.payload_detail', { id: selectedItem?.id })}
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
        header={t('deadletter.batch_confirm_title')}
        visible={showBatchConfirm}
        style={{ width: '480px' }}
        onHide={() => setShowBatchConfirm(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button label={t('common.cancel')} text severity="secondary" onClick={() => setShowBatchConfirm(false)} />
            <Button label={t('deadletter.batch_confirm_btn')} severity="danger" icon="pi pi-check" loading={isSubmitting} onClick={handleBatchRetrigger} />
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <i className="pi pi-exclamation-triangle text-3xl text-yellow-500" />
          <div>
            <p className="font-semibold text-gray-800">{t('deadletter.batch_confirm_question')}</p>
            <p className="text-sm text-gray-600 mt-1">
              {t('deadletter.batch_confirm_desc', { count: deadLetters.length })}
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
