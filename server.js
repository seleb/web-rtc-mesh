const express = require("express");
const { resolve } = require("path");
const Mesh = require("./src/Mesh");
const { port } = require("./src/config");

const server = express()
	.use((req, res) => {
		console.log(`${req.url} requested`);
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		res.sendFile(req.url, {
			root: resolve(__dirname, "dist")
		});
	})
	.listen(port);

new Mesh(server);
