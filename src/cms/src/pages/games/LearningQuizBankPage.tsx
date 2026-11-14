import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { FileUpload, FileUploadSelectEvent } from 'primereact/fileupload';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { CommonStatus } from '@/models';
import { LoyaltyService, LearningQuestionModel } from '@/service/loyalty.service';

export const LearningQuizBankPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [questions, setQuestions] = useState<LearningQuestionModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [courseFilter, setCourseFilter] = useState<string>('ALL');
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
    const opts = optionsText.split('\n').map((s) => s.trim()).filter(Boolean);
    if (!formData.courseCode?.trim() || !(formData.questionTextVi?.trim() || formData.questionTextEn?.trim() || formData.questionTextHt?.trim()) || opts.length < 2) {
      toast.current?.show({ severity: 'warn', summary: t('common.warn'), detail: t('learning.required') });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.saveLearningQuestion(
        { ...(formData as LearningQuestionModel), options: opts },
        selectedTenant
      );
      toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('learning.saved') });
      setShowDialog(false);
      fetchQuestions();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (q: LearningQuestionModel) => {
    if (!q.id) return;
    try {
      await LoyaltyService.deleteLearningQuestion(q.id, selectedTenant);
      toast.current?.show({ severity: 'info', summary: t('common.success'), detail: q.courseCode });
      fetchQuestions();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
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
      toast.current?.show({ severity: 'success', summary: t('learning.import_success'), detail: `${importRows.length}` });
      setShowImportDialog(false);
      setImportRows([]);
      fetchQuestions();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('nav.learning_quiz') }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="m-0 text-primary font-semibold">
              {t('learning.title')}
            </h4>
            <p className="m-0 text-xs text-500 mt-1">
              {t('learning.subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Dropdown value={courseFilter} options={[{ label: t('learning.all_courses'), value: 'ALL' }, { label: 'Kreyòl 101', value: 'KREYOL_101' }, { label: 'Français 101', value: 'FRENCH_101' }, { label: 'English 101', value: 'ENGLISH_101' }]} onChange={(e) => setCourseFilter(e.value)} className="w-12rem" />
            <Button label={t('learning.import_csv')} icon="pi pi-upload" outlined size="small" onClick={() => setShowImportDialog(true)} />
            <Button label={t('learning.add_new')} icon="pi pi-plus" severity="success" size="small" onClick={openNew} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchQuestions} loading={loading} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-column gap-2"><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /></div>
        ) : (
          <DataTable<LearningQuestionModel[]> value={questions} paginator rows={15} stripedRows responsiveLayout="scroll" emptyMessage={t('learning.empty')}>
            <Column field="courseCode" header={t('learning.code')} body={(r: LearningQuestionModel) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.courseCode}</span>} style={{ minWidth: '10rem' }} />
            <Column field="questionTextVi" header={t('learning.question')} body={(r: LearningQuestionModel) => r.questionTextVi || r.questionTextEn || r.questionTextHt || '--'} style={{ minWidth: '18rem' }} />
            <Column field="correctOptionIndex" header={t('learning.answer')} body={(r: LearningQuestionModel) => <span className="text-green-700 font-medium">{r.options?.[r.correctOptionIndex] || `#${r.correctOptionIndex}`}</span>} style={{ minWidth: '10rem' }} />
            <Column field="rewardPoints" header={t('common.points')} body={(r: LearningQuestionModel) => <span className="font-mono">{r.rewardPoints || 0}</span>} style={{ minWidth: '8rem', textAlign: 'right' }} />
            <Column field="status" header={t('common.status')} body={(r: LearningQuestionModel) => <Tag value={r.status} severity={r.status === CommonStatus.ACTIVE ? 'success' : 'secondary'} />} style={{ minWidth: '8rem', textAlign: 'center' }} />
            <Column field="audioUrl" header="Audio" body={(r: LearningQuestionModel) => r.audioUrl ? <i className="pi pi-volume-up text-primary" title={r.audioUrl} /> : <span className="text-400">--</span>} style={{ minWidth: '5rem', textAlign: 'center' }} />
            <Column
              header={t('common.action')}
              body={(r: LearningQuestionModel) => (
                <div className="flex gap-1">
                  <Button icon="pi pi-pencil" text rounded size="small" onClick={() => openEdit(r)} />
                  <Button icon="pi pi-trash" text rounded severity="danger" size="small" onClick={() => handleDelete(r)} />
                </div>
              )}
              style={{ minWidth: '7rem' }}
            />
          </DataTable>
        )}
      </div>

      <Dialog visible={showDialog} onHide={() => setShowDialog(false)} header={t('learning.dialog_title')} style={{ width: '44rem' }} modal className="p-fluid">
        <div className="grid">
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('learning.code')} *</label>
            <InputText value={formData.courseCode || ''} onChange={(e) => setFormData({ ...formData, courseCode: e.target.value.toUpperCase() })} className="font-mono" />
          </div>
          <div className="col-12 md:col-3 field">
            <label className="text-sm font-medium">{t('common.points')}</label>
            <InputNumber value={formData.rewardPoints ?? 20} onValueChange={(e) => setFormData({ ...formData, rewardPoints: e.value || 0 })} min={0} />
          </div>
          <div className="col-12 md:col-3 field">
            <label className="text-sm font-medium">Audio URL</label>
            <InputText value={formData.audioUrl || ''} onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })} placeholder="https://cdn.../audio.mp3" />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('learning.question_vi')} *</label>
            <InputTextarea rows={2} value={formData.questionTextVi || ''} onChange={(e) => setFormData({ ...formData, questionTextVi: e.target.value })} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('learning.question_ht')}</label>
            <InputTextarea rows={2} value={formData.questionTextHt || ''} onChange={(e) => setFormData({ ...formData, questionTextHt: e.target.value })} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('learning.options')} *</label>
            <InputTextarea rows={4} value={optionsText} onChange={(e) => setOptionsText(e.target.value)} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('learning.answer_idx')} *</label>
            <InputNumber value={formData.correctOptionIndex ?? 0} onValueChange={(e) => setFormData({ ...formData, correctOptionIndex: e.value || 0 })} min={0} />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label={t('common.cancel')} outlined onClick={() => setShowDialog(false)} />
          <Button label={t('common.save')} icon="pi pi-check" onClick={handleSave} loading={submitting} />
        </div>
      </Dialog>

      <Dialog visible={showImportDialog} onHide={() => setShowImportDialog(false)} header={t('learning.import_title')} style={{ width: '40rem' }} modal>
        <div className="flex flex-column gap-3">
          <div className="text-xs text-600">
            {t('learning.csv_columns_label')} <code>questionCode,languageCode,topic,difficulty,questionText,opt1|opt2|opt3,correctAnswer,audioUrl</code>
          </div>
          <FileUpload mode="basic" accept=".csv" maxFileSize={2000000} customUpload auto={false} onSelect={handleSelectCsv} chooseLabel={t('common.choose_csv')} />
          {importRows.length > 0 && (
            <div className="text-sm text-green-700 font-medium">
              {t('learning.parsed_ready', { count: importRows.length })}
            </div>
          )}
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel')} outlined onClick={() => setShowImportDialog(false)} />
          <Button label={t('learning.confirm_import')} icon="pi pi-check" severity="success" disabled={importRows.length === 0} onClick={handleConfirmImport} loading={submitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default LearningQuizBankPage;
