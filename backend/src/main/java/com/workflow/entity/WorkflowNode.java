package com.workflow.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "workflow_nodes")
public class WorkflowNode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private String nodeType;
}
