package com.example.refund.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
public class CouponRequest {
    @NotBlank(message = "orderId cannot be blank")
    private String orderId;
    @NotBlank(message = "couponId cannot be blank")
    private String couponId;
}
