import React, { useEffect } from 'react';
import { FieldType } from '@/constants';
import FormField from '@/ui/FormField.tsx';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileObject, useToast } from 'components';
import AppDialog from 'components/src/components/core/dialog';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

// Define the props for FileUploaderDialog
interface FileUploaderDialogProps {
  visible: boolean;
  onHide: () => void;
  onSubmit?: (data: any) => void;
  uploadFileMutation?: any;
}

const FileUploaderDialog: React.FC<FileUploaderDialogProps> = ({ visible, onHide, uploadFileMutation }) => {
  const { t } = useTranslation();

  const schema = z.object({
    file: z.custom<File[] | FileObject[] | null>(),
  });

  type Values = z.infer<typeof schema>;
  const defaultValues = {
    file: null,
  } as Values;
  const { control, handleSubmit, reset, watch, setValue } = useForm<Values>({
    defaultValues,
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    reset({
      file: null,
    });
  }, [reset, visible]);

  // Use react-hook-form with zod for validation
  const toast = useToast();

  return (
    <>
      <AppDialog
        header={<span className="block text-xl font-bold text-left w-full">{t('import_list')}</span>}
        visible={visible}
        focusOnShow={false}
        onHide={() => {
          reset();
          onHide();
        }}
        // accept={handleSubmit(onCreateUpdate)}
        reject={() => {
          reset();
          onHide();
        }}
        acceptLabel={t('create')}
        style={{ width: '50vw' }}
      >
        <div className="grid">
          <div className="col-12">
            <FormField
              required
              name="file"
              type={FieldType.FILE}
              control={control}
              uploadProps={{
                accept: '.xlsx',
                uploadFileMutation: uploadFileMutation,
                autoUpload: true,
                multiple: false,
              }}
            />
          </div>
        </div>
      </AppDialog>
    </>
  );
};

export default FileUploaderDialog;
