import React from 'react';

export const authInputCls =
'w-full px-4 py-3 rounded-lg border bg-surface text-body text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

interface AuthFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: (props: {id: string;className: string;'aria-invalid': boolean;'aria-describedby'?: string;}) => React.ReactNode;
}

export function AuthField({ id, label, hint, error, children }: AuthFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-micro text-text-secondary mb-2">
        {label}
      </label>
      {children({
        id,
        className: `${authInputCls} ${error ? 'border-danger' : 'border-border'}`,
        'aria-invalid': !!error,
        'aria-describedby': describedBy
      })}
      {error ?
      <p id={`${id}-error`} className="mt-1.5 text-[12px] text-danger">
          {error}
        </p> :
      hint ?
      <p id={`${id}-hint`} className="mt-1.5 text-[12px] text-text-secondary">
          {hint}
        </p> :
      null}
    </div>);

}