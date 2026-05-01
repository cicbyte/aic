import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  count?: number;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allLabel?: string;
  emptyText?: string;
  'data-testid'?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = '请选择',
  allLabel = '全部',
  emptyText = '暂无选项',
  'data-testid': testId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allOptions = [
    { value: '', label: allLabel },
    ...filteredOptions
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setIsOpen(false);
          setSearchQuery('');
          setHighlightedIndex(-1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev < allOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : allOptions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < allOptions.length) {
            handleSelect(allOptions[highlightedIndex].value);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, allOptions]);

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-option-index]');
      const targetItem = items[highlightedIndex];
      if (targetItem) {
        targetItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchQuery]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const getTotalCount = () => options.reduce((sum, opt) => sum + (opt.count || 0), 0);

  return (
    <div ref={containerRef} data-testid={testId} className="relative min-w-[160px]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all outline-none ${
          isOpen
            ? 'bg-white dark:bg-slate-900 ring-2 ring-primary/50'
            : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700'
        } ${selectedOption ? 'text-slate-700 dark:text-slate-200' : 'text-gray-500 dark:text-slate-400'}`}
      >
        <span className="flex-1 text-left truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        {selectedOption ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={14} />
          </button>
        ) : (
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-gray-100 dark:border-slate-700">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary dark:text-slate-200 dark:placeholder-slate-500"
                autoFocus
              />
            </div>
          </div>

          <div ref={listRef} className="max-h-60 overflow-y-auto py-1 scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              data-option-index="0"
              onClick={() => handleSelect('')}
              onMouseEnter={() => setHighlightedIndex(0)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                highlightedIndex === 0
                  ? 'bg-gray-100 dark:bg-slate-700'
                  : ''
              } ${
                !value
                  ? 'text-primary-dark dark:text-primary-light'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center">
                <span className="text-xs text-gray-500 dark:text-slate-400">*</span>
              </div>
              <span className="flex-1 text-left">{allLabel}</span>
              <span className="text-xs text-gray-400 dark:text-slate-500">
                {getTotalCount()}
              </span>
            </button>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  data-option-index={index + 1}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index + 1)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    highlightedIndex === index + 1
                      ? 'bg-gray-100 dark:bg-slate-700'
                      : ''
                  } ${
                    value === option.value
                      ? 'text-primary-dark dark:text-primary-light'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-xs font-bold">
                    {option.label.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-left truncate">{option.label}</span>
                  {option.count !== undefined && (
                    <span className="text-xs text-gray-400 dark:text-slate-500">{option.count}</span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-gray-400 dark:text-slate-500">
                {emptyText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
