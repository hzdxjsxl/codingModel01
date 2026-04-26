package com.example.rbac.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.rbac.entity.User;
import com.example.rbac.mapper.MenuMapper;
import com.example.rbac.mapper.UserMapper;
import com.example.rbac.service.UserService;
import com.example.rbac.vo.UserPermissionVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    @Autowired
    private MenuMapper menuMapper;

    @Override
    public User findByUsername(String username) {
        return this.getOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username)
                .eq(User::getDeleted, 0));
    }

    @Override
    public List<UserPermissionVO> getUserPermissions(Long userId) {
        return menuMapper.selectUserPermissions(userId);
    }
}