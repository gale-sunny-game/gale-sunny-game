# Gale & Sunny Co-op Quest (Prototype)
This is a playable 2-phone co-op web game prototype with:
- Room code join via WebSocket
- Mobile joystick + buttons
- 10 handcrafted-ish levels (tilemaps)
- Abilities (Gale: dash + earth pillar, Sunny: water cleanse + fire melt)
- Light/Dark relic pickups that affect gates
- A simple 'clash' phase after each level

## Important
After deploying the WebSocket server, update `game.js`:
Replace `wss://gale-sunny-game.onrender.com` with your Render URL, using `wss://`.

## Local test
- `npm install`
- `npm start`
- Serve the website locally (e.g. VS Code Live Server) and set WS_URL to `ws://localhost:8080`.
