module.exports = {
	arrowParens: "avoid",
	bracketSameLine: true,
	bracketSpacing: true,
	singleQuote: false,
	semi: true,
	tabWidth: 4,
	useTabs: true,
	printWidth: 128,
	trailingComma: "all",
	importOrder: ["^@thonk/(.*)$", "^root/(.*)$", "^src/(.*)$", "^[./]"],
	importOrderSeparation: true,
	importOrderSortSpecifiers: true,
	importOrderParserPlugins: ["typescript", "jsx", "decorators"],
	plugins: [
		"prettier-plugin-tailwindcss",
		"@trivago/prettier-plugin-sort-imports",
	],
};
