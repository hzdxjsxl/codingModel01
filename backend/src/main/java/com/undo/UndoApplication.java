package com.undo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class UndoApplication {
    public static void main(String[] args) {
        SpringApplication.run(UndoApplication.class, args);
        System.out.println("========================================");
        System.out.println("  后悔药系统后端服务启动成功!");
        System.out.println("  访问地址: http://localhost:8081");
        System.out.println("  数据库: MySQL (undo_system)");
        System.out.println("========================================");
    }
}
