package com.workflow.service;

import com.workflow.dto.WorkflowData;
import com.workflow.entity.WorkflowEdge;
import com.workflow.entity.WorkflowNode;
import com.workflow.repository.WorkflowEdgeRepository;
import com.workflow.repository.WorkflowNodeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WorkflowService {

    private final WorkflowNodeRepository nodeRepository;
    private final WorkflowEdgeRepository edgeRepository;

    public WorkflowService(WorkflowNodeRepository nodeRepository, WorkflowEdgeRepository edgeRepository) {
        this.nodeRepository = nodeRepository;
        this.edgeRepository = edgeRepository;
    }

    public WorkflowData getWorkflow() {
        List<WorkflowNode> nodes = nodeRepository.findAll();
        List<WorkflowEdge> edges = edgeRepository.findAll();

        WorkflowData data = new WorkflowData();
        data.setNodes(nodes);
        data.setEdges(edges);
        return data;
    }

    @Transactional
    public WorkflowData saveWorkflow(WorkflowData data) {
        edgeRepository.deleteAll();
        nodeRepository.deleteAll();

        List<WorkflowNode> savedNodes = nodeRepository.saveAll(data.getNodes());
        List<WorkflowEdge> savedEdges = edgeRepository.saveAll(data.getEdges());

        WorkflowData result = new WorkflowData();
        result.setNodes(savedNodes);
        result.setEdges(savedEdges);
        return result;
    }
}
