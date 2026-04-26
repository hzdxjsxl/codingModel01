package com.workflow.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "workflow_edges")
public class WorkflowEdge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_id", nullable = false)
    private Long sourceId;

    @Column(name = "target_id", nullable = false)
    private Long targetId;
}
