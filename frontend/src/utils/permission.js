export function buildMenuTree(flatMenus, parentId = 0) {
  const result = []
  
  for (const menu of flatMenus) {
    if (menu.parentId === parentId) {
      const children = buildMenuTree(flatMenus, menu.menuId)
      const menuItem = {
        id: menu.menuId,
        parentId: menu.parentId,
        name: menu.menuName,
        path: menu.path,
        component: menu.component,
        icon: menu.icon,
        menuType: menu.menuType,
        sort: menu.sort,
        permission: menu.permission,
        visible: menu.visible
      }
      
      if (children.length > 0) {
        menuItem.children = children
      }
      
      result.push(menuItem)
    }
  }
  
  return result.sort((a, b) => a.sort - b.sort)
}

export function buildAsyncRoutes(menuTree) {
  const routes = []
  
  for (const menu of menuTree) {
    const route = {
      path: menu.path,
      name: menu.menuCode || menu.path.replace(/\//g, '-').substring(1),
      meta: {
        title: menu.name,
        icon: menu.icon,
        menuType: menu.menuType,
        visible: menu.visible !== 0
      }
    }
    
    if (menu.component === 'Layout') {
      route.component = () => import('@/layouts/index.vue')
    } else if (menu.component) {
      const componentPath = menu.component
      route.component = () => import(`@/views/${componentPath}.vue`)
    }
    
    if (menu.children && menu.children.length > 0) {
      route.children = buildAsyncRoutes(menu.children)
    }
    
    routes.push(route)
  }
  
  return routes
}

export function filterVisibleMenus(menuTree) {
  return menuTree
    .filter(menu => menu.visible !== 0 && menu.menuType !== 3)
    .map(menu => {
      if (menu.children && menu.children.length > 0) {
        return {
          ...menu,
          children: filterVisibleMenus(menu.children)
        }
      }
      return menu
    })
    .filter(menu => !menu.children || menu.children.length > 0 || menu.menuType === 2)
}