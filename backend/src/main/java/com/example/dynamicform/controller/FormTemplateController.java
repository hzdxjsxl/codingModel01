package com.example.dynamicform.controller;

import com.example.dynamicform.entity.FormTemplate;
import com.example.dynamicform.repository.FormTemplateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/form-templates")
@CrossOrigin(origins = "*")
public class FormTemplateController {
    
    @Autowired
    private FormTemplateRepository formTemplateRepository;
    
    @GetMapping("/{id}")
    public ResponseEntity<String> getFormTemplate(@PathVariable Long id) {
        Optional<FormTemplate> template = formTemplateRepository.findById(id);
        if (template.isPresent()) {
            return ResponseEntity.ok(template.get().getSchemaJson());
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PostMapping
    public ResponseEntity<FormTemplate> createFormTemplate(@RequestBody String schemaJson) {
        FormTemplate template = new FormTemplate();
        template.setSchemaJson(schemaJson);
        FormTemplate saved = formTemplateRepository.save(template);
        return ResponseEntity.ok(saved);
    }
}
