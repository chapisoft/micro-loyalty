import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions } from '@/components/StandardRowActions';
import { exportToExcel } from '@/components/exportHelper';
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
  const [searchKeyword, setSearchKeyword] = useState('');

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

  const filteredItems = useMemo(() => {
    const q = searchKeyword.toLowerCase().trim();
    if (!q) return deadLetters;
    return deadLetters.filter(
      (item) =>
        item.eventType?.toLowerCase().includes(q) ||
        item.targetUrl?.toLowerCase().includes(q) ||
        item.errorMessage?.toLowerCase().includes(q)
    );
  }, [deadLetters, searchKeyword]);

  const handleExport = () => {
    exportToExcel(
      filteredItems.map((item, idx) => ({
        stt: idx + 1,
        eventType: item.eventType,
        tenantId: item.tenantId,
        targetUrl: item.targetUrl,
        retryCount: `${item.retryCount} / 5`,
        errorMessage: item.errorMessage,
        failedAt: item.failedAt,
      })),
      [
        { key: 'stt', header: t('common.stt') },
        { key: 'eventType', header: t('dead_letter.event_type') },
        { key: 'tenantId', header: t('dead_letter.tenant') },
        { key: 'targetUrl', header: 'Target URL' },
        { key: 'retryCount', header: t('dead_letter.retry_count') },
        { key: 'errorMessage', header: t('dead_letter.error_message') },
        { key: 'failedAt', header: t('dead_letter.failed_at') },
      ],
      'Danh_Sach_Dead_Letter_Queue'
    );
  };

  return (
    <div className="w-full">
      <StandardPageHeader
        title={t('nav.dead_letter')}
        subtitle={t('dead_letter.subtitle', 'Giám sát hàng đợi sự kiện lỗi, thử lại và phân tích nguyên nhân lỗi')}
        breadcrumbs={[
          { label: t('nav.admin') },
          { label: t('nav.dead_letter') },
        ]}
        primaryAction={{
          label: t('dead_letter.batch_retrigger'),
          icon: 'pi pi-replay',
          severity: 'danger',
          disabled: deadLetters.length === 0 || isSubmitting,
          onClick: () => setShowBatchConfirm(true),
        }}
      />

      <div className="card shadow-1 border-round surface-card p-3 w-full">
        <UniversalFilterBar
          searchValue={searchKeyword}
          onSearchChange={setSearchKeyword}
          searchPlaceholder={t('common.search')}
          onExport={handleExport}
          onReset={() => setSearchKeyword('')}
          onRefresh={loadDeadLetters}
        />

        <DataTable
          value={filteredItems}
          emptyMessage={t('common.no_data')}
          paginator
          rows={10}
          rowsPerPageOptions={[10, 25, 50]}
          className="p-datatable-sm"
          stripedRows
          responsiveLayout="scroll"
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
              <StandardRowActions
                onView={() => {
                  setSelectedItem(rowData);
                  setShowPayloadModal(true);
                }}
                extraActions={[
                  {
                    label: t('dead_letter.retrigger_single'),
                    icon: 'pi pi-refresh',
                    onClick: () => handleRetrigger(rowData),
                  },
                ]}
              />
            )}
            style={{ width: '6.5rem', textAlign: 'center' }}
          />
          <Column
            field="eventType"
            header={t('dead_letter.event_type')}
            body={(row: DeadLetterItem) => <span className="font-bold font-mono text-900">{row.eventType}</span>}
            sortable
          />
          <Column field="tenantId" header={t('dead_letter.tenant')} body={(row: DeadLetterItem) => <span className="text-900">{row.tenantId}</span>} style={{ width: '150px' }} />
          <Column
            field="retryCount"
            header={t('dead_letter.retry_count')}
            body={(row: DeadLetterItem) => (
              <span className="text-900">{row.retryCount} / 5</span>
            )}
            style={{ width: '110px', textAlign: 'center' }}
          />
          <Column field="errorMessage" header={t('dead_letter.error_message')} body={(row: DeadLetterItem) => <span className="text-900">{row.errorMessage}</span>} />
          <Column field="failedAt" header={t('dead_letter.failed_at')} body={(row: DeadLetterItem) => <span className="text-900">{row.failedAt}</span>} style={{ width: '170px' }} />
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
