import clsx from 'clsx';
import { FormProvider } from 'react-hook-form';

export interface Props {
  children: React.ReactNode;
  onSubmit?: (data: any) => void;
  form: any;
  formRef?: any;
  className?: string;
}

export default function Form({ children, onSubmit, form, formRef, className = '' }: Readonly<Props>) {
  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (e: any) => {
          console.error('Form submission error:', e);
        })}
        className={clsx('flex flex-col', className)}
        ref={formRef}
        onKeyDown={(e) => {
          // Prevent Enter from submitting the form
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        }}
      >
        {children}
      </form>
    </FormProvider>
  );
}
