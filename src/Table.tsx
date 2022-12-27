import React from "react";

//
import {
	Column,
	ColumnDef,
	useReactTable,
	getCoreRowModel,
	flexRender,
	RowData,
} from "@tanstack/react-table";
import { makeData, setInitialData, TableContent } from "./makeData";
import axios from "axios";
import { useState } from "react";
import { useEffect } from "react";

declare module "@tanstack/react-table" {
	interface TableMeta<TData extends RowData> {
		updateData: (
			rowIndex: number,
			columnId: string,
			value: unknown
		) => void;
	}
}

const defaultColumn: Partial<ColumnDef<TableContent>> = {
	cell: ({ getValue, row: { index }, column: { id }, table }) => {
		const initialValue = getValue();
		const [value, setValue] = React.useState(initialValue);

		const onBlur = () => {
			table.options.meta?.updateData(index, id, value);
		};

		React.useEffect(() => {
			setValue(initialValue);
		}, [initialValue]);

		if (id === "name" || id === "actual")
			return <span>{value as string}</span>;

		return (
			<input
				value={value as string}
				onChange={(e) => {
					setValue((prev: unknown) => e.target.value);
					table.options.meta?.updateData(index, id, value);
				}}
				onBlur={onBlur}
			/>
		);
	},
};

const Table = () => {
	const columns = React.useMemo<ColumnDef<TableContent>[]>(
		() => [
			{
				header: "Name",
				accessorKey: "name",
			},

			{
				accessorKey: "payment1",
				header: () => "Payment 1",
			},
			{
				accessorKey: "payment2",
				header: () => "Payment 2",
			},
			{
				accessorKey: "payment3",
				header: "Payment 3",
			},
			{
				accessorKey: "payment4",
				header: "Payment 4",
			},
			{
				accessorKey: "actual",
				header: "Actual",
			},
		],
		[]
	);

	const [subTotal, setSubTotal] = useState<TableContent>({
		id: -1,
		name: "subtotal",
		payment1: 0,
		payment2: 0,
		payment3: 0,
		payment4: 0,
		actual: 0,
	});

	const [data, setData] = React.useState(() =>
		makeData([
			"test 1",
			"test 2",
			"test 3",
			"test 4",
			"test 5",
			"test 6",
			"test 7",
			"test 8",
		])
	);

	useEffect(() => {
		const setter = async () => {
			const tableData = data;
			axios
				.get("https://192.154.255.82:7070/BudgetMasters/GetBudget")
				.then((d) => {
					console.log(d.data);
					for (const item of d.data) {
						if (item.endDate !== null) {
							const rowId = +item.endDate.split("_")[0];
							const colId: keyof TableContent = item.endDate
								.split("_")[1]
								.trim();
							tableData[rowId][colId] = item.actual;
							table.options.meta?.updateData(
								rowId,
								colId,
								item.actual
							);
						}
					}
					setData(tableData);
				});
			const inp = document.getElementsByTagName("input")[0];
			inp.focus();
			inp.blur();
		};

		setter();
	}, []);
	// const d: TableContent[] = [];
	// axios
	// 	.get("https://192.154.255.82:7070/BudgetMasters/GetBudget")
	// 	.then((data) => {
	// 		console.log(data.data);
	// 		for (const item of data.data) {
	// 			if (item.endDate !== null) {
	// 				const rowId = +item.endDate.split("_")[0];
	// 				const colId: keyof TableContent = item.endDate
	// 					.split("_")[1]
	// 					.trim();
	// 				tableData[rowId][colId] = +item.actual;
	// 			}
	// 		}
	// 		d.push(...tableData);
	// 	});
	// return d;

	const table = useReactTable({
		data,
		columns,
		defaultColumn,
		getCoreRowModel: getCoreRowModel(),
		meta: {
			updateData: (rowIndex, columnId, value) => {
				setData((old) => {
					setSubTotal((prev) => {
						return {
							id: prev.id,
							name: prev.name,
							payment1: 0,
							payment2: 0,
							payment3: 0,
							payment4: 0,
							actual: 0,
						};
					});
					return old.map((row, index) => {
						if (rowIndex === row.id) {
							for (const i of Object.keys(row))
								if (i === columnId) {
									row[i] = +value;
									row.actual =
										row.payment1 +
										row.payment2 +
										row.payment3 +
										row.payment4;
								}
						}
						setSubTotal((prev) => {
							return {
								id: prev.id,
								payment1: prev.payment1 + row.payment1,
								payment2: prev.payment2 + row.payment2,
								payment3: prev.payment3 + row.payment3,
								payment4: prev.payment4 + row.payment4,
								name: prev.name,
								actual: prev.actual + row.actual,
							};
						});
						return row;
					});
				});
			},
		},
	});

	const sendData = async () => {
		for (const d of data) {
			for (const item of Object.keys(d)) {
				if (item !== "name" && item !== "id")
					axios
						.post(
							"https://192.154.255.82:7070/BudgetMasters/PostBudget",
							{
								actual: d[item],
								endDate: `${d.id}_${item}`,
							}
						)
						.then((data) => {
							setData((old) =>
								old.map((i, index) => {
									if (i.id === d.id)
										i.budgetId = data.data.budgetId;
									return i;
								})
							);
						});
			}
		}
	};

	return (
		<div className="p-2">
			<table>
				<thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								return (
									<th
										key={header.id}
										colSpan={header.colSpan}
									>
										<div>
											{flexRender(
												header.column.columnDef.header,
												header.getContext()
											)}
										</div>
									</th>
								);
							})}
						</tr>
					))}
				</thead>
				<tbody>
					{table.getRowModel().rows.map((row) => {
						return (
							<tr key={row.id}>
								{row.getVisibleCells().map((cell) => {
									return (
										<td key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</td>
									);
								})}
							</tr>
						);
					})}
					<tr key={subTotal.id}>
						<td id={`subtotal_name`}>
							<span>{subTotal.name as string}</span>
						</td>
						<td id={`subtotal_payment1`}>
							<span>{subTotal.payment1}</span>
						</td>
						<td id={`subtotal_payment2`}>
							<span>{subTotal.payment2}</span>
						</td>
						<td id={`subtotal_payment3`}>
							<span>{subTotal.payment3}</span>
						</td>
						<td id={`subtotal_payment4`}>
							<span>{subTotal.payment4}</span>
						</td>
						<td id={`subtotal_actual`}>
							<span>{subTotal.actual}</span>
						</td>
					</tr>
				</tbody>
			</table>
			<button onClick={sendData}>Update</button>
		</div>
	);
};
export default Table;
