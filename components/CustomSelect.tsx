import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
  icon?: string;
}

interface CustomSelectProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = '選択してください',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    // Create a synthetic event to match the expected signature
    const syntheticEvent = {
      target: {
        name,
        value: optionValue,
      },
    } as React.ChangeEvent<HTMLSelectElement>;

    onChange(syntheticEvent);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Hidden select for form submission */}
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="sr-only"
        tabIndex={-1}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Custom dropdown button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="mt-1 w-full bg-white border border-gray-300 rounded-md shadow-sm py-2.5 px-3 text-left cursor-pointer hover:border-komaba-orange/50 focus:outline-none focus:border-komaba-orange transition-all duration-200 flex items-center justify-between"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 text-sm">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <span className="text-lg leading-none">{selectedOption.icon}</span>
              )}
              <span className="text-gray-900">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full text-left px-3 py-2.5 flex items-center gap-2 text-sm transition-colors ${
                option.value === value
                  ? 'bg-komaba-orange/10 text-komaba-orange font-medium'
                  : 'text-gray-900 hover:bg-gray-50'
              }`}
              role="option"
              aria-selected={option.value === value}
            >
              {option.icon && (
                <span className="text-lg leading-none">{option.icon}</span>
              )}
              <span>{option.label}</span>
              {option.value === value && (
                <svg
                  className="ml-auto w-5 h-5 text-komaba-orange"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
