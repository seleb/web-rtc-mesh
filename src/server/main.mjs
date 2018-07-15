import express from 'express';
import createIoServer from 'socket.io';
import {
	createServer
} from 'http';
import createDebug from 'debug';
import {
	port,
	pingPong
} from './config';
import Mesh from './Mesh';

const debug = createDebug('web-rtc-mesh:server');

const app = express()
	// add endpoint for client
	.use((req, res) => {
		debug(`${req.url} requested`);
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
		res.sendFile(req.url, {
			root: 'dist',
		});
	});
const server = createServer(app);
const io = createIoServer(server, {
	pingInterval: pingPong,
});

new Mesh(io);

// start server
server.listen(port);
