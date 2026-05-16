import React, { useId, useRef, useEffect, useState } from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  name?: string;
  error?: string;
  fullWidth?: boolean;
  resize?: 'none' | 'vertical' | 'both';
  showCounter?: boolean;
  maxLength?: number;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      name,
      error,
      fullWidth = false,
      className = '',
      required,
      disabled,
      rows = 3,
      resize = 'none',
      showCounter = false,
      maxLength,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const id = useId();
    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    const [charCount, setCharCount] = useState(0);

    // combine refs
    const textareaRef = (node: HTMLTextAreaElement) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
    };

    // =========================
    // AUTO EXPAND
    // =========================
    const autoResize = () => {
      const el = innerRef.current;
      if (!el) return;

      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    };

    useEffect(() => {
      autoResize();
    }, [value]);

    // =========================
    // HANDLE CHANGE
    // =========================
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      autoResize();
      onChange?.(e);
    };

    const resizeClass = {
      none: 'resize-none',
      vertical: 'resize-y',
      both: 'resize'
    }[resize];

    const baseStyles = `
      w-full bg-bg-light text-text border border-border-muted placeholder:text-text-muted
      rounded-xl px-4 py-3 text-sm leading-relaxed
      transition-all duration-200 ease-out
      focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
      hover:border-primary/40
      disabled:opacity-40 disabled:cursor-not-allowed
      overflow-hidden
      ${resizeClass}
    `;

    const NEAR_LIMIT_THRESHOLD = 0.9;
    const isNearLimit = maxLength && charCount >= maxLength * NEAR_LIMIT_THRESHOLD;

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

        {/* TEXTAREA */}
        <div className="relative">
          <textarea
            id={id}
            ref={textareaRef}
            name={name}
            rows={rows}
            disabled={disabled}
            maxLength={maxLength}
            value={value}
            onChange={handleChange}
            className={`
              ${baseStyles}
              ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
              ${className}
            `}
            {...props}
          />

          {/* COUNTER */}
          {showCounter && (
            <div
              className={`
                absolute bottom-2 right-3 text-[10px] font-medium
                ${isNearLimit ? 'text-danger' : 'text-text-muted'}
              `}
            >
              {charCount}{maxLength ? ` / ${maxLength}` : ''}
            </div>
          )}
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