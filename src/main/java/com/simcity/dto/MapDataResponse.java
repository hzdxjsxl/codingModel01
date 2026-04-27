package com.simcity.dto;

import java.util.List;

public class MapDataResponse {
    private int width;
    private int height;
    private List<TileData> tiles;

    public static class TileData {
        private int x;
        private int y;
        private double elevation;
        private int buildingTypeId;

        public TileData() {}

        public TileData(int x, int y, double elevation, int buildingTypeId) {
            this.x = x;
            this.y = y;
            this.elevation = elevation;
            this.buildingTypeId = buildingTypeId;
        }

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

        public double getElevation() {
            return elevation;
        }

        public void setElevation(double elevation) {
            this.elevation = elevation;
        }

        public int getBuildingTypeId() {
            return buildingTypeId;
        }

        public void setBuildingTypeId(int buildingTypeId) {
            this.buildingTypeId = buildingTypeId;
        }
    }

    public MapDataResponse() {}

    public int getWidth() {
        return width;
    }

    public void setWidth(int width) {
        this.width = width;
    }

    public int getHeight() {
        return height;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public List<TileData> getTiles() {
        return tiles;
    }

    public void setTiles(List<TileData> tiles) {
        this.tiles = tiles;
    }
}
