import { request } from '../request';

// ─── Role ────────────────────────────────────────────────────────────────────

export function fetchGetRoleList(params?: Api.SystemManage.RoleSearchParams) {
  return request<Api.SystemManage.RoleList>({ url: '/systemManage/getRoleList', method: 'get', params });
}

export function fetchGetAllRoles() {
  return request<Api.SystemManage.AllRole[]>({ url: '/systemManage/getAllRoles', method: 'get' });
}

export function fetchAddRole(data: Partial<Api.SystemManage.Role>) {
  return request<null>({ url: '/systemManage/addRole', method: 'post', data });
}

export function fetchUpdateRole(id: string, data: Partial<Api.SystemManage.Role> & { menuIds?: string[] }) {
  return request<null>({ url: `/systemManage/updateRole/${id}`, method: 'put', data });
}

export function fetchDeleteRole(id: string) {
  return request<null>({ url: `/systemManage/deleteRole/${id}`, method: 'delete' });
}

// ─── User ────────────────────────────────────────────────────────────────────

export function fetchGetUserList(params?: Api.SystemManage.UserSearchParams) {
  return request<Api.SystemManage.UserList>({ url: '/systemManage/getUserList', method: 'get', params });
}

export function fetchAddUser(data: Partial<Api.SystemManage.User> & { password: string }) {
  return request<null>({ url: '/systemManage/addUser', method: 'post', data });
}

export function fetchUpdateUser(id: string, data: Partial<Api.SystemManage.User>) {
  return request<null>({ url: `/systemManage/updateUser/${id}`, method: 'put', data });
}

export function fetchDeleteUser(id: string) {
  return request<null>({ url: `/systemManage/deleteUser/${id}`, method: 'delete' });
}

// ─── Menu ────────────────────────────────────────────────────────────────────

export function fetchGetMenuList() {
  return request<Api.SystemManage.MenuList>({ url: '/systemManage/getMenuList', method: 'get' });
}

export function fetchGetAllPages() {
  return request<string[]>({ url: '/systemManage/getAllPages', method: 'get' });
}

export function fetchGetMenuTree() {
  return request<Api.SystemManage.MenuTree[]>({ url: '/systemManage/getMenuTree', method: 'get' });
}

export function fetchAddMenu(data: Partial<Api.SystemManage.Menu>) {
  return request<null>({ url: '/systemManage/addMenu', method: 'post', data });
}

export function fetchUpdateMenu(id: string, data: Partial<Api.SystemManage.Menu>) {
  return request<null>({ url: `/systemManage/updateMenu/${id}`, method: 'put', data });
}

export function fetchDeleteMenu(id: string) {
  return request<null>({ url: `/systemManage/deleteMenu/${id}`, method: 'delete' });
}

// ─── Department ──────────────────────────────────────────────────────────────

export function fetchGetDeptTree() {
  return request<Api.SystemManage.Dept[]>({ url: '/systemManage/getDeptTree', method: 'get' });
}

export function fetchGetDeptList() {
  return request<Api.SystemManage.Dept[]>({ url: '/systemManage/getDeptList', method: 'get' });
}

export function fetchAddDept(data: Partial<Api.SystemManage.Dept>) {
  return request<null>({ url: '/systemManage/addDept', method: 'post', data });
}

export function fetchUpdateDept(id: string, data: Partial<Api.SystemManage.Dept>) {
  return request<null>({ url: `/systemManage/updateDept/${id}`, method: 'put', data });
}

export function fetchDeleteDept(id: string) {
  return request<null>({ url: `/systemManage/deleteDept/${id}`, method: 'delete' });
}

// ─── Dict ─────────────────────────────────────────────────────────────────────

export function fetchGetDictTypeList() {
  return request<Api.SystemManage.DictType[]>({ url: '/systemManage/getDictTypeList', method: 'get' });
}

export function fetchAddDictType(data: Partial<Api.SystemManage.DictType>) {
  return request<null>({ url: '/systemManage/addDictType', method: 'post', data });
}

export function fetchUpdateDictType(id: string, data: Partial<Api.SystemManage.DictType>) {
  return request<null>({ url: `/systemManage/updateDictType/${id}`, method: 'put', data });
}

export function fetchDeleteDictType(id: string) {
  return request<null>({ url: `/systemManage/deleteDictType/${id}`, method: 'delete' });
}

export function fetchGetDictItemList(dictTypeId: string) {
  return request<Api.SystemManage.DictItem[]>({ url: '/systemManage/getDictItemList', method: 'get', params: { dictTypeId } });
}

export function fetchAddDictItem(data: Partial<Api.SystemManage.DictItem>) {
  return request<null>({ url: '/systemManage/addDictItem', method: 'post', data });
}

export function fetchUpdateDictItem(id: string, data: Partial<Api.SystemManage.DictItem>) {
  return request<null>({ url: `/systemManage/updateDictItem/${id}`, method: 'put', data });
}

export function fetchDeleteDictItem(id: string) {
  return request<null>({ url: `/systemManage/deleteDictItem/${id}`, method: 'delete' });
}

// ─── Config ───────────────────────────────────────────────────────────────────

export function fetchGetConfigList() {
  return request<Api.SystemManage.SysConfig[]>({ url: '/systemManage/getConfigList', method: 'get' });
}

export function fetchAddConfig(data: Partial<Api.SystemManage.SysConfig>) {
  return request<null>({ url: '/systemManage/addConfig', method: 'post', data });
}

export function fetchUpdateConfig(id: string, data: Partial<Api.SystemManage.SysConfig>) {
  return request<null>({ url: `/systemManage/updateConfig/${id}`, method: 'put', data });
}

export function fetchDeleteConfig(id: string) {
  return request<null>({ url: `/systemManage/deleteConfig/${id}`, method: 'delete' });
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export function fetchGetOperationLogList(params?: Api.SystemManage.OperationLogSearchParams) {
  return request<Api.Common.PaginatingQueryRecord<Api.SystemManage.OperationLog>>({
    url: '/systemManage/getOperationLogList', method: 'get', params,
  });
}

export function fetchGetLoginLogList(params?: Api.SystemManage.LoginLogSearchParams) {
  return request<Api.Common.PaginatingQueryRecord<Api.SystemManage.LoginLog>>({
    url: '/systemManage/getLoginLogList', method: 'get', params,
  });
}
