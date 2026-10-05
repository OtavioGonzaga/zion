import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import type { SelectHTMLAttributes } from "react";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
	containerClassName?: string;
}

export function SelectField({ containerClassName, children, ...selectProps }: SelectFieldProps) {
	return (
		<span className={`select-control${containerClassName ? ` ${containerClassName}` : ""}`}>
			<select {...selectProps}>{children}</select>
			<KeyboardArrowDownIcon className="select-control-arrow" aria-hidden="true" />
		</span>
	);
}
