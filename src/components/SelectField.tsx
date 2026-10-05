import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
	containerClassName?: string;
}

export function SelectField({ containerClassName, children, ...selectProps }: SelectFieldProps) {
	return (
		<span className={`select-control${containerClassName ? ` ${containerClassName}` : ""}`}>
			<select {...selectProps}>{children}</select>
			<ChevronDown
				className="select-control-arrow"
				size={18}
				strokeWidth={1.8}
				aria-hidden="true"
			/>
		</span>
	);
}
