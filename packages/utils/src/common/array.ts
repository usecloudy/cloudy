export const zip = <T, U>(arr1: T[], arr2: U[]): [T, U][] => {
    if (arr1.length !== arr2.length) {
        throw new Error("Arrays must be of equal length to zip");
    }

    return arr1.map((item, index) => [item, arr2[index]!]);
};
