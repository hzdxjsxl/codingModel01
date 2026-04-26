package com.example.rbac.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.rbac.entity.Menu;
import com.example.rbac.vo.UserPermissionVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface MenuMapper extends BaseMapper<Menu> {
    
    @Select("SELECT DISTINCT " +
            "m.id AS menu_id, " +
            "m.parent_id, " +
            "m.menu_name, " +
            "m.menu_code, " +
            "m.path, " +
            "m.component, " +
            "m.icon, " +
            "m.menu_type, " +
            "m.sort, " +
            "m.permission, " +
            "m.visible " +
            "FROM sys_menu m " +
            "INNER JOIN sys_role_menu rm ON m.id = rm.menu_id " +
            "INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id " +
            "WHERE ur.user_id = #{userId} " +
            "AND m.status = 1 " +
            "AND m.deleted = 0 " +
            "ORDER BY m.parent_id ASC, m.sort ASC")
    List<UserPermissionVO> selectUserPermissions(@Param("userId") Long userId);
}