const CracoEnvPlugin = require("craco-plugin-env");

module.exports = {
	webpack: {
		configure: (webpackConfig, { env, paths }) => {
			// /* ... */
			// webpackConfig.target = "electron-renderer";
			webpackConfig.output.publicPath = "/";
			return webpackConfig;
		},
	},
	plugins: [
		{
			plugin: CracoEnvPlugin,
		},
	],
};
