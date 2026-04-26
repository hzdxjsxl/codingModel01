package com.finance.controller;

import com.finance.entity.FinancialRecord;
import com.finance.repository.FinancialRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/finance")
@CrossOrigin(origins = "http://localhost:3000")
public class FinancialController {

    @Autowired
    private FinancialRecordRepository recordRepository;

    @GetMapping("/records")
    public List<FinancialRecord> getAllRecords() {
        return recordRepository.findAll();
    }

    @GetMapping("/records/count")
    public long getRecordCount() {
        return recordRepository.count();
    }
}
