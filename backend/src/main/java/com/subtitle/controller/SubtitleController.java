package com.subtitle.controller;

import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/subtitle")
@CrossOrigin(origins = "*")
public class SubtitleController {

    @GetMapping("/raw")
    public String getRawSrt() {
        return "1\n00:00:01,000 --> 00:00:04,000\n第一句字幕\n\n2\n00:00:05,000 --> 00:00:08,500\n第二句字幕\n多行内容\n\n3\n00:00:09,000 --> 00:00:12,000\n第三句字幕\n\n4\n00:00:13,000 --> 00:00:17,000\n第四句字幕\n包含特殊符号\n\n5\n00:00:18,000 --> 00:00:22,000\n最后一句字幕";
    }

    @PostMapping(value = "/save", consumes = "text/plain;charset=UTF-8")
    public String saveSubtitle(@RequestBody byte[] srtData) {
        String srtText = new String(srtData, StandardCharsets.UTF_8);
        System.out.println("========================================");
        System.out.println("收到前端提交的标准 SRT 文本:");
        System.out.println("========================================");
        System.out.println(srtText);
        System.out.println("========================================");
        System.out.println("SRT 文本长度: " + srtText.length() + " 字符");
        System.out.println("========================================");
        return "{\"success\": true, \"message\": \"SRT 文本保存成功\"}";
    }
}