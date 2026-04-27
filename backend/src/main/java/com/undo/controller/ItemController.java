package com.undo.controller;

import com.undo.entity.Item;
import com.undo.service.ItemService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/items")
@CrossOrigin(origins = "*")
public class ItemController {

    private static final Logger logger = LoggerFactory.getLogger(ItemController.class);

    @Autowired
    private ItemService itemService;

    @GetMapping
    public ResponseEntity<List<Item>> getAllItems() {
        logger.info("[API] 获取所有项目列表");
        List<Item> items = itemService.getAllItems();
        return ResponseEntity.ok(items);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Item> getItemById(@PathVariable Long id) {
        logger.info("[API] 获取项目: {}", id);
        Item item = itemService.getItemById(id);
        return ResponseEntity.ok(item);
    }

    @PostMapping
    public ResponseEntity<Item> createItem(@RequestBody Item item) {
        logger.info("[API] 创建新项目: {}", item.getName());
        Item createdItem = itemService.createItem(item);
        return ResponseEntity.ok(createdItem);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Item> updateItem(@PathVariable Long id, @RequestBody Item itemDetails) {
        logger.info("[API] 更新项目: {}", id);
        Item updatedItem = itemService.updateItem(id, itemDetails);
        return ResponseEntity.ok(updatedItem);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Item> deleteItem(@PathVariable Long id) {
        logger.info("[API] 删除项目: {}", id);
        Item deletedItem = itemService.deleteItem(id);
        return ResponseEntity.ok(deletedItem);
    }

    @PostMapping("/restore")
    public ResponseEntity<Item> restoreItem(@RequestBody Item item) {
        logger.info("[API] 恢复项目: {}", item.getId());
        Item restoredItem = itemService.restoreItem(item);
        return ResponseEntity.ok(restoredItem);
    }
}
