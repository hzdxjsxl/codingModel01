package com.example.dynamicform.entity;

import javax.persistence.*;

@Entity
@Table(name = "form_templates")
public class FormTemplate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "schema_json", columnDefinition = "TEXT")
    private String schemaJson;
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getSchemaJson() {
        return schemaJson;
    }
    
    public void setSchemaJson(String schemaJson) {
        this.schemaJson = schemaJson;
    }
}
