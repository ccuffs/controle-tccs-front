import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { MenuItem, Select as MuiSelect, TextField, type SelectProps, type TextFieldProps } from "@mui/material";

type InputProps = Omit<TextFieldProps, "variant" | "size"> & {
	readOnly?: boolean;
	inputMode?: "text" | "numeric" | "decimal" | "email" | "search" | "tel" | "url";
	maxLength?: number;
	min?: number | string;
	max?: number | string;
	step?: number | string;
};

/** Campo de texto do design (TextField pequeno, contornado). */
export function Input({ readOnly, inputMode, maxLength, min, max, step, slotProps, ...rest }: InputProps) {
	return (
		<TextField
			{...rest}
			size="small"
			variant="outlined"
			slotProps={{ ...slotProps, htmlInput: { readOnly, inputMode, maxLength, min, max, step } }}
		/>
	);
}

export function Textarea(props: Omit<TextFieldProps, "variant" | "size" | "multiline">) {
	return <TextField {...props} size="small" variant="outlined" multiline />;
}

type OptionElement = ReactElement<{ value?: string | number; children?: ReactNode }>;

/**
 * Select do design. Aceita `<option>` como filhos (como no protótipo) e os converte
 * em `MenuItem`; sem `value`/`defaultValue`, começa na primeira opção.
 */
export function Select({ children, ...props }: Omit<SelectProps<string>, "size"> & { children: ReactNode }) {
	const options = Children.toArray(children).filter(isValidElement) as OptionElement[];
	const valorDe = (option: OptionElement) => String(option.props.value ?? option.props.children ?? "");
	const fallback = options[0] ? valorDe(options[0]) : "";
	return (
		<MuiSelect
			{...props}
			size="small"
			defaultValue={props.defaultValue ?? (props.value === undefined ? fallback : undefined)}
		>
			{options.map((option, index) => (
				<MenuItem key={`${valorDe(option)}-${index}`} value={valorDe(option)}>
					{option.props.children}
				</MenuItem>
			))}
		</MuiSelect>
	);
}
