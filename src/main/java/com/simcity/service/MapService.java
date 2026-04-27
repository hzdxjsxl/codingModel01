package com.simcity.service;

import com.simcity.dto.MapDataResponse;
import com.simcity.entity.MapTile;
import com.simcity.repository.MapTileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class MapService {

    @Autowired
    private MapTileRepository mapTileRepository;

    private static final int MAP_SIZE = 100;

    public void generateMap() {
        List<MapTile> tiles = new ArrayList<>();
        Random random = new Random(42);

        for (int y = 0; y < MAP_SIZE; y++) {
            for (int x = 0; x < MAP_SIZE; x++) {
                double elevation = generateElevation(x, y, random);
                int buildingTypeId = generateBuildingType(x, y, random);
                tiles.add(new MapTile(x, y, elevation, buildingTypeId));
            }
        }

        mapTileRepository.saveAll(tiles);
    }

    private double generateElevation(int x, int y, Random random) {
        double noise = (Math.sin(x * 0.1) + Math.cos(y * 0.1)) * 0.5;
        noise += (Math.sin(x * 0.05 + 100) + Math.cos(y * 0.05 + 100)) * 0.3;
        return Math.max(0, noise * 5 + random.nextDouble() * 0.5);
    }

    private int generateBuildingType(int x, int y, Random random) {
        if (x == 0 || y == 0 || x == MAP_SIZE - 1 || y == MAP_SIZE - 1) {
            return 0;
        }

        double distFromCenter = Math.sqrt(Math.pow(x - MAP_SIZE / 2.0, 2) + Math.pow(y - MAP_SIZE / 2.0, 2));
        if (distFromCenter < 10) {
            return random.nextDouble() < 0.6 ? 3 : 2;
        } else if (distFromCenter < 25) {
            return random.nextDouble() < 0.4 ? 2 : 1;
        } else if (distFromCenter < 40) {
            return random.nextDouble() < 0.2 ? 1 : 0;
        } else {
            return random.nextDouble() < 0.05 ? 4 : 0;
        }
    }

    public MapDataResponse getMapData() {
        List<MapTile> tiles = mapTileRepository.findAllByOrderByXAscYAsc();
        MapDataResponse response = new MapDataResponse();
        response.setWidth(MAP_SIZE);
        response.setHeight(MAP_SIZE);

        List<MapDataResponse.TileData> tileDataList = new ArrayList<>();
        for (MapTile tile : tiles) {
            tileDataList.add(new MapDataResponse.TileData(
                tile.getX(),
                tile.getY(),
                tile.getElevation(),
                tile.getBuildingTypeId()
            ));
        }
        response.setTiles(tileDataList);
        return response;
    }

    public void saveDestination(int x, int y) {
        System.out.println("Player arrived at: x=" + x + ", y=" + y);
    }
}
