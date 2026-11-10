import React from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChangeValue: (val: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeValue,
  placeholder = "Search...",
  onClear,
  className = "",
  ...props
}) => {
  return (
    <div className={`relative flex items-center w-full max-w-md ${className}`}>
      <Search
        className="w-4 h-4 text-muted absolute left-3.5 pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChangeValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full pl-10 pr-9 py-2.5 text-sm sm:text-base bg-card border border-border rounded-lg text-foreground placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent outline-none transition-all shadow-sm"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChangeValue("");
            if (onClear) onClear();
          }}
          aria-label="Clear search query"
          className="absolute right-3 p-1 text-muted hover:text-foreground rounded focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
