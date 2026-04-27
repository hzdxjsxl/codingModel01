package com.example.refund.controller;

import com.example.refund.dto.ApiResponse;
import com.example.refund.dto.CouponRequest;
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
public class CouponController {

    private final Random random = new Random();
    private static final String STEP_NAME = "coupon";

    @PostMapping("/cancel-coupon")
    public ApiResponse<Map<String, Object>> cancelCoupon(@Validated @RequestBody CouponRequest request) {
        log.info("Cancelling coupon for order: {}, couponId: {}", 
                request.getOrderId(), request.getCouponId());
        
        try {
            Thread.sleep(300 + random.nextInt(300));
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
        result.put("couponId", request.getCouponId());
        result.put("cancelled", true);
        result.put("message", "Coupon cancelled successfully");
        
        log.info("Coupon cancelled for order: {}", request.getOrderId());
        return ApiResponse.success(result);
    }

    @PostMapping("/restore-coupon")
    public ApiResponse<Map<String, Object>> restoreCoupon(@Validated @RequestBody CouponRequest request) {
        log.info("Restoring coupon for order: {}, couponId: {}", 
                request.getOrderId(), request.getCouponId());
        
        try {
            Thread.sleep(200 + random.nextInt(200));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("orderId", request.getOrderId());
        result.put("couponId", request.getCouponId());
        result.put("restored", true);
        result.put("message", "Coupon restored successfully");
        
        log.info("Coupon restored for order: {}", request.getOrderId());
        return ApiResponse.success(result);
    }
}
