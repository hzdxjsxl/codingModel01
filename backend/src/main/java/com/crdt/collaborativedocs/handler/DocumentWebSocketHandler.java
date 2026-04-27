package com.crdt.collaborativedocs.handler;

import com.crdt.collaborativedocs.model.OperationMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class DocumentWebSocketHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(DocumentWebSocketHandler.class);
    
    private final Set<WebSocketSession> sessions = Collections.newSetFromMap(new ConcurrentHashMap<>());
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        logger.info("New client connected: {}", session.getId());
        logger.info("Total clients: {}", sessions.size());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session);
        logger.info("Client disconnected: {}", session.getId());
        logger.info("Total clients: {}", sessions.size());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        logger.info("Received message from client {}: {}", session.getId(), payload);
        
        try {
            OperationMessage opMessage = objectMapper.readValue(payload, OperationMessage.class);
            
            if ("operation".equals(opMessage.getType())) {
                broadcastOperation(payload, session);
            } else if ("sync-request".equals(opMessage.getType())) {
                // For sync requests, we could implement document state sync
                // For now, just acknowledge
                sendMessage(session, "{\"type\":\"sync-response\",\"status\":\"ok\"}");
            } else if ("join".equals(opMessage.getType())) {
                sendMessage(session, "{\"type\":\"welcome\",\"clientId\":\"" + opMessage.getClientId() + "\"}");
            }
        } catch (Exception e) {
            logger.error("Error processing message: {}", e.getMessage(), e);
            sendMessage(session, "{\"type\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }

    private void broadcastOperation(String message, WebSocketSession senderSession) {
        logger.info("Broadcasting operation to {} clients", sessions.size() - 1);
        
        for (WebSocketSession session : sessions) {
            if (session.isOpen() && !session.equals(senderSession)) {
                try {
                    sendMessage(session, message);
                    logger.info("Broadcast to client: {}", session.getId());
                } catch (Exception e) {
                    logger.error("Failed to broadcast to client {}: {}", session.getId(), e.getMessage());
                }
            }
        }
    }

    private void sendMessage(WebSocketSession session, String message) throws IOException {
        synchronized (session) {
            session.sendMessage(new TextMessage(message));
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        logger.error("Transport error for client {}: {}", session.getId(), exception.getMessage());
        sessions.remove(session);
    }
}
