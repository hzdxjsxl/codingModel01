package com.example.refund.util;

import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;

public class TestFailureUtils {

    public static final String FAIL_AT_STEP_HEADER = "X-Test-Fail-At-Step";

    public static boolean shouldFailAtStep(String stepName) {
        HttpServletRequest request = getCurrentRequest();
        if (request == null) {
            return false;
        }
        
        String failAtStep = request.getHeader(FAIL_AT_STEP_HEADER);
        if (failAtStep == null || failAtStep.isEmpty()) {
            return false;
        }
        
        return stepName.equalsIgnoreCase(failAtStep);
    }

    public static String getFailureMessage(String stepName) {
        switch (stepName.toLowerCase()) {
            case "inventory":
                return "模拟失败：库存不足";
            case "coupon":
                return "模拟失败：优惠券作废失败";
            case "refund":
                return "模拟失败：微信渠道退款失败";
            case "order":
                return "模拟失败：订单状态更新失败";
            default:
                return "模拟失败：未知错误";
        }
    }

    private static HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return null;
        }
        return attributes.getRequest();
    }
}
