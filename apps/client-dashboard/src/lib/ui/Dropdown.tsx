import { useLayoutEffect, useRef, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import "./dropdown.css";

export type DropdownOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type DropdownProps = {
  label: string;
  value: string;
  options: readonly DropdownOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
};

/** A controlled, single-value form select. The backend remains the authority for permissions. */
export function Dropdown({
  label,
  value,
  options,
  onValueChange,
  placeholder = "Select an option",
  disabled,
  required,
  name,
}: DropdownProps) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null);

  useLayoutEffect(() => {
    setDialog(trigger.current?.closest("dialog") ?? null);
  }, []);

  return (
    <Select.Root
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      required={required}
      name={name}
    >
      <Select.Trigger
        ref={trigger}
        className="emora-dropdown-trigger"
        aria-label={label}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="emora-dropdown-chevron">
          <ChevronDown size={16} aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal container={dialog ?? undefined}>
        <Select.Content
          className="emora-dropdown-content"
          position="popper"
          sideOffset={6}
          collisionPadding={12}
          collisionBoundary={dialog ?? undefined}
        >
          <Select.ScrollUpButton className="emora-dropdown-scroll">
            <ChevronUp size={15} />
          </Select.ScrollUpButton>
          <Select.Viewport className="emora-dropdown-viewport">
            {options.map((option) => (
              <Select.Item
                className="emora-dropdown-item"
                value={option.value}
                disabled={option.disabled}
                key={option.value}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="emora-dropdown-check">
                  <Check size={15} aria-hidden="true" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="emora-dropdown-scroll">
            <ChevronDown size={15} />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
