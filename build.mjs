import webpack from "webpack";

webpack({
	mode: "development",
	output: {
		filename: "Vertex.js",
		library: ["Vertex"]
	},
	target: "web"
}, callback);


function callback(error, stats) {
	error && console.error(error);
	console.log(stats.toString({
		chunks: false,  // Makes the build much quieter
		colors: true    // Shows colors in the console
	}));
}
