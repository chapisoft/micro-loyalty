import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
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
import { LoyaltyService, LearningQuizQuestionModel } from '@/service/loyalty.service';

export const LearningQuizBankPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [questions, setQuestions] = useState<LearningQuizQuestionModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [langFilter, setLangFilter] = useState<string>('ALL');
  const [showDialog, setShowDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<LearningQuizQuestionModel>>({});
  const [optionsText, setOptionsText] = useState('');
  const [importRows, setImportRows] = useState<LearningQuizQuestionModel[]>([]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const list = await LoyaltyService.getLearningQuestions(
        { language: langFilter !== 'ALL' ? langFilter : undefined },
        selectedTenant
      );
      setQuestions(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant, langFilter]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const openNew = () => {
    setFormData({
      questionCode: '',
      languageCode: 'ht',
      topic: 'BASIC_VOCAB',
      difficulty: 'EASY',
      questionText: '',
      audioUrl: '',
      correctAnswer: '',
      explanation: '',
      status: CommonStatus.ACTIVE,
    });
    setOptionsText('');
    setShowDialog(true);
  };

  const openEdit = (q: LearningQuizQuestionModel) => {
    setFormData(q);
    setOptionsText((q.optionsJson || []).join('\n'));
    setShowDialog(true);
  };

  const handleSave = async () => {
    const opts = optionsText.split('\n').map((s) => s.trim()).filter(Boolean);
    if (!formData.questionCode?.trim() || !formData.questionText?.trim() || !formData.correctAnswer?.trim() || opts.length < 2) {
      toast.current?.show({ severity: 'warn', summary: t('common.warn', { defaultValue: 'Thiếu thông tin' }), detail: t('learning.required', { defaultValue: 'Nhập đủ Mã câu hỏi, Nội dung, ít nhất 2 phương án và Đáp án đúng.' }) });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.saveLearningQuestion(
        { ...(formData as LearningQuizQuestionModel), optionsJson: opts },
        selectedTenant
      );
      toast.current?.show({ severity: 'success', summary: t('common.success', { defaultValue: 'Thành công' }), detail: t('learning.saved', { defaultValue: 'Đã lưu câu hỏi vào ngân hàng Học Ngoại Ngữ.' }) });
      setShowDialog(false);
      fetchQuestions();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (q: LearningQuizQuestionModel) => {
    if (!q.id) return;
    try {
      await LoyaltyService.deleteLearningQuestion(q.id, selectedTenant);
      toast.current?.show({ severity: 'info', summary: t('common.success', { defaultValue: 'Đã xóa' }), detail: q.questionCode });
      fetchQuestions();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
    }
  };

  const handleSelectCsv = async (e: FileUploadSelectEvent) => {
    const file = e.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const parsed: LearningQuizQuestionModel[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length >= 5) {
        parsed.push({
          questionCode: cols[0],
          languageCode: cols[1] || 'ht',
          topic: cols[2] || 'GENERAL',
          difficulty: cols[3] || 'EASY',
          questionText: cols[4],
          optionsJson: (cols[5] || '').split('|').map((s) => s.trim()).filter(Boolean),
          correctAnswer: cols[6] || '',
          audioUrl: cols[7] || '',
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
      toast.current?.show({ severity: 'success', summary: t('common.success', { defaultValue: 'Nhập hàng loạt thành công' }), detail: `${importRows.length} câu hỏi` });
      setShowImportDialog(false);
      setImportRows([]);
      fetchQuestions();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('nav.learning_quiz', { defaultValue: 'Ngân hàng Câu hỏi Ngoại ngữ (GM-09)' }) }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="m-0 text-primary font-semibold">
              {t('learning.title', { defaultValue: 'Ngân hàng Câu hỏi Game Học Ngoại ngữ & Audio (GM-09)' })}
            </h4>
            <p className="m-0 text-xs text-500 mt-1">
              {t('learning.subtitle', { defaultValue: 'Quản lý bộ câu hỏi đa ngôn ngữ (HT / FR / EN / VI), liên kết phát âm Audio URL và nhập CSV hàng loạt.' })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Dropdown value={langFilter} options={[{ label: t('common.all', { defaultValue: 'Tất cả ngôn ngữ' }), value: 'ALL' }, { label: 'Kreyòl (ht)', value: 'ht' }, { label: 'Français (fr)', value: 'fr' }, { label: 'English (en)', value: 'en' }, { label: 'Tiếng Việt (vi)', value: 'vi' }]} onChange={(e) => setLangFilter(e.value)} className="w-12rem" />
            <Button label={t('learning.import_csv', { defaultValue: 'Nhập CSV' })} icon="pi pi-upload" outlined size="small" onClick={() => setShowImportDialog(true)} />
            <Button label={t('learning.add_new', { defaultValue: 'Thêm câu hỏi' })} icon="pi pi-plus" severity="success" size="small" onClick={openNew} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchQuestions} loading={loading} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-column gap-2"><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /></div>
        ) : (
          <DataTable<LearningQuizQuestionModel> value={questions} paginator rows={15} stripedRows responsiveLayout="scroll" emptyMessage={t('learning.empty', { defaultValue: 'Ngân hàng câu hỏi hiện chưa có dữ liệu.' })}>
            <Column field="questionCode" header={t('learning.code', { defaultValue: 'Mã Câu Hỏi' })} body={(r) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.questionCode}</span>} style={{ minWidth: '10rem' }} />
            <Column field="languageCode" header={t('learning.language', { defaultValue: 'Ngôn Ngữ' })} body={(r) => <Tag value={r.languageCode?.toUpperCase()} severity="info" />} style={{ minWidth: '7rem', textAlign: 'center' }} />
            <Column field="topic" header={t('learning.topic', { defaultValue: 'Chủ Đề' })} style={{ minWidth: '10rem' }} />
            <Column field="difficulty" header={t('learning.difficulty', { defaultValue: 'Độ Khó' })} body={(r) => <Tag value={r.difficulty} severity={r.difficulty === 'HARD' ? 'danger' : r.difficulty === 'MEDIUM' ? 'warning' : 'success'} />} style={{ minWidth: '7.5rem', textAlign: 'center' }} />
            <Column field="questionText" header={t('learning.question', { defaultValue: 'Nội Dung Câu Hỏi' })} style={{ minWidth: '18rem' }} />
            <Column field="correctAnswer" header={t('learning.answer', { defaultValue: 'Đáp Án Đúng' })} body={(r) => <span className="text-green-700 font-medium">{r.correctAnswer}</span>} style={{ minWidth: '10rem' }} />
            <Column field="audioUrl" header="Audio" body={(r) => r.audioUrl ? <i className="pi pi-volume-up text-primary" title={r.audioUrl} /> : <span className="text-400">--</span>} style={{ minWidth: '5rem', textAlign: 'center' }} />
            <Column
              header={t('common.action', { defaultValue: 'Thao Tác' })}
              body={(r) => (
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

      <Dialog visible={showDialog} onHide={() => setShowDialog(false)} header={t('learning.dialog_title', { defaultValue: 'Biên tập Câu hỏi Ngoại ngữ (GM-09)' })} style={{ width: '44rem' }} modal className="p-fluid">
        <div className="grid">
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('learning.code', { defaultValue: 'Mã Câu Hỏi' })} *</label>
            <InputText value={formData.questionCode || ''} onChange={(e) => setFormData({ ...formData, questionCode: e.target.value.toUpperCase() })} className="font-mono" />
          </div>
          <div className="col-12 md:col-3 field">
            <label className="text-sm font-medium">{t('learning.language', { defaultValue: 'Ngôn ngữ' })}</label>
            <Dropdown value={formData.languageCode} options={[{ label: 'ht', value: 'ht' }, { label: 'fr', value: 'fr' }, { label: 'en', value: 'en' }, { label: 'vi', value: 'vi' }]} onChange={(e) => setFormData({ ...formData, languageCode: e.value })} appendTo="self" />
          </div>
          <div className="col-12 md:col-3 field">
            <label className="text-sm font-medium">{t('learning.difficulty', { defaultValue: 'Độ khó' })}</label>
            <Dropdown value={formData.difficulty} options={[{ label: 'EASY', value: 'EASY' }, { label: 'MEDIUM', value: 'MEDIUM' }, { label: 'HARD', value: 'HARD' }]} onChange={(e) => setFormData({ ...formData, difficulty: e.value })} appendTo="self" />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('learning.topic', { defaultValue: 'Chủ đề' })}</label>
            <InputText value={formData.topic || ''} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">Audio URL</label>
            <InputText value={formData.audioUrl || ''} onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })} placeholder="https://cdn.../audio.mp3" />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('learning.question', { defaultValue: 'Nội dung câu hỏi' })} *</label>
            <InputTextarea rows={2} value={formData.questionText || ''} onChange={(e) => setFormData({ ...formData, questionText: e.target.value })} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('learning.options', { defaultValue: 'Các phương án (mỗi dòng 1 phương án)' })} *</label>
            <InputTextarea rows={4} value={optionsText} onChange={(e) => setOptionsText(e.target.value)} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('learning.answer', { defaultValue: 'Đáp án đúng' })} *</label>
            <InputText value={formData.correctAnswer || ''} onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })} className="mb-2" />
            <label className="text-sm font-medium">{t('learning.explanation', { defaultValue: 'Giải thích ngữ pháp / nghĩa' })}</label>
            <InputTextarea rows={2} value={formData.explanation || ''} onChange={(e) => setFormData({ ...formData, explanation: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} outlined onClick={() => setShowDialog(false)} />
          <Button label={t('common.save', { defaultValue: 'Lưu Câu Hỏi' })} icon="pi pi-check" onClick={handleSave} loading={submitting} />
        </div>
      </Dialog>

      <Dialog visible={showImportDialog} onHide={() => setShowImportDialog(false)} header={t('learning.import_title', { defaultValue: 'Nhập Câu hỏi từ CSV' })} style={{ width: '40rem' }} modal>
        <div className="flex flex-column gap-3">
          <div className="text-xs text-600">
            Cấu trúc cột CSV: <code>questionCode,languageCode,topic,difficulty,questionText,opt1|opt2|opt3,correctAnswer,audioUrl</code>
          </div>
          <FileUpload mode="basic" accept=".csv" maxFileSize={2000000} customUpload auto={false} onSelect={handleSelectCsv} chooseLabel={t('common.choose_csv', { defaultValue: 'Chọn tệp CSV' })} />
          {importRows.length > 0 && (
            <div className="text-sm text-green-700 font-medium">
              Đã phân tích hợp lệ {importRows.length} câu hỏi sẵn sàng nhập.
            </div>
          )}
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} outlined onClick={() => setShowImportDialog(false)} />
          <Button label={t('learning.confirm_import', { defaultValue: 'Xác nhận Nhập' })} icon="pi pi-check" severity="success" disabled={importRows.length === 0} onClick={handleConfirmImport} loading={submitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default LearningQuizBankPage;
