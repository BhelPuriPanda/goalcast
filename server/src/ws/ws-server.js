import WebSocket, { WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

const matchSubscribers = new Map();

function subscribeToMatch(matchId, socket) {
    if (!matchSubscribers.has(matchId)) {
        matchSubscribers.set(matchId, new Set());
    }
    matchSubscribers.get(matchId).add(socket);
}

function unsubscribeFromMatch(matchId, socket) {
    const subscribers = matchSubscribers.get(matchId);
    if(!subscribers) return;
    subscribers.delete(socket);
    if(subscribers.size === 0){
        matchSubscribers.delete(matchId);
    }
}

function cleanupSubscriptions(socket){
    for(const matchId of socket.subscriptions){
        unsubscribeFromMatch(matchId,socket);
    }
}

function broadcastToMatch(matchId,payload){
    const subscribers = matchSubscribers.get(matchId);
    if(!subscribers) return;
    
    const message = JSON.stringify(payload);

    for(const socket of subscribers){
        if(socket.readyState === WebSocket.OPEN){
            socket.send(message);
        }
    }
}

function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));

}

function broadcastToAll(wss, payload) {
    for (const client of wss.clients) {
        if(client.readyState !== WebSocket.OPEN) continue;

        client.send(JSON.stringify(payload));
    }
}

function handleMessage(socket,data){
    let message;

    try{
        message = JSON.parse(data.toString());
    }catch{
        sendJson(socket,{type:'error',message:'Invalid JSON'})
        return;
    }

    if(message.type === "subscribe" && Number.isInteger(message.matchId)){ 
        subscribeToMatch(message.matchId,socket);
        socket.subscriptions.add(message.matchId);
        sendJson(socket,{type:'subscribed',matchId:message.matchId});
    }

    if(message.type === "unsubscribe" && Number.isInteger(message.matchId)){ 
        unsubscribeFromMatch(message.matchId,socket);
        socket.subscriptions.delete(message.matchId);
        sendJson(socket,{type:'unsubscribed',matchId:message.matchId});
    }
}

export function attachWebSocketSever(server,socket) {
    const wss = new WebSocketServer({server,path : '/ws',maxPayload : 1024 * 1024})

    wss.on('connection', async (socket,req) => {

        if(wsArcjet){
            try{
                const decision = await wsArcjet.protect(req);

                if(decision.isDenied()){
                    const code = decision.reason.isRateLimit ? 1013 : 1008;
                    const reason = decision.reason.isRateLimit ? 'Rate Limit Exceeded' : 'Access Denied';

                    socket.close(code,reason);
                    return;
                }

            }catch(err){
                console.error(err);
                socket.close(1011,'Server Secuirity Error')
                return;
            }
        }

        socket.isAlive = true;
        socket.on('pong',()=>socket.isAlive=true)

        socket.subscriptions = new Set();
        sendJson(socket, {type : 'welcome'})

        socket.on('message',data => handleMessage(socket,data));

        socket.on('error',socket.terminate);
        socket.on('close',()=>cleanupSubscriptions(socket));
    })

    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) return ws.terminate();

            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on('close', () => clearInterval(interval));
    

    function broadcastMatchCreated(match){
        broadcast(wss , {type:'match-created',data:match});
    }

    function broadcastCommentaryAdded(commentary){
        broadcastToMatch(commentary.matchId, {type:'commentary-added',data:commentary});
    }

    return {broadcastMatchCreated,broadcastCommentaryAdded};
}