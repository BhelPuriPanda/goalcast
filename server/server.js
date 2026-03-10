import express from "express";
import http from 'http'
import matchRouter from "./src/routes/matches.js";
import { attachWebSocketSever } from "./src/ws/ws-server.js";
import { securityMiddleware } from "./src/arcjet.js";

const app = express();
const server = http.createServer(app)

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.json());
app.use(securityMiddleware())

app.use("/matches", matchRouter);

const { broadcastMatchCreated } = attachWebSocketSever(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

server.listen(PORT,HOST, () => {
    const baseURL = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
    console.log(`Server is running at ${baseURL}`);
    console.log(`WebSocket Server is running at ${baseURL.replace('http','ws')}/ws`);
});
