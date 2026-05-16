import React, { useId, useState } from 'react';
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

export const PasswordInputField = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      name,
      error,
      iconName = 'FaLock',
      fullWidth = false,
      autoComplete = 'off',
      className = '',
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);

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
        
        {/* LABEL */}
        {label && (
          <label
            htmlFor={id}
            className="text-sm text-text-muted font-semibold uppercase tracking-wider ml-1 flex items-center gap-1"
          >
            {label}
            {required && <span className="text-danger text-xs">*</span>}
          </label>
        )}

        {/* FIELD */}
        <div className="relative flex items-center group">
          
          {/* LEFT ICON */}
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

          {/* INPUT */}
          <input
            id={id}
            ref={ref}
            name={name}
            type={showPassword ? 'text' : 'password'}
            disabled={disabled}
            autoComplete={autoComplete}
            className={`
              peer ${baseInputStyles}
              ${iconName ? 'pl-11' : ''}
              pr-11
              ${
                error
                  ? 'border-danger focus:border-danger focus:ring-danger/20'
                  : ''
              }
              ${className}
            `}
            {...props}
          />

          {/* TOGGLE BUTTON */}
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className={`
              absolute right-4 transition-colors duration-200
              text-text-muted
              hover:text-primary
              focus:outline-none
              ${error ? 'text-danger' : ''}
            `}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <Icon
              iconName={showPassword ? 'FaEyeSlash' : 'FaEye'}
              size={16}
            />
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <span className="text-sm font-medium text-danger ml-1">
            {error}
          </span>
        )}
      </div>
    );
  }
);