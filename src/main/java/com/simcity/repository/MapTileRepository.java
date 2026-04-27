package com.simcity.repository;

import com.simcity.entity.MapTile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MapTileRepository extends JpaRepository<MapTile, Long> {
    List<MapTile> findByXAndY(int x, int y);
    List<MapTile> findAllByOrderByXAscYAsc();
}
