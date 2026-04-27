package com.example.refund.controller;

import com.example.refund.dto.ApiResponse;
import com.example.refund.dto.OrderStatusRequest;
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
public class OrderStatusController {

    private final Random random = new Random();

    @PostMapping("/update-order-status")
    public ApiResponse<Map<String, Object>> updateOrderStatus(@Validated @RequestBody OrderStatusRequest request) {
        log.info("Updating order status for order: {}, status: {}, reason: {}", 
                request.getOrderId(), request.getStatus(), request.getReason());
        
        try {
            Thread.sleep(200 + random.nextInt(200));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("orderId", request.getOrderId());
        result.put("oldStatus", 1);
        result.put("newStatus", request.getStatus());
        result.put("updated", true);
        result.put("message", "Order status updated successfully");
        
        log.info("Order status updated for order: {}, new status: {}", 
                request.getOrderId(), request.getStatus());
        return ApiResponse.success(result);
    }
}
