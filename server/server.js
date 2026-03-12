import AgentAPI from "apminsight";
AgentAPI.config()

import express from "express";
import http from 'http'
import matchRouter from "./src/routes/matches.js";
import { commentaryRouter } from "./src/routes/commentary.js";
import { attachWebSocketSever } from "./src/ws/ws-server.js";
import { securityMiddleware } from "./src/arcjet.js";

const app = express();
const server = http.createServer(app)

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

// Trust the reverse proxy (Render) to get the real client IP for Arcjet
app.set("trust proxy", 1);

app.use(express.json());
//app.use(securityMiddleware())

app.use("/matches", matchRouter);
app.use("/matches/:id/commentary", commentaryRouter);

const { broadcastMatchCreated, broadcastCommentaryAdded } = attachWebSocketSever(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentaryAdded = broadcastCommentaryAdded;

server.listen(PORT,HOST, () => {
    const baseURL = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
    console.log(`Server is running at ${baseURL}`);
    console.log(`WebSocket Server is running at ${baseURL.replace('http','ws')}/ws`);
});
