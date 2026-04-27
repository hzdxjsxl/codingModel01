package com.logistics.controller;

import com.logistics.model.Cargo;
import com.logistics.model.Container;
import com.logistics.model.ContainerPlanningResponse;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class ContainerPlanningController {

    @GetMapping("/planning-data")
    public ContainerPlanningResponse getPlanningData() {
        Container container = new Container(1200.0, 235.0, 269.0);
        
        List<Cargo> cargoList = new ArrayList<>();
        
        cargoList.add(new Cargo("C001", 100.0, 80.0, 60.0, 50.0));
        cargoList.add(new Cargo("C002", 100.0, 80.0, 60.0, 50.0));
        cargoList.add(new Cargo("C003", 100.0, 80.0, 60.0, 50.0));
        cargoList.add(new Cargo("C004", 100.0, 80.0, 60.0, 50.0));
        cargoList.add(new Cargo("C005", 120.0, 100.0, 80.0, 80.0));
        cargoList.add(new Cargo("C006", 120.0, 100.0, 80.0, 80.0));
        cargoList.add(new Cargo("C007", 120.0, 100.0, 80.0, 80.0));
        cargoList.add(new Cargo("C008", 80.0, 60.0, 50.0, 30.0));
        cargoList.add(new Cargo("C009", 80.0, 60.0, 50.0, 30.0));
        cargoList.add(new Cargo("C010", 80.0, 60.0, 50.0, 30.0));
        cargoList.add(new Cargo("C011", 80.0, 60.0, 50.0, 30.0));
        cargoList.add(new Cargo("C012", 80.0, 60.0, 50.0, 30.0));
        cargoList.add(new Cargo("C013", 150.0, 100.0, 90.0, 100.0));
        cargoList.add(new Cargo("C014", 150.0, 100.0, 90.0, 100.0));
        cargoList.add(new Cargo("C015", 60.0, 40.0, 30.0, 15.0));
        cargoList.add(new Cargo("C016", 60.0, 40.0, 30.0, 15.0));
        cargoList.add(new Cargo("C017", 60.0, 40.0, 30.0, 15.0));
        cargoList.add(new Cargo("C018", 60.0, 40.0, 30.0, 15.0));
        cargoList.add(new Cargo("C019", 60.0, 40.0, 30.0, 15.0));
        cargoList.add(new Cargo("C020", 60.0, 40.0, 30.0, 15.0));
        
        return new ContainerPlanningResponse(container, cargoList);
    }
}
