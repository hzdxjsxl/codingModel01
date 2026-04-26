package com.example.rbac.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.example.rbac.entity.User;
import com.example.rbac.vo.UserPermissionVO;

import java.util.List;

public interface UserService extends IService<User> {
    User findByUsername(String username);
    
    List<UserPermissionVO> getUserPermissions(Long userId);
}