package com.simcity.entity;

import javax.persistence.*;

@Entity
@Table(name = "map_tiles")
public class MapTile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "x_coord", nullable = false)
    private int x;

    @Column(name = "y_coord", nullable = false)
    private int y;

    @Column(name = "elevation", nullable = false)
    private double elevation;

    @Column(name = "building_type_id", nullable = false)
    private int buildingTypeId;

    public MapTile() {}

    public MapTile(int x, int y, double elevation, int buildingTypeId) {
        this.x = x;
        this.y = y;
        this.elevation = elevation;
        this.buildingTypeId = buildingTypeId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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
