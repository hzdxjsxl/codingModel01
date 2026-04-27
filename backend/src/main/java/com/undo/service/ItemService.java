package com.undo.service;

import com.undo.entity.Item;
import java.util.List;

public interface ItemService {
    List<Item> getAllItems();
    Item getItemById(Long id);
    Item createItem(Item item);
    Item updateItem(Long id, Item itemDetails);
    Item deleteItem(Long id);
    Item restoreItem(Item item);
}
