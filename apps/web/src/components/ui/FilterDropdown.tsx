import React from "react";
import { Filter } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selectedValue: string;
  onSelect: (val: string) => void;
  className?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  options,
  selectedValue,
  onSelect,
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-2.5 text-sm bg-card border border-border rounded-lg px-3.5 py-2 shadow-sm ${className}`}>
      <Filter className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
      <span className="text-xs sm:text-sm font-semibold text-muted uppercase tracking-wider shrink-0">
        {label}:
      </span>
      <select
        value={selectedValue}
        onChange={(e) => onSelect(e.target.value)}
        aria-label={`Filter by ${label}`}
        className="bg-card text-sm sm:text-base font-medium text-foreground focus:outline-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-card text-foreground">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
