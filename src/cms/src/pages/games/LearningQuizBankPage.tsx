import { getStoredTenantId } from '@/utils/tenant';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { FileUpload, FileUploadSelectEvent } from 'primereact/fileupload';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { CommonStatus } from '@/models';
import { LoyaltyService, LearningQuestionModel } from '@/service/loyalty.service';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions } from '@/components/StandardRowActions';
import { StatusBadge } from '@/components/StatusBadge';
import { exportToExcel } from '@/components/exportHelper';

export const LearningQuizBankPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => getStoredTenantId()
  );
  const [questions, setQuestions] = useState<LearningQuestionModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [courseFilter, setCourseFilter] = useState<string>('ALL');
  const [keyword, setKeyword] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<LearningQuestionModel>>({});
  const [optionsText, setOptionsText] = useState('');
  const [importRows, setImportRows] = useState<LearningQuestionModel[]>([]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const list = await LoyaltyService.getLearningQuestions(
        { courseCode: courseFilter !== 'ALL' ? courseFilter : undefined },
        selectedTenant
      );
      setQuestions(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant, courseFilter]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const openNew = () => {
    setFormData({
      courseCode: 'KREYOL_101',
      questionTextVi: '',
      questionTextEn: '',
      questionTextFr: '',
      questionTextHt: '',
      audioUrl: '',
      correctOptionIndex: 0,
      rewardPoints: 20,
      status: CommonStatus.ACTIVE,
    });
    setOptionsText('');
    setShowDialog(true);
  };

  const openEdit = (q: LearningQuestionModel) => {
    setFormData(q);
    setOptionsText((q.options || []).join('\n'));
    setShowDialog(true);
  };

  const handleSave = async () => {
    const opts = optionsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (
      !formData.courseCode?.trim() ||
      !(
        formData.questionTextVi?.trim() ||
        formData.questionTextEn?.trim() ||
        formData.questionTextHt?.trim()
      ) ||
      opts.length < 2
    ) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warn'),
        detail: t('learning.required'),
      });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.saveLearningQuestion(
        { ...(formData as LearningQuestionModel), options: opts },
        selectedTenant
      );
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: t('learning.saved'),
      });
      setShowDialog(false);
      fetchQuestions();
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: err?.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (q: LearningQuestionModel) => {
    if (!q.id) return;
    try {
      await LoyaltyService.deleteLearningQuestion(q.id, selectedTenant);
      toast.current?.show({
        severity: 'info',
        summary: t('common.success'),
        detail: q.courseCode,
      });
      fetchQuestions();
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: err?.response?.data?.message || err.message,
      });
    }
  };

  const handleSelectCsv = async (e: FileUploadSelectEvent) => {
    const file = e.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const parsed: LearningQuestionModel[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length >= 4) {
        parsed.push({
          courseCode: cols[0] || 'KREYOL_101',
          questionTextVi: cols[1] || '',
          questionTextEn: cols[2] || '',
          options: (cols[3] || '').split('|').map((s) => s.trim()).filter(Boolean),
          correctOptionIndex: Number(cols[4] || 0),
          rewardPoints: Number(cols[5] || 20),
          audioUrl: cols[6] || '',
          status: CommonStatus.ACTIVE,
        });
      }
    }
    setImportRows(parsed);
  };

  const handleConfirmImport = async () => {
    if (importRows.length === 0) return;
    setSubmitting(true);
    try {
      await LoyaltyService.importLearningQuestions(importRows, selectedTenant);
      toast.current?.show({
        severity: 'success',
        summary: t('learning.import_success'),
        detail: `${importRows.length}`,
      });
      setShowImportDialog(false);
      setImportRows([]);
      fetchQuestions();
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: err?.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQuestions = useMemo(() => {
    if (!keyword.trim()) return questions;
    const kw = keyword.toLowerCase();
    return questions.filter(
      (q) =>
        q.courseCode?.toLowerCase().includes(kw) ||
        q.questionTextVi?.toLowerCase().includes(kw) ||
        q.questionTextEn?.toLowerCase().includes(kw) ||
        q.questionTextHt?.toLowerCase().includes(kw)
    );
  }, [questions, keyword]);

  const handleExport = () => {
    exportToExcel(
      filteredQuestions,
      [
        { header: t('learning.code'), field: 'courseCode' },
        { header: t('learning.question'), field: 'questionTextVi' },
        { header: t('common.points'), field: 'rewardPoints' },
        { header: t('common.status'), field: 'status' },
      ],
      'ngan_hang_cau_hoi'
    );
  };

  return (
    <div className="w-full">
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('nav.learning_quiz') }]} />

      <StandardPageHeader
        title={t('learning.title')}
        subtitle={t('learning.subtitle')}
        primaryAction={{
          label: t('common.create', 'Thêm mới'),
          onClick: openNew,
        }}
        secondaryActions={[
          {
            label: t('learning.import_csv', 'Nhập CSV'),
            icon: 'pi pi-upload',
            onClick: () => setShowImportDialog(true),
          },
        ]}
        extraLeft={<TenantSelector value={selectedTenant} onChange={setSelectedTenant} />}
        onRefresh={fetchQuestions}
        refreshLoading={loading}
      />

      <div className="card shadow-1 border-round surface-card p-4">
        <UniversalFilterBar
          keyword={keyword}
          onKeywordChange={setKeyword}
          searchPlaceholder={t('common.search')}
          primaryFilters={
            <Dropdown
              value={courseFilter}
              options={[
                { label: `${t('learning.all_courses')}: ${t('common.all')}`, value: 'ALL' },
                { label: 'Kreyòl 101', value: 'KREYOL_101' },
                { label: 'Français 101', value: 'FRENCH_101' },
                { label: 'English 101', value: 'ENGLISH_101' },
              ]}
              onChange={(e) => setCourseFilter(e.value)}
              className="w-14rem"
            />
          }
          onReset={() => {
            setKeyword('');
            setCourseFilter('ALL');
          }}
          onExport={handleExport}
        />

        {loading ? (
          <div className="flex flex-column gap-2 mt-3">
            <Skeleton height="2.75rem" />
            <Skeleton height="2.75rem" />
            <Skeleton height="2.75rem" />
          </div>
        ) : (
          <DataTable<LearningQuestionModel[]>
            value={filteredQuestions}
            paginator
            rows={15}
            stripedRows
            responsiveLayout="scroll"
            emptyMessage={t('learning.empty')}
            className="mt-3"
          >
            <Column
              header={t('common.order_number', 'STT')}
              body={(_, opt) => opt.rowIndex + 1}
              style={{ width: '4rem', textAlign: 'center' }}
            />
            <Column
              header={t('common.action', 'Thao tác')}
              body={(r: LearningQuestionModel) => (
                <StandardRowActions
                  onEdit={() => openEdit(r)}
                  onDelete={() => handleDelete(r)}
                />
              )}
              style={{ width: '7rem', textAlign: 'center' }}
            />
            <Column
              field="courseCode"
              header={t('learning.code')}
              body={(r: LearningQuestionModel) => (
                <span className="font-bold font-mono text-900">{r.courseCode}</span>
              )}
              style={{ minWidth: '10rem' }}
            />
            <Column
              field="questionTextVi"
              header={t('learning.question')}
              body={(r: LearningQuestionModel) => (
                <span className="text-900 text-sm">
                  {r.questionTextVi || r.questionTextEn || r.questionTextHt || '--'}
                </span>
              )}
              style={{ minWidth: '18rem' }}
            />
            <Column
              field="correctOptionIndex"
              header={t('learning.answer')}
              body={(r: LearningQuestionModel) => (
                <span className="text-900 text-sm font-medium">
                  {r.options?.[r.correctOptionIndex] || `#${r.correctOptionIndex}`}
                </span>
              )}
              style={{ minWidth: '10rem' }}
            />
            <Column
              field="rewardPoints"
              header={t('common.points')}
              body={(r: LearningQuestionModel) => (
                <span className="text-900 font-mono text-sm">{r.rewardPoints || 0}</span>
              )}
              style={{ minWidth: '8rem', textAlign: 'right' }}
            />
            <Column
              field="audioUrl"
              header={t('learning.audio')}
              body={(r: LearningQuestionModel) => (
                <span className="text-900 font-mono text-xs">
                  {r.audioUrl ? 'Audio' : '--'}
                </span>
              )}
              style={{ minWidth: '6rem', textAlign: 'center' }}
            />
            <Column
              field="status"
              header={t('common.status')}
              body={(r: LearningQuestionModel) => (
                <StatusBadge status={r.status} />
              )}
              style={{ minWidth: '8rem', textAlign: 'center' }}
            />
          </DataTable>
        )}
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={t('learning.dialog_title')}
        style={{ width: '44rem' }}
        modal
        className="p-fluid"
      >
        <div className="grid">
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('learning.code')} *</label>
            <InputText
              value={formData.courseCode || ''}
              onChange={(e) => setFormData({ ...formData, courseCode: e.target.value.toUpperCase() })}
              className="font-mono"
            />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('common.points')}</label>
            <InputNumber
              value={formData.rewardPoints ?? 20}
              onValueChange={(e) => setFormData({ ...formData, rewardPoints: e.value || 0 })}
              min={0}
            />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('learning.question')} (VI) *</label>
            <InputText
              value={formData.questionTextVi || ''}
              onChange={(e) => setFormData({ ...formData, questionTextVi: e.target.value })}
            />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('learning.question')} (EN)</label>
            <InputText
              value={formData.questionTextEn || ''}
              onChange={(e) => setFormData({ ...formData, questionTextEn: e.target.value })}
            />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('learning.question')} (Kreyòl)</label>
            <InputText
              value={formData.questionTextHt || ''}
              onChange={(e) => setFormData({ ...formData, questionTextHt: e.target.value })}
            />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('learning.options_label')} *</label>
            <InputTextarea
              rows={4}
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              placeholder="Đáp án A&#10;Đáp án B&#10;Đáp án C&#10;Đáp án D"
            />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('learning.correct_index')}</label>
            <InputNumber
              value={formData.correctOptionIndex ?? 0}
              onValueChange={(e) => setFormData({ ...formData, correctOptionIndex: e.value || 0 })}
              min={0}
              max={5}
            />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('learning.audio')}</label>
            <InputText
              value={formData.audioUrl || ''}
              onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
              placeholder="https://cdn.natcash.ht/audio/q1.mp3"
            />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label={t('common.cancel')} outlined onClick={() => setShowDialog(false)} />
          <Button
            label={t('common.save')}
            icon="pi pi-check"
            onClick={handleSave}
            loading={submitting}
          />
        </div>
      </Dialog>

      <Dialog
        visible={showImportDialog}
        onHide={() => setShowImportDialog(false)}
        header={t('learning.import_csv')}
        style={{ width: '38rem' }}
        modal
      >
        <div className="flex flex-column gap-3">
          <div className="text-sm text-600">{t('learning.csv_format_help')}</div>
          <FileUpload
            mode="basic"
            accept=".csv"
            maxFileSize={1000000}
            onSelect={handleSelectCsv}
            chooseLabel={t('learning.choose_csv')}
            auto
          />
          {importRows.length > 0 && (
            <div className="text-sm font-semibold text-green-700">
              {t('learning.csv_ready', { count: importRows.length })}
            </div>
          )}
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel')} outlined onClick={() => setShowImportDialog(false)} />
          <Button
            label={t('common.confirm')}
            icon="pi pi-check"
            onClick={handleConfirmImport}
            disabled={importRows.length === 0}
            loading={submitting}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default LearningQuizBankPage;
