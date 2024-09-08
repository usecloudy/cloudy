const CracoEnvPlugin = require("craco-plugin-env");
const ModuleScopePlugin = require("react-dev-utils/ModuleScopePlugin");

module.exports = {
	webpack: {
		configure: (webpackConfig, { env, paths }) => {
			// /* ... */
			// webpackConfig.target = "electron-renderer";
			webpackConfig.output.publicPath = "/";

			webpackConfig.module.rules.push({
				test: /\.tsx?$/,
				loader: "ts-loader",
				exclude: /node_modules/,
				options: {
					transpileOnly: true,
					configFile: "tsconfig.json",
				},
			});

			webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
				plugin => !(plugin instanceof ModuleScopePlugin),
			);

			return webpackConfig;
		},
	},
	plugins: [
		{
			plugin: CracoEnvPlugin,
		},
	],
};
