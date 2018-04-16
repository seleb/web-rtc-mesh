import Socket from "./Socket";

export default class Vertex {
	constructor({ host, onData, onClose }) {
		this.onDataChannelMessage = onData;
		this.onDataChannelClose = onClose;
		this.meshSocket = new Socket({
			host,
			onSocketMessage: message => this.onSocketMessage(message)
		});

		this.peers = {};
	}

	// send to one
	send(id, message) {
		const peer = this.peers[id];
		if (peer && peer.dataChannel && peer.dataChannel.readyState === "open") {
			const str = typeof message === "string" ? message : JSON.stringify(message);
			peer.dataChannel.send(str);
		}
	}

	// send to all
	broadcast(message) {
		const str = typeof message === "string" ? message : JSON.stringify(message);
		Object.values(this.peers)
			.forEach(peer => {
				if (peer.dataChannel && peer.dataChannel.readyState === "open") {
					peer.dataChannel.send(str);
				}
			});
	}

	setupPeer(id) {
		const connection = new RTCPeerConnection(this.peerConnectionConfig);
		const peer = { connection, id };
		connection.onicecandidate = ({ candidate }) => {
			if (!candidate) {
				console.warn("couldn't get ice candidate");
				return;
			}
			console.log("sending ice candidate", candidate);
			this.meshSocket.send({ to: id, ice: candidate });
		};
		connection.oniceconnectionstatechange = onIceConnectionStateChange;

		this.peers[id] = peer;
		return peer;
	}

	setupDataChannel(channel) {
		channel.onopen = dataChannelOnOpen;
		channel.onmessage = this.onDataChannelMessage;
		channel.onclose = this.onDataChannelClose;
		return channel;
	}

	offer(peer) {
		const sdpConstraints = {};

		peer.connection
			.createOffer(sdpConstraints)
			.then(offer => {
				console.log("sending offer");
				peer.connection.setLocalDescription(offer);
				this.meshSocket.send({ to: peer.id, sdp: offer });
			});
	}

	onSocketMessage({ data }) {
		const signal = JSON.parse(data);

		if (signal.registered) {
			this.id = signal.registered;
			this.peerConnectionConfig = signal.peerConnectionConfig;
			this.meshSocket.send({ connect: true });
		} else if (signal.call) {
			// setup + initiate a connection
			const peer = this.setupPeer(signal.call);
			peer.type = "caller";
			peer.dataChannel = this.setupDataChannel(peer.connection.createDataChannel("data", null));
			this.offer(peer);
		} else if (signal.receive) {
			// setup + listen for a connection
			const peer = this.setupPeer(signal.receive);
			peer.type = "receiver";
			peer.connection.ondatachannel = ({ channel }) => peer.dataChannel = this.setupDataChannel(channel);
		} else if (signal.from) {
			const peer = this.peers[signal.from];
			if (signal.sdp) {
				peer.connection
					.setRemoteDescription(new RTCSessionDescription(signal.sdp))
					.then(() => {
						if (signal.sdp.type === "offer") {
							console.log("got offer");
							peer.connection
								.createAnswer()
								.then(answer => {
									console.log("sending answer");
									peer.connection.setLocalDescription(answer);
									this.meshSocket.send({ to: peer.id, sdp: answer });
								});
						} else if (signal.sdp.type === "answer") {
							console.log("got answer");
						} else {
							console.warn("unrecognized sdp message");
						}
					});
			} else if (signal.ice) {
				console.log("adding ice candidate", signal.ice);
				peer.connection
					.addIceCandidate(new RTCIceCandidate(signal.ice))
					.catch(error => {
						console.error("add ice candidate error:", error);
					});
			}
		}
	}
}

function dataChannelOnOpen(event) {
	console.log("data channel opened", event);
}

function onIceConnectionStateChange(event) {
	console.log(event);
	if (event.target.iceConnectionState === "failed") {
		console.error("ice connection failed");
	}
}
