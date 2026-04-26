package com.workflow.repository;

import com.workflow.entity.WorkflowNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkflowNodeRepository extends JpaRepository<WorkflowNode, Long> {
}
