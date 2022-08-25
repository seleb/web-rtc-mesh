# web-rtc-mesh

Signalling server + client for creating P2P data connections

## setup

Environment variables:

- `PORT`: server port to use
- `NUMB_USERNAME`/`NUMB_CREDENTIAL`: username/password for a `turn:numb.viagenie.ca` account (if there aren't both defined, only the public stun servers will be used)
- `NODE_ENV`: `"production"` or `"development"`; passed to webpack
- `PINGPONG`: delay in milliseconds between pings for the sake of keeping connections alive

You can also edit `./src/config.js`.

## use

```sh
npm run start
```

This will builds the client to `./dist/client.js` and start the signalling server.

## example

```js
<script src="https://<server_url>/client.js"></script>
<script>
	const client = new window.Client.default({
		host: "wss://<server_url>",
		room: "myRoom",
	});
	client.on(window.Client.DATA, ({ from, data }) => {
		console.log("received",data,"from",from);
	});
	client.broadcast({
		key: "value"
	}); // send a data channel message to all connected vertices
</script>
```
