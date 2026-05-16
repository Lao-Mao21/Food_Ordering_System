import React, { useId } from 'react';
import * as FaIcons from 'react-icons/fa6';
import Icon from '../Icon';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
  iconName?: keyof typeof FaIcons;
  fullWidth?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      error,
      iconName,
      fullWidth = false,
      className = '',
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const id = useId();

    const baseSelectStyles = `
      w-full bg-bg-light text-text border border-border-muted
      rounded-xl px-4 py-3 text-sm
      transition-all duration-200 ease-out
      focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
      hover:border-primary/40
      disabled:opacity-40 disabled:cursor-not-allowed
      appearance-none
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
            <div
              className={`
                absolute left-4 transition-colors duration-200
                text-text-muted
                group-focus-within:text-primary
                ${error ? 'text-danger' : ''}
              `}
            >
              <Icon iconName={iconName} size={18} />
            </div>
          )}

          <select
            id={id}
            ref={ref}
            disabled={disabled}
            className={`
              peer ${baseSelectStyles}
              ${iconName ? 'pl-11' : ''}
              ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
              ${className}
            `}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div
            className={`
              absolute right-4 transition-colors duration-200 pointer-events-none
              text-text-muted
              group-focus-within:text-primary
              ${error ? 'text-danger' : ''}
            `}
          >
            <Icon iconName="FaAngleDown" size={16} />
          </div>
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