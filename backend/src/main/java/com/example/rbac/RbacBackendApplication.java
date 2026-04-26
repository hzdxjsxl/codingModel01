package com.example.rbac;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.example.rbac.mapper")
public class RbacBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(RbacBackendApplication.class, args);
    }
}