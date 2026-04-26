package com.workflow.controller;

import com.workflow.dto.WorkflowData;
import com.workflow.service.WorkflowService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workflow")
public class WorkflowController {

    private final WorkflowService workflowService;

    public WorkflowController(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @GetMapping
    public ResponseEntity<WorkflowData> getWorkflow() {
        return ResponseEntity.ok(workflowService.getWorkflow());
    }

    @PostMapping
    public ResponseEntity<WorkflowData> saveWorkflow(@RequestBody WorkflowData data) {
        return ResponseEntity.ok(workflowService.saveWorkflow(data));
    }
}
