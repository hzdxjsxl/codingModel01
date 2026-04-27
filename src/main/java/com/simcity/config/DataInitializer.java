package com.simcity.config;

import com.simcity.service.MapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private MapService mapService;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Initializing map data...");
        mapService.generateMap();
        System.out.println("Map data initialized successfully!");
    }
}
