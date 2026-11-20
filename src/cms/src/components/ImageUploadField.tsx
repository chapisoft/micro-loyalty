import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'primereact/button';
import { MediaFolder } from '@/models';
import { LoyaltyService } from '@/service/loyalty.service';

export type ImageAspectMode = 'banner' | 'card' | 'wide' | 'square';

interface ImageUploadFieldProps {
  value?: string;
  onChange: (url: string) => void;
  folder: MediaFolder;
  tenantId?: string;
  label?: string;
  hint?: string;
  aspect?: ImageAspectMode;
  disabled?: boolean;
  maxSizeMb?: number;
}

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);

const ASPECT_HEIGHT_MAP: Record<ImageAspectMode, number> = {
  banner: 130,
  card: 110,
  wide: 120,
  square: 96,
};

/**
 * Reusable server-side image upload field for CMS forms.
 * Uploads selected/dropped image files directly to `/loyalty/v1/media/upload`
 * without exposing any manual external URL input.
 */
export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  value,
  onChange,
  folder,
  tenantId,
  label,
  hint,
  aspect = 'card',
  disabled = false,
  maxSizeMb = 5,
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewBroken, setPreviewBroken] = useState(false);

  useEffect(() => {
    setPreviewBroken(false);
    setErrorMsg(null);
  }, [value]);

  const previewHeight = ASPECT_HEIGHT_MAP[aspect];
  const objectFit: 'contain' | 'cover' = aspect === 'square' ? 'contain' : 'cover';

  const triggerPicker = () => {
    if (disabled || uploading) return;
    inputRef.current?.click();
  };

  const handleFile = async (file?: File | null) => {
    if (!file || disabled || uploading) return;
    setErrorMsg(null);
    setPreviewBroken(false);

    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type.toLowerCase())) {
      setErrorMsg(t('media.invalid_type'));
      return;
    }

    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size <= 0 || file.size > maxBytes) {
      setErrorMsg(t('media.file_too_large', { max: maxSizeMb }));
      return;
    }

    setUploading(true);
    try {
      const uploaded = await LoyaltyService.uploadMedia(file, folder, tenantId);
      if (uploaded?.url) {
        onChange(uploaded.url);
      } else {
        setErrorMsg(t('media.upload_failed'));
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err?.message;
      setErrorMsg(serverMsg || t('media.upload_failed'));
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    void handleFile(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    void handleFile(file);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) {
      setDragActive(true);
    }
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  return (
    <div className="flex flex-column gap-2">
      {label && <label className="font-bold text-900 text-sm">{label}</label>}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={onFileInputChange}
        style={{ display: 'none' }}
        disabled={disabled || uploading}
      />

      {value ? (
        <div className="border-1 surface-border border-round-lg p-2 surface-50 flex flex-column gap-2">
          <div
            className="border-round overflow-hidden surface-0 border-1 surface-border flex align-items-center justify-content-center"
            style={{
              height: `${previewHeight}px`,
              width: aspect === 'square' ? `${previewHeight}px` : '100%',
            }}
          >
            {previewBroken ? (
              <span className="text-xs text-500 px-2 text-center">
                {t('media.preview_unavailable')}
              </span>
            ) : (
              <img
                src={value}
                alt={label || ''}
                onError={() => setPreviewBroken(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit,
                  display: 'block',
                }}
              />
            )}
          </div>

          <div className="flex align-items-center justify-content-between gap-2 flex-wrap">
            <span className="text-xs text-500 font-mono text-overflow-ellipsis overflow-hidden white-space-nowrap" style={{ maxWidth: '16rem' }} title={value}>
              {value.split('/').pop()}
            </span>
            <div className="flex align-items-center gap-2">
              <Button
                type="button"
                label={uploading ? t('media.uploading') : t('media.change_btn')}
                icon={uploading ? 'pi pi-spin pi-spinner' : 'pi pi-upload'}
                size="small"
                outlined
                disabled={disabled || uploading}
                onClick={triggerPicker}
              />
              <Button
                type="button"
                label={t('media.remove_btn')}
                icon="pi pi-trash"
                size="small"
                outlined
                severity="danger"
                disabled={disabled || uploading}
                onClick={() => {
                  setErrorMsg(null);
                  setPreviewBroken(false);
                  onChange('');
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={triggerPicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              triggerPicker();
            }
          }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`border-1 border-dashed border-round-lg p-3 flex flex-column align-items-center justify-content-center gap-2 text-center transition-colors ${
            disabled ? 'opacity-60 cursor-not-allowed surface-100' : 'cursor-pointer hover:surface-100'
          } ${dragActive ? 'border-primary bg-primary-50' : 'surface-border surface-50'}`}
          style={{ minHeight: `${previewHeight}px` }}
        >
          <i
            className={
              uploading
                ? 'pi pi-spin pi-spinner text-primary text-2xl'
                : 'pi pi-cloud-upload text-primary text-2xl'
            }
          />
          <div className="text-sm font-medium text-800">
            {uploading ? t('media.uploading') : t('media.upload_btn')}
          </div>
          <div className="text-xs text-500">
            {hint || t('media.drop_hint', { max: maxSizeMb })}
          </div>
        </div>
      )}

      {errorMsg && (
        <small className="text-red-500 font-medium flex align-items-center gap-1">
          <i className="pi pi-exclamation-circle text-xs" />
          <span>{errorMsg}</span>
        </small>
      )}
    </div>
  );
};

export default ImageUploadField;
