import { Check, ChevronDown } from "lucide-react";
import { ComponentProps, useState } from "react";

import { cn } from "../utils";
import { Button } from "./Button";
import { Dropdown, DropdownItem } from "./Dropdown";

export interface SelectOption {
	value: string;
	label: string;
	icon?: React.ReactNode;
	disabled?: boolean;
}

interface SelectDropdownProps {
	options: SelectOption[];
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	size?: ComponentProps<typeof Button>["size"];
	disabled?: boolean;
}

export const SelectDropdown = ({
	options,
	value,
	onChange,
	placeholder = "Select an option",
	className,
	size = "default",
	disabled = false,
}: SelectDropdownProps) => {
	const [isOpen, setIsOpen] = useState(false);

	const selectedOption = options.find(option => option.value === value);

	const handleSelect = (optionValue: string) => {
		const option = options.find(opt => opt.value === optionValue);
		if (option && !option.disabled) {
			onChange(optionValue);
			setIsOpen(false);
		}
	};

	return (
		<Dropdown
			trigger={
				<Button
					variant="outline"
					className={cn("inline-flex items-center justify-between", className)}
					size={size}
					onClick={() => setIsOpen(!isOpen)}
					disabled={disabled}>
					{selectedOption ? (
						<div className="flex items-center gap-1">
							{selectedOption.icon}
							{selectedOption.label}
						</div>
					) : (
						placeholder
					)}
					<ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")} />
				</Button>
			}
			align="start"
			onClose={() => setIsOpen(false)}>
			{options.map(option => (
				<DropdownItem
					key={option.value}
					onSelect={() => handleSelect(option.value)}
					className={cn("flex items-center justify-between", option.disabled && "cursor-not-allowed opacity-50")}
					disabled={option.disabled}>
					<span className="flex items-center">
						{option.icon}
						{option.label}
					</span>
					{option.value === value && <Check className="h-4 w-4 text-accent" />}
				</DropdownItem>
			))}
		</Dropdown>
	);
};
