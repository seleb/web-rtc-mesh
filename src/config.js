const iceServers = [
	{ urls: "stun:stun.l.google.com:19302" },
	{ urls: "stun:stun.services.mozilla.com" },
	{ urls: "stun:stun.stunprotocol.org:3478" }
];
if (process.env.NUMB_USERNAME && process.env.NUMB_CREDENTIAL) {
	iceServers.push({
		urls: "turn:numb.viagenie.ca",
		username: process.env.NUMB_USERNAME,
		credential: process.env.NUMB_CREDENTIAL
	});
}

module.exports = {
	peerConnectionConfig: {
		iceServers
	},
	port: process.env.PORT || 8080
};
