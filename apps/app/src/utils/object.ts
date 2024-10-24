export const keyBy = <T extends Record<string, any>>(array: T[], key: keyof T): Record<string, T> => {
	return array.reduce(
		(acc, item) => {
			acc[item[key]] = item;
			return acc;
		},
		{} as Record<string, T>,
	);
};

export const deepEqual = (a: any, b: any) => {
	return JSON.stringify(a) === JSON.stringify(b);
};
