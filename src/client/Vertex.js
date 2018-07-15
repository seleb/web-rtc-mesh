import createIoClient from 'socket.io-client';
import SimplePeer from 'simple-peer';
import {
	EventEmitter
} from 'events';

export const JOINED = 'vertex:joined';
export const DATA = 'vertex:data';

export default class Vertex extends EventEmitter {
	constructor({
		host,
		room,
		userId,
	}) {
		super();
		this.signaller = createIoClient(host);
		this.signaller.on('data', signal => {
			this.onSignal(signal);
		});
		this.signaller.on('connect', () => {
			this.signaller.emit('join', {
				room,
				userId,
			});
		});
		this.signaller.on('joined', ({
			peerConnectionConfig,
			connections
		}) => {
			console.log('joined', {
				peerConnectionConfig,
				connections
			});
			this.peerConnectionConfig = peerConnectionConfig;

			connections.forEach(id => {
				const peer = this.setupPeer({
					id,
					initiator: true,
				});
			});
			this.emit(JOINED);
		});

		this.peers = {};
	}

	// send to one
	send(id, message) {
		const {
			peers: {
				[id]: {
					connection,
				} = {},
			} = {},
		} = this;
		if (connection) {
			const str = JSON.stringify(message);
			connection.send(str);
		}
	}

	// send to all
	broadcast(message) {
		const str = JSON.stringify(message);
		Object.values(this.peers)
			.forEach(({
				connection
			}) => {
				connection.send(str);
			});
	}

	setupPeer({
		id,
		initiator = false,
	}) {
		const connection = new SimplePeer({
			initiator,
			config: this.peerConnectionConfig,
			objectMode: true,
		});
		const peer = {
			connection,
			id,
		};
		connection.on('signal', data => {
			this.signaller.emit('dm', {
				id,
				data,
			});
		});
		connection.on('data', dataRaw => {
			const data = JSON.parse(dataRaw);
			console.log('data', data);
			this.emit(DATA, {
				from: id,
				data,
			});
		});
		connection.on('error', error => {
			console.error(error);
			connection.destroy();
			delete this.peers[id];
		});
		connection.on('close', () => {
			connection.destroy();
			delete this.peers[id];
		});

		this.peers[id] = peer;
		return peer;
	}

	onSignal({
		data,
		from,
	}) {
		if (!data || !from) {
			throw new Error('recieved invalid signal');
		}
		let peer = this.peers[from];

		// create receiver peer if it doesn't exist
		if (!peer) {
			peer = this.setupPeer({
				id: from,
			});
		}

		peer.connection.signal(data);
	}
}
