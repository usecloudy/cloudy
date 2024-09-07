import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "../utils";
import { Button } from "./Button";
import { Dropdown, DropdownItem } from "./Dropdown";

export interface SelectOption {
	value: string;
	label: string;
}

interface SelectDropdownProps {
	options: SelectOption[];
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}

export const SelectDropdown = ({
	options,
	value,
	onChange,
	placeholder = "Select an option",
	className,
}: SelectDropdownProps) => {
	const [isOpen, setIsOpen] = useState(false);

	const selectedOption = options.find(option => option.value === value);

	const handleSelect = (optionValue: string) => {
		onChange(optionValue);
		setIsOpen(false);
	};

	return (
		<Dropdown
			trigger={
				<Button
					variant="outline"
					className={cn("w-full justify-between", className)}
					onClick={() => setIsOpen(!isOpen)}>
					{selectedOption ? selectedOption.label : placeholder}
					<ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
				</Button>
			}
			align="start"
			onClose={() => setIsOpen(false)}>
			{options.map(option => (
				<DropdownItem
					key={option.value}
					onSelect={() => handleSelect(option.value)}
					className="flex items-center justify-between">
					{option.label}
					{option.value === value && <Check className="h-4 w-4 text-accent" />}
				</DropdownItem>
			))}
		</Dropdown>
	);
};
