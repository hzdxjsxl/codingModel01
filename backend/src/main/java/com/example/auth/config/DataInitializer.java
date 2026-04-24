package com.example.auth.config;

import com.example.auth.entity.User;
import com.example.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername("sa")) {
            User admin = new User();
            admin.setUsername("sa");
            admin.setPassword(passwordEncoder.encode("123456"));
            admin.setRole("ADMIN");
            userRepository.save(admin);
            System.out.println("Super admin user created: username=sa, password=123456");
        }
    }
}
