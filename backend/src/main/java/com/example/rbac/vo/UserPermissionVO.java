package com.example.rbac.vo;

import lombok.Data;

@Data
public class UserPermissionVO {
    private Long menuId;
    private Long parentId;
    private String menuName;
    private String menuCode;
    private String path;
    private String component;
    private String icon;
    private Integer menuType;
    private Integer sort;
    private String permission;
    private Integer visible;
}