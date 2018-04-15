const { Server } = require("ws");
const { peerConnectionConfig } = require("./config");

module.exports = class Mesh {
	constructor(server) {
		this.idToSocket = new Map();
		this.socketToId = new Map();
		this.ws = new Server({ server });

		this.ws.on("connection", socket => {
			console.log("connected socket");
			const id = `${Date.now()}_${Math.random()}`; // ¯\_(ツ)_/¯
			this.idToSocket.set(id, socket);
			this.socketToId.set(socket, id);
			socket.send(JSON.stringify({ registered: id, peerConnectionConfig }));

			socket.onmessage = event => {
				console.log("message ", event.data);
				if (JSON.parse(event.data).connect) {
					console.log("connect", id);
					socket.onmessage = message => this.routeMessage(message);

					console.log("connecting sockets");
					Array.from(this.ws.clients)
						.filter(client => client !== event.target) // don't connect to self
						.filter(client => client.readyState === 1)
						.forEach(peer => {
							const peerId = this.socketToId.get(peer);

							const connection = `${id}->${peerId}`;
							console.log(connection);
							peer.send(JSON.stringify({ connection, receive: id }));
							event.target.send(JSON.stringify({ connection, call: peerId }));
						});
				}
			};

			socket.onclose = () => {
				console.log("disconnected socket");
				this.idToSocket.delete(id);
				this.socketToId.delete(socket);
			};
		});

		console.log("Server started on", this.ws.address());
	}

	routeMessage(event) {
		console.log("message ", event.data);
		const signal = JSON.parse(event.data);
		signal.from = this.socketToId.get(event.target);
		const socket = this.idToSocket.get(signal.to);
		socket && socket.readyState === 1 && socket.send(JSON.stringify(signal));
	}

};
