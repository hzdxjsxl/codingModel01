package com.workflow.dto;

import com.workflow.entity.WorkflowEdge;
import com.workflow.entity.WorkflowNode;
import lombok.Data;

import java.util.List;

@Data
public class WorkflowData {
    private List<WorkflowNode> nodes;
    private List<WorkflowEdge> edges;
}
