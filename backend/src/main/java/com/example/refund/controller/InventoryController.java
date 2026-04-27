package com.example.refund.controller;

import com.example.refund.dto.ApiResponse;
import com.example.refund.dto.InventoryCheckRequest;
import com.example.refund.util.TestFailureUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Slf4j
@RestController
@RequestMapping("/api/refund")
@CrossOrigin(origins = "*")
public class InventoryController {

    private final Random random = new Random();
    private static final String STEP_NAME = "inventory";

    @PostMapping("/check-inventory")
    public ApiResponse<Map<String, Object>> checkInventory(@Validated @RequestBody InventoryCheckRequest request) {
        log.info("Checking inventory for order: {}, sku: {}, quantity: {}", 
                request.getOrderId(), request.getSku(), request.getQuantity());
        
        try {
            Thread.sleep(500 + random.nextInt(500));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        if (TestFailureUtils.shouldFailAtStep(STEP_NAME)) {
            String errorMsg = TestFailureUtils.getFailureMessage(STEP_NAME);
            log.warn("Simulating failure at {} step: {}", STEP_NAME, errorMsg);
            return ApiResponse.error(500, errorMsg);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("orderId", request.getOrderId());
        result.put("sku", request.getSku());
        result.put("quantity", request.getQuantity());
        result.put("available", true);
        result.put("message", "Inventory check passed");
        
        log.info("Inventory check completed for order: {}", request.getOrderId());
        return ApiResponse.success(result);
    }
}
