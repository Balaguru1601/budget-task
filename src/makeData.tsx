import axios from "axios";

export type Person = {
	firstName: string;
	lastName: string;
	age: number;
	visits: number;
	progress: number;
	status: "relationship" | "complicated" | "single";
	subRows?: Person[];
};

export type TableContent = {
	name: string;
	payment1: number;
	payment2: number;
	payment3: number;
	payment4: number;
	actual: number;
	id: number;
	budgetId?: number;
};

export const setInitialData = async (
	tableData: TableContent[]
): TableContent[] => {
	await axios
		.get("https://192.154.255.82:7070/BudgetMasters/GetBudget")
		.then((data) => {
			console.log(data.data);
			for (const item of data.data) {
				if (item.endDate !== null) {
					const rowId = +item.endDate.split("_")[0];
					const colId: keyof TableContent = item.endDate
						.split("_")[1]
						.trim();
					tableData[rowId][colId] = item.actual;
				}
			}
		});
	return tableData;
};

export const makeData = (names: string[]): TableContent[] => {
	const data: TableContent[] = [];
	for (const item in names)
		data.push({
			name: names[item],
			payment1: 0,
			payment2: 0,
			payment3: 0,
			payment4: 0,
			actual: 0,
			id: +item,
		});
	return data;
};
