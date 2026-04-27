package com.example.refund.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
public class OrderStatusRequest {
    @NotBlank(message = "orderId cannot be blank")
    private String orderId;
    @NotNull(message = "status cannot be null")
    private Integer status;
    private String reason;
}
