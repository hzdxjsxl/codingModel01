package com.subtitle.controller;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/subtitle")
@CrossOrigin(origins = "*")
public class SubtitleController {

    @GetMapping("/raw")
    public String getRawSrt() {
        return "1\n00:00:01,000 --> 00:00:04,000\n第一句字幕\n\n2\n00:00:05,000 --> 00:00:08,500\n第二句字幕\n多行内容\n\n3\n00:00:09,000 --> 00:00:12,000\n第三句字幕\n\n4\n00:00:13,000 --> 00:00:17,000\n第四句字幕\n包含特殊符号\n\n5\n00:00:18,000 --> 00:00:22,000\n最后一句字幕";
    }

    @PostMapping("/save")
    public String saveSubtitle(@RequestBody List<Map<String, Object>> subtitles) {
        StringBuilder srtBuilder = new StringBuilder();
        
        for (int i = 0; i < subtitles.size(); i++) {
            Map<String, Object> sub = subtitles.get(i);
            srtBuilder.append(i + 1).append("\n");
            srtBuilder.append(formatTime(getLongValue(sub.get("startTime"))))
                      .append(" --> ")
                      .append(formatTime(getLongValue(sub.get("endTime"))))
                      .append("\n");
            srtBuilder.append(sub.get("text")).append("\n\n");
        }
        
        System.out.println("保存的字幕: \n" + srtBuilder.toString());
        return "{\"success\": true, \"message\": \"字幕保存成功\"}";
    }
    
    private long getLongValue(Object obj) {
        if (obj instanceof Number) {
            return ((Number) obj).longValue();
        }
        return 0L;
    }

    private String formatTime(long milliseconds) {
        long hours = milliseconds / 3600000;
        long minutes = (milliseconds % 3600000) / 60000;
        long seconds = (milliseconds % 60000) / 1000;
        long millis = milliseconds % 1000;
        
        return String.format("%02d:%02d:%02d,%03d", hours, minutes, seconds, millis);
    }
}