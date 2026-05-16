import React, { useId } from 'react';
import * as FaIcons from 'react-icons/fa6';
import Icon from '../Icon';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name?: string;
  error?: string;
  iconName?: keyof typeof FaIcons;
  fullWidth?: boolean;
  autoComplete?: string;
}

export const InputField = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      name,
      error,
      iconName,
      fullWidth = false,
      autoComplete = "auto",
      className = '',
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    
    const id = useId(); // React hook that generates a unique, stable ID string for your component.

    const baseInputStyles = `
      w-full bg-bg-light text-text border border-border-muted placeholder:text-text-muted
      rounded-xl px-4 py-3 text-sm
      transition-all duration-200 ease-out
      focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
      hover:border-primary/40
      disabled:opacity-40 disabled:cursor-not-allowed
    `;

    return (
      <div className={`${fullWidth ? 'w-full' : 'w-72'} flex flex-col gap-2`}>
        
        {label && (
          <label
            htmlFor={id}
            className="text-sm text-text-muted font-semibold uppercase tracking-wider ml-1 flex items-center gap-1">
            {label}
            {required && <span className="text-danger text-xs">*</span>}
          </label>
        )}

        <div className="relative flex items-center group">
          
          {iconName && (
            <div className={`
              absolute left-4 transition-colors duration-200
              text-text-muted
              group-focus-within:text-primary
              ${error ? 'text-danger' : ''}
            `}>
              <Icon iconName={iconName} size={18} />
            </div>
          )}

          <input
            id={id}
            ref={ref}
            name={name}
            disabled={disabled}
            autoComplete={autoComplete}
            className={`
              peer ${baseInputStyles}
              ${iconName ? 'pl-11' : ''}
              ${error 
                ? 'border-danger focus:border-danger focus:ring-danger/20' 
                : ''}
              ${className}
            `}
            {...props}
          />
        </div>

        {error && (
          <span className="text-sm font-medium text-danger ml-1">
            {error}
          </span>
        )}
      </div>
    );
  }
);