import {
	peerConnectionConfig
} from './config';
import createDebug from 'debug';

const debug = createDebug('web-rtc-mesh:mesh');

export default class Mesh {
	constructor(io) {
		io.on('connection', socket => {

			socket.on('join', ({
				room,
				userId
			}) => {
				debug('join', {
					id: socket.id,
					room,
					userId,
				});
				socket.join(room, () => {
					// construct a list of existing connections in room
					const {
						sockets
					} = io.sockets.adapter.rooms[room];
					const connections = Object.entries(sockets)
						.filter(([id, connected]) => id !== socket.id && connected)
						.map(([id]) => id);

					// send ice servers and existing connections in room
					socket.emit('joined', {
						peerConnectionConfig,
						connections,
					});
				});
			});

			socket.on('dm', ({
				id,
				data
			}) => {
				debug('dm', {
					id,
					data,
				});
				socket.broadcast.to(id).emit('data', {
					from: socket.id,
					data,
				});
			});

			socket.on('data', data => {
				debug('data', {
					data
				});

				socket.broadcast.emit('data', {
					from: socket.id,
					data,
				});
			});
		});
	}
}
