import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";

export interface MuiSelectOption {
	value: string;
	label: string;
}

export interface MuiSelectProps {
	label?: string;
	value?: string;
	options?: MuiSelectOption[];
	onChange?: (value: string) => void;
}

export function MuiSelect({
	label = "Select",
	value = "",
	options = [],
	onChange,
}: MuiSelectProps) {
	const handleChange = (event: SelectChangeEvent) => {
		onChange?.(event.target.value);
	};

	return (
		<FormControl fullWidth size="small">
			<InputLabel>{label}</InputLabel>
			<Select value={value} label={label} onChange={handleChange}>
				{options.map((option) => (
					<MenuItem key={option.value} value={option.value}>
						{option.label}
					</MenuItem>
				))}
			</Select>
		</FormControl>
	);
}
