package com.crdt.collaborativedocs.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.crdt.collaborativedocs.handler.DocumentWebSocketHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final DocumentWebSocketHandler documentWebSocketHandler;

    public WebSocketConfig(DocumentWebSocketHandler documentWebSocketHandler) {
        this.documentWebSocketHandler = documentWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(documentWebSocketHandler, "/ws/document")
                .setAllowedOrigins("*");
    }
}
