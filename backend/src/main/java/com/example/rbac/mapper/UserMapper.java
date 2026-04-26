package com.example.rbac.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.rbac.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}