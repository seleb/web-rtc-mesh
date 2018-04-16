const { Server } = require("ws");
const { peerConnectionConfig, pingPong } = require("./config");

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
				if (event.data === "ping") {
					console.log("PING");
					return;
				}

				console.log("message", event.data);
				const signal = JSON.parse(event.data);
				if (signal.connect) {
					console.log("connect", id);
					Array.from(this.ws.clients)
						.filter(client => client !== socket) // don't connect to self
						.filter(client => client.readyState === 1)
						.forEach(peer => {
							const peerId = this.socketToId.get(peer);

							const connection = `${id}->${peerId}`;
							console.log(connection);
							peer.send(JSON.stringify({ connection, receive: id }));
							socket.send(JSON.stringify({ connection, call: peerId }));
						});
				} else {
					console.log("routing message", signal);
					signal.from = id;
					const peer = this.idToSocket.get(signal.to);
					peer && peer.readyState === 1 && peer.send(JSON.stringify(signal));
				}
			};

			socket.onclose = () => {
				console.log("disconnected socket");
				this.idToSocket.delete(id);
				this.socketToId.delete(socket);
			};
		});


		setInterval(() => {
			Array.from(this.ws.clients)
				.filter(client => client.readyState === 1)
				.forEach(client => client.send("ping"));
		}, pingPong);

		console.log("Server started on", this.ws.address());
	}

};
