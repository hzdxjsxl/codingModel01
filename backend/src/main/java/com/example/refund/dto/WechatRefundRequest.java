package com.example.refund.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
public class WechatRefundRequest {
    @NotBlank(message = "orderId cannot be blank")
    private String orderId;
    @NotBlank(message = "transactionId cannot be blank")
    private String transactionId;
    @NotNull(message = "refundAmount cannot be null")
    private BigDecimal refundAmount;
    @NotNull(message = "totalAmount cannot be null")
    private BigDecimal totalAmount;
}
