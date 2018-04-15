# web-rtc-mesh

Signalling server + client for creating P2P data connections

## setup

Environment variables:

- `PORT`: server port to use
- `NUMB_USERNAME`/`NUMB_CREDENTIAL`: username/password for a `turn:numb.viagenie.ca` account (if there aren't both defined, only the public stun servers will be used)
- `NODE_ENV`: `"production"` or `"development"`; passed to webpack

You can also edit `./src/config.js`.

## use

- `yarn build`: Builds the client to `./dist/Vertex.js`.
- `yarn start`: Starts the signalling server.

## example

```js
<script src="https://<server_url>/Vertex.js"></script>
<script>
	const vertex = new window.Vertex.default({
		host: "wss://<server_url>",
		onDate: event => {
			// received a data channel message in `event.data`
		}
	}
	);
	vertex.broadcast({
		key: "value"
	}); // send a data channel message to all connected vertices
</script>
```
