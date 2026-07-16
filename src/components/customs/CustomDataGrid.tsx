import { Box } from "@mui/material";
import { DataGrid, type DataGridProps, type GridRowIdGetter } from "@mui/x-data-grid";

interface CustomDataGridProps extends Partial<DataGridProps> {
	rows: DataGridProps["rows"];
	columns: DataGridProps["columns"];
	/** @deprecated Sem efeito no MUI X Data Grid v8 (use `paginationModel`); mantido apenas para não quebrar chamadores existentes. */
	pageSize?: number;
	checkboxSelection?: boolean;
	/** @deprecated Sem efeito no MUI X Data Grid v8; mantido apenas para não quebrar chamadores existentes. */
	disableSelectionOnClick?: boolean;
	rowSpanning?: boolean;
	getRowId?: GridRowIdGetter;
}

export default function CustomDataGrid({
	rows,
	columns,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	pageSize,
	checkboxSelection = false,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	disableSelectionOnClick,
	rowSpanning = false,
	getRowId = (row) => row.id,
	getRowClassName,
	getRowHeight,
	rowHeight = 52,
	columnVisibilityModel = {},
	sx = {},
	...otherProps
}: CustomDataGridProps) {
	const defaultSx = {
		"& .MuiDataGrid-cell": {
			display: "flex",
			alignItems: "center",
			justifyContent: "flex-start",
			padding: "8px",
		},
		"& .MuiDataGrid-columnHeader": {
			display: "flex",
			alignItems: "center",
			justifyContent: "flex-start",
		},
		...sx,
	};

	return (
		<Box style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
			<DataGrid
				rows={rows}
				columns={columns}
				checkboxSelection={checkboxSelection}
				rowSpanning={rowSpanning}
				getRowId={getRowId}
				getRowClassName={getRowClassName}
				getRowHeight={getRowHeight}
				rowHeight={rowHeight}
				columnVisibilityModel={columnVisibilityModel}
				sx={{ ...defaultSx, flex: 1 }}
				{...otherProps}
			/>
		</Box>
	);
}
