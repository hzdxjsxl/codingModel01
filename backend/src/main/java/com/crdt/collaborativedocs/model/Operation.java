package com.crdt.collaborativedocs.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class Operation {
    
    @JsonProperty("type")
    private String type;
    
    @JsonProperty("position")
    private Integer position;
    
    @JsonProperty("char")
    private String character;
    
    @JsonProperty("length")
    private Integer length;
    
    @JsonProperty("id")
    private String id;
}
