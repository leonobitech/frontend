import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CustomSelectProps } from "./types/types";

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onValueChange,
  placeholder,
  options,
  triggerClassName,
  contentClassName,
  alignOffset = 0,
}) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        className={cn(
          "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
          contentClassName
        )}
        position="popper"
        sideOffset={5}
        align="end"
        alignOffset={alignOffset}
        side="top"
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-700/20 dark:hover:from-pink-500/20 dark:hover:to-pink-700/20 transition-all duration-200"
          >
            <span>{option.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
