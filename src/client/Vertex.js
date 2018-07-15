import createIoClient from 'socket.io-client';
import SimplePeer from 'simple-peer';
import {
	EventEmitter
} from 'events';
import createDebug from 'debug';

const debug = createDebug('web-rtc-mesh:vertex');

export const JOIN = 'vertex:join';
export const DATA = 'vertex:data';
export const CLOSE = 'vertex:close';

export default class Vertex extends EventEmitter {
	constructor({
		host,
		room,
		userId,
	}) {
		super();
		this.peers = {};
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
			debug('joined', {
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
			this.emit(JOIN);
		});

		window.addEventListener('beforeunload', () => {
			this.disconnect();
		});
	}

	setDebug(debug = false){
		localStorage.debug = localStorage.debug || '';
		localStorage.debug = localStorage.debug.replace(/web-rtc-mesh:\*/, '');
		if(debug){
			localStorage.debug += ' web-rtc-mesh:*';
		}
	}

	disconnect() {
		Object.values(this.peers)
			.forEach(({
				connection
			}) => connection.destroy());
		this.signaller.disconnect();
	}

	// send to one
	send(id, message) {
		debug('send', id, message);
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
		debug('broadcast', message);
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
			const data = {
				from: id,
				data: JSON.parse(dataRaw),
			};
			debug('data', data);
			this.emit(DATA, data);
		});
		connection.on('error', error => {
			const data = {
				error,
				id,
			};
			debug('error', data);
			connection.destroy();
			delete this.peers[id];
			this.emit(CLOSE, data);
		});
		connection.on('close', () => {
			const data = {
				id,
			};
			debug('close', data);
			connection.destroy();
			delete this.peers[id];
			this.emit(CLOSE, data);
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
