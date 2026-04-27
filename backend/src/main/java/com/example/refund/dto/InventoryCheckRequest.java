package com.example.refund.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
public class InventoryCheckRequest {
    @NotBlank(message = "orderId cannot be blank")
    private String orderId;
    @NotBlank(message = "sku cannot be blank")
    private String sku;
    private int quantity;
}
