import { ReactNode } from 'react';

interface IShowProps<T> {
  when: T | undefined | null | false;
  fallback?: ReactNode | null;
  children: ReactNode | ((item: T) => ReactNode);
}

export default function Show<T>({
  children,
  fallback = null,
  when,
}: IShowProps<T>) {
  if (when) {
    if (typeof children === 'function') {
      return <>{children(when)}</>;
    }

    return <>{children}</>;
  }

  return <>{fallback}</>;
}
