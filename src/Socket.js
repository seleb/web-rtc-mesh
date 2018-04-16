export default class Socket {
	constructor({ host, onSocketMessage }) {
		this.socketConnection = new WebSocket(host);
		this.socketConnection.addEventListener("error", onSocketConnectionError);
		this.socketConnection.addEventListener("open", connection => {
			console.log("Opened socket connection", connection);
			this.send({ start: true });
			this.socketConnection.send("ping");
		});
		this.socketConnection.addEventListener("message", event => {
			if (event.data === "ping") {
				console.log("PING");
				this.socketConnection.send("pong");
				return;
			}
			console.log("Got socket message", event);
			onSocketMessage(event);
		});
	}

	send(obj) {
		console.log("sending", obj);
		this.socketConnection.send(JSON.stringify(obj));
	}
}

function onSocketConnectionError(connection) {
	console.error("Errored socket connection", connection);
}
