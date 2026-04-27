package com.simcity.controller;

import com.simcity.dto.MapDataResponse;
import com.simcity.service.MapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/map")
@CrossOrigin(origins = "*")
public class MapController {

    @Autowired
    private MapService mapService;

    @GetMapping
    public ResponseEntity<MapDataResponse> getMapData() {
        MapDataResponse response = mapService.getMapData();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/arrival")
    public ResponseEntity<String> saveArrival(@RequestBody ArrivalRequest request) {
        mapService.saveDestination(request.getX(), request.getY());
        return ResponseEntity.ok("Arrival saved: x=" + request.getX() + ", y=" + request.getY());
    }

    public static class ArrivalRequest {
        private int x;
        private int y;

        public int getX() {
            return x;
        }

        public void setX(int x) {
            this.x = x;
        }

        public int getY() {
            return y;
        }

        public void setY(int y) {
            this.y = y;
        }
    }
}
