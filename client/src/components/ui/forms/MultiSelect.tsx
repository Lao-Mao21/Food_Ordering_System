import { useState, useRef, useId } from 'react';
import * as FaIcons from 'react-icons/fa6';
import Icon from '../Icon';
import { useOnClickOutside } from '../../../hooks/useOnClickOutside';

interface MultiSelectProps {
  label?: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  error?: string;
  iconName?: keyof typeof FaIcons;
  fullWidth?: boolean;
}

export const MultiSelect = ({
  label,
  options,
  selectedValues,
  onChange,
  error,
  iconName,
  fullWidth = false,
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useOnClickOutside(containerRef, () => setIsOpen(false));

  const toggleOption = (val: string) => {
    const next = selectedValues.includes(val)
      ? selectedValues.filter(v => v !== val)
      : [...selectedValues, val];
    onChange(next);
  };

  const baseFieldStyles = `
    w-full bg-bg-light text-text border border-border-muted
    rounded-xl px-4 py-3 text-sm
    transition-all duration-200 ease-out
    focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
    hover:border-primary/40
    disabled:opacity-40 disabled:cursor-not-allowed
  `;

  return (
    <div
      ref={containerRef}
      className={`${fullWidth ? 'w-full' : 'w-72'} relative flex flex-col gap-2`}
    >
      {/* LABEL */}
      {label && (
        <label
          htmlFor={id}
          className="text-sm text-text-muted font-semibold uppercase tracking-wider ml-1 flex items-center gap-1"
        >
          {label}
          {<span className="text-danger text-xs">*</span>}
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

        {/* BUTTON (INPUT LOOK) */}
        <button
          id={id}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            text-left ${baseFieldStyles}
            flex items-center flex-wrap gap-2
            ${iconName ? 'pl-11' : ''}
            ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
          `}
        >
          {selectedValues.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedValues.map((val) => {
                const label = options.find(o => o.value === val)?.label;
                return (
                  <span
                    key={val}
                    className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
                    {label}
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="text-text-muted">Select options...</span>
          )}
        </button>

        {/* RIGHT ICON */}
        <div
          className={`
            absolute right-4 transition-colors duration-200 pointer-events-none
            text-text-muted
            group-focus-within:text-primary
            ${error ? 'text-danger' : ''}
          `}
        >
          <Icon iconName={isOpen ? 'FaAngleUp' : 'FaAngleDown'} size={18} />
        </div>
      </div>

      {/* DROPDOWN */}
      {isOpen && (
        <div className={`absolute z-50 mt-7 w-full bg-bg-light border border-border-muted rounded-xl shadow-lg 
          max-h-60 overflow-y-auto p-2 flex flex-col gap-1`}>
          {options.map((opt) => {
            const isSelected = selectedValues.includes(opt.value);

            return (
              <div
                key={opt.value}
                onClick={() => toggleOption(opt.value)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
                  transition-colors
                  ${isSelected ? 'bg-primary/10' : 'hover:bg-primary/5'}
                `}
              >
                {/* Checkbox indicator */}
                <div
                  className={`
                    w-4 h-4 rounded border flex items-center justify-center
                    ${isSelected 
                      ? 'bg-primary border-primary' 
                      : 'border-border-muted'}
                  `}
                >
                  {isSelected && (
                    <Icon iconName="FaCheck" size={10} className="text-white" />
                  )}
                </div>

                <span className="text-sm text-text">{opt.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <span className="text-sm font-medium text-danger ml-1">
          {error}
        </span>
      )}
    </div>
  );
};