package com.example.rbac.controller;

import com.example.rbac.common.Result;
import com.example.rbac.entity.Menu;
import com.example.rbac.mapper.MenuMapper;
import com.example.rbac.vo.UserPermissionVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    @Autowired
    private MenuMapper menuMapper;

    @GetMapping("/health")
    public Result<String> health() {
        return Result.success("ok");
    }

    @GetMapping("/test-permissions/{userId}")
    public Result<List<UserPermissionVO>> testPermissions(@PathVariable Long userId) {
        List<UserPermissionVO> permissions = menuMapper.selectUserPermissions(userId);
        return Result.success(permissions);
    }
}