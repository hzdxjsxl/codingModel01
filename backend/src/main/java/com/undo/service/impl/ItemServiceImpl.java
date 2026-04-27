package com.undo.service.impl;

import com.undo.entity.Item;
import com.undo.repository.ItemRepository;
import com.undo.service.ItemService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ItemServiceImpl implements ItemService {

    private static final Logger logger = LoggerFactory.getLogger(ItemServiceImpl.class);

    @Autowired
    private ItemRepository itemRepository;

    @Override
    public List<Item> getAllItems() {
        logger.info("获取所有未删除的项目");
        return itemRepository.findByDeletedFalseOrderByCreatedAtDesc();
    }

    @Override
    public Item getItemById(Long id) {
        logger.info("根据ID获取项目: {}", id);
        return itemRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("项目不存在: " + id));
    }

    @Override
    @Transactional
    public Item createItem(Item item) {
        logger.info("创建新项目: {}", item.getName());
        Item savedItem = itemRepository.save(item);
        logger.info("项目创建成功，ID: {}", savedItem.getId());
        return savedItem;
    }

    @Override
    @Transactional
    public Item updateItem(Long id, Item itemDetails) {
        logger.info("更新项目: {}", id);
        Item item = itemRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("项目不存在: " + id));
        
        String originalName = item.getName();
        String originalCategory = item.getCategory();
        
        item.setName(itemDetails.getName());
        item.setCategory(itemDetails.getCategory());
        
        Item updatedItem = itemRepository.save(item);
        logger.info("项目更新成功: {} -> {}", originalName, updatedItem.getName());
        return updatedItem;
    }

    @Override
    @Transactional
    public Item deleteItem(Long id) {
        logger.info("软删除项目: {}", id);
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("项目不存在: " + id));
        
        item.setDeleted(true);
        Item deletedItem = itemRepository.save(item);
        logger.info("项目软删除成功: {}", deletedItem.getName());
        return deletedItem;
    }

    @Override
    @Transactional
    public Item restoreItem(Item item) {
        logger.info("恢复项目: {}", item.getId());
        
        if (item.getId() != null) {
            Item existingItem = itemRepository.findById(item.getId()).orElse(null);
            if (existingItem != null) {
                existingItem.setDeleted(false);
                existingItem.setName(item.getName());
                existingItem.setCategory(item.getCategory());
                Item restoredItem = itemRepository.save(existingItem);
                logger.info("项目恢复成功: {}", restoredItem.getName());
                return restoredItem;
            }
        }
        
        Item newItem = new Item();
        newItem.setName(item.getName());
        newItem.setCategory(item.getCategory());
        newItem.setDeleted(false);
        
        Item restoredItem = itemRepository.save(newItem);
        logger.info("新项目恢复成功: {}", restoredItem.getName());
        return restoredItem;
    }
}
