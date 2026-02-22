import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "calories_asc", label: "Calories (asc)" },
  { value: "calories_desc", label: "Calories (desc)" },
];

export const SortDropdown = ({ value, onChange, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(
    SORT_OPTIONS.findIndex((option) => option.value === value)
  );
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedIndex((prevIndex) =>
          Math.min(prevIndex + 1, SORT_OPTIONS.length - 1)
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex((prevIndex) => Math.max(prevIndex - 1, 0));
      } else if (event.key === "Enter" && isOpen && highlightedIndex !== -1) {
        event.preventDefault();
        onChange(SORT_OPTIONS[highlightedIndex].value);
        setIsOpen(false);
      }
    },
    [isOpen, highlightedIndex, onChange]
  );

  const selectedOptionLabel = useMemo(() => {
    const option = SORT_OPTIONS.find((opt) => opt.value === value);
    return option ? option.label : "Sort by";
  }, [value]);

  return (
    <div className="relative inline-flex w-full sm:w-auto" ref={dropdownRef}>
      {/* Pill Button (Closed State) */}
        <button
          type="button"
          className={`inline-flex items-center justify-between gap-2 rounded-full backdrop-blur shadow-md px-3 py-1.5 text-xs font-medium w-full sm:w-auto
            ${theme.card} ${theme.border} ${theme.textMain} hover:${theme.inputBg} hover:border-${theme.accent}
            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-${theme.card} focus:ring-${theme.accent} theme-transition clickable`}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onKeyDown={handleKeyDown}
        >
        <span>{selectedOptionLabel}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu (Open State) */}
      {isOpen && (
        <ul
          role="listbox"
          className={`absolute right-0 mt-1 w-full sm:w-44 rounded-xl shadow-xl backdrop-blur py-1 text-xs z-20 ${theme.card} ${theme.border} theme-transition`}
        >
          {SORT_OPTIONS.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              className={`block w-full text-left px-3 py-1.5 cursor-pointer theme-transition
                ${option.value === value ? `font-bold ${theme.primaryText}` : `${theme.textMain}`}
                ${index === highlightedIndex ? `outline-none ring-2 ring-${theme.accent} rounded-lg` : ''}
                hover:${theme.inputBg}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              onKeyDown={handleKeyDown}
              tabIndex={-1} // Make li focusable for keyboard navigation
            >
              {option.value === value && (
                <span className={`inline-block w-2 h-2 rounded-full mr-2 shadow-sm ${theme.primary} align-middle`}></span>
              )}
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
