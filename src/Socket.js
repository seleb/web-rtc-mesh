export default class Socket {
	constructor({ host, onSocketMessage }) {
		this.socketConnection = new WebSocket(host);
		this.socketConnection.addEventListener("error", onSocketConnectionError);
		this.socketConnection.addEventListener("open", connection => {
			console.log("Opened socket connection", connection);
			this.send({ start: true });
		});
		this.socketConnection.addEventListener("message", onSocketConnectionMessage);
		this.socketConnection.addEventListener("message", onSocketMessage);

	}

	send(obj) {
		console.log("sending", obj);
		this.socketConnection.send(JSON.stringify(obj));
	}
}

function onSocketConnectionError(connection) {
	console.error("Errored socket connection", connection);
}
function onSocketConnectionMessage(message) {
	console.log("Got socket message", message);
}
