package com.crdt.collaborativedocs.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class OperationMessage {
    
    @JsonProperty("type")
    private String type;
    
    @JsonProperty("clientId")
    private String clientId;
    
    @JsonProperty("operation")
    private Operation operation;
    
    @JsonProperty("vectorClock")
    private Map<String, Integer> vectorClock;
    
    @JsonProperty("timestamp")
    private Long timestamp;
}
