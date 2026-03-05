# Meet Signaling Usage Guide

This project now includes a **2-person Socket.IO signaling server** for WebRTC calls.

## 1) What this "meet" part does

The signaling server helps two clients exchange WebRTC handshake data:

- SDP **offer**
- SDP **answer**
- ICE **candidates**

It does **not** carry video/audio itself. Media still flows peer-to-peer via WebRTC.

---

## 2) Server prerequisites

The signaling logic is already integrated into `src/app.js`.

Required backend dependencies:

- `express`
- `cors`
- `dotenv`
- `socket.io`

> If dependency installation is blocked in your environment, install from a network-enabled environment and redeploy.

---

## 3) Start the backend

```bash
npm run dev
```

By default it starts on:

- `http://0.0.0.0:3001`

Optional env var for signaling CORS policy:

- `SIGNALING_CORS_ORIGIN` (default: `*`)

Example:

```bash
SIGNALING_CORS_ORIGIN=https://your-frontend.com npm run dev
```

---

## 4) Room model (in-memory)

Each room is stored in memory as:

- `roomId` (key)
- `passcode` (string)
- `users` (array of socket IDs, max length = 2)

Behavior:

- First user creates the room with a passcode.
- Second user can join only if passcode matches.
- A third user gets `Room full`.
- If all users leave, room is deleted.

---

## 5) Socket events

### Client → Server: `join-room`

Payload:

```json
{ "roomId": "abc123", "passcode": "my-secret" }
```

Server logic:

- Creates room if missing.
- Validates passcode for existing room.
- Enforces max 2 users.

Possible server responses:

- `room-joined` → `{ roomId, role: "host" | "guest" }`
- `join-error` → `{ message }`
- `user-joined` (to existing host when guest arrives) → `{ roomId, userId }`

### Client → Server: `signal`

Payload:

```json
{
  "roomId": "abc123",
  "payload": {
    "type": "offer",
    "sdp": "..."
  }
}
```

- `payload` can be offer/answer/ice candidate data.
- Server forwards it to the other participant in the room.

Server emits to peer:

- `signal` → `{ from, payload }`

### Server-side on disconnect

When a socket disconnects:

- User is removed from the room.
- If room becomes empty, it is deleted.
- If one peer remains, server emits:
  - `peer-disconnected` → `{ userId }`

---

## 6) Frontend integration example (Next.js / browser)

Install client package:

```bash
npm install socket.io-client
```

Basic usage:

```ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
});

socket.on('connect', () => {
  socket.emit('join-room', {
    roomId: 'demo-room',
    passcode: '1234',
  });
});

socket.on('room-joined', ({ roomId, role }) => {
  console.log('Joined', roomId, 'as', role);
  // host waits for user-joined before creating offer
  // guest waits for signal offer
});

socket.on('user-joined', async () => {
  // host creates RTCPeerConnection offer
  // socket.emit('signal', { roomId, payload: { type: 'offer', sdp: ... } })
});

socket.on('signal', async ({ payload }) => {
  // handle offer / answer / ice-candidate in your RTCPeerConnection logic
});

socket.on('join-error', ({ message }) => {
  console.error('Join failed:', message);
});

socket.on('peer-disconnected', () => {
  console.log('Peer left room');
});
```

---

## 7) Recommended client flow

1. User enters `roomId` + `passcode`.
2. Emit `join-room`.
3. If role is `host`, wait for `user-joined` then create/send offer.
4. If role is `guest`, wait for incoming offer on `signal`, then respond with answer.
5. Both users exchange ICE candidates via `signal`.
6. On `peer-disconnected`, close/reset the local `RTCPeerConnection`.

---

## 8) Important limitations

- Room state is in memory only (lost on restart).
- Designed for **2 users max** per room.
- No persistent auth/user identity yet (socket ID only).

If you need production-grade scaling later, migrate room state to Redis and add authenticated user identity.
