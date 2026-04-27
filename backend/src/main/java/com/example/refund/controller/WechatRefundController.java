package com.example.refund.controller;

import com.example.refund.dto.ApiResponse;
import com.example.refund.dto.WechatRefundRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/refund")
@CrossOrigin(origins = "*")
public class WechatRefundController {

    private final Random random = new Random();

    @PostMapping("/wechat-refund")
    public ApiResponse<Map<String, Object>> wechatRefund(@Validated @RequestBody WechatRefundRequest request) {
        log.info("Initiating wechat refund for order: {}, transactionId: {}, refundAmount: {}", 
                request.getOrderId(), request.getTransactionId(), request.getRefundAmount());
        
        try {
            Thread.sleep(1000 + random.nextInt(1000));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("orderId", request.getOrderId());
        result.put("transactionId", request.getTransactionId());
        result.put("refundId", "RF" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        result.put("refundAmount", request.getRefundAmount());
        result.put("status", "SUCCESS");
        result.put("message", "Wechat refund initiated successfully");
        
        log.info("Wechat refund completed for order: {}, refundId: {}", 
                request.getOrderId(), result.get("refundId"));
        return ApiResponse.success(result);
    }
}
