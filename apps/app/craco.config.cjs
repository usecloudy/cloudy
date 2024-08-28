const CracoEnvPlugin = require("craco-plugin-env");

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

			return webpackConfig;
		},
	},
	plugins: [
		{
			plugin: CracoEnvPlugin,
		},
	],
};
