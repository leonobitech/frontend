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
          "!bg-[#333333] !border-white/10 !text-[#D1D5DB]",
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
            className="!text-gray-300 !bg-transparent hover:!bg-white/10 focus:!bg-white/10 data-[state=checked]:!text-white data-[state=checked]:!bg-white/10 [&_svg]:!text-gray-300 transition-all duration-200"
          >
            <span>{option.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
