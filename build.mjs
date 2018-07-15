import webpack from 'webpack';

webpack({
	target: 'web',
	mode: process.env.NODE_ENV || 'production',
	entry: {
		client: './src/client/index.js',
	},
	output: {
		library: 'Client',
	}
}, callback);


function callback(error, stats) {
	error && console.error(error);
	console.log(stats.toString({
		chunks: false, // Makes the build much quieter
		colors: true // Shows colors in the console
	}));
}
