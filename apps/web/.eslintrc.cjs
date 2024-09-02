/** @type {import("eslint").Linter.Config} */
module.exports = {
	root: true,
	extends: ["@repo/eslint-config/app.cjs"],
	parser: "@typescript-eslint/parser",
	parserOptions: {},
};
