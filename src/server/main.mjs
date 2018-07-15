import express from 'express';
import createIoServer from 'socket.io';
import {
	port
} from './config';
import {
	createServer
} from 'http';

import Mesh from './Mesh';

const app = express()
	// add endpoint for client
	.use((req, res) => {
		console.debug(`${req.url} requested`);
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
		res.sendFile(req.url, {
			root: 'dist',
		});
	});
const server = createServer(app);
const io = createIoServer(server);

new Mesh(io);

// start server
server.listen(port);
