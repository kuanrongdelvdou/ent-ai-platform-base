declare namespace Api {
  namespace SystemManage {
    type CommonSearchParams = Pick<Common.PaginatingCommonParams, 'current' | 'size'>;

    // ─── Role ───────────────────────────────────────────────────────────────
    type Role = Common.CommonRecord<{
      roleName: string;
      roleCode: string;
      roleDesc: string;
    }>;

    type RoleSearchParams = CommonType.RecordNullable<
      Pick<Role, 'roleName' | 'roleCode' | 'status'> & CommonSearchParams
    >;

    type RoleList = Common.PaginatingQueryRecord<Role>;
    type AllRole = Pick<Role, 'id' | 'roleName' | 'roleCode'>;

    // ─── User ───────────────────────────────────────────────────────────────
    type UserGender = '1' | '2';

    type User = Common.CommonRecord<{
      userName: string;
      userGender: UserGender | null;
      nickName: string;
      userPhone: string;
      userEmail: string;
      userRoles: string[];
    }>;

    type UserSearchParams = CommonType.RecordNullable<
      Pick<User, 'userName' | 'userGender' | 'nickName' | 'userPhone' | 'userEmail' | 'status'> &
        CommonSearchParams
    >;

    type UserList = Common.PaginatingQueryRecord<User>;

    // ─── Menu ───────────────────────────────────────────────────────────────
    type MenuType = '1' | '2';

    type MenuButton = {
      code: string;
      desc: string;
    };

    type IconType = '1' | '2';

    type MenuPropsOfRoute = Pick<
      import('vue-router').RouteMeta,
      'i18nKey' | 'keepAlive' | 'constant' | 'order' | 'href' | 'hideInMenu' | 'activeMenu' | 'multiTab' | 'fixedIndexInTab' | 'query'
    >;

    type Menu = Common.CommonRecord<{
      parentId: string | null;
      menuType: MenuType;
      menuName: string;
      routeName: string;
      routePath: string;
      component?: string;
      icon: string;
      iconType: IconType;
      buttons?: MenuButton[] | null;
      children?: Menu[] | null;
    }> & MenuPropsOfRoute;

    type MenuList = Common.PaginatingQueryRecord<Menu>;

    type MenuTree = {
      id: string;
      label: string;
      pId: string | null;
      children?: MenuTree[];
    };

    // ─── Department ─────────────────────────────────────────────────────────
    type Dept = {
      id: string;
      parentId: string | null;
      name: string;
      sort: number;
      leaderId: string | null;
      status: Common.EnableStatus;
      createTime: string;
      updateTime: string;
      children?: Dept[];
    };

    type DeptSearchParams = CommonType.RecordNullable<{ name?: string } & CommonSearchParams>;

    // ─── Dict ────────────────────────────────────────────────────────────────
    type DictType = Common.CommonRecord<{
      name: string;
      code: string;
      remark: string | null;
    }>;

    type DictItem = Common.CommonRecord<{
      dictTypeId: string;
      label: string;
      value: string;
      sort: number;
      remark: string | null;
    }>;

    // ─── Config ──────────────────────────────────────────────────────────────
    type SysConfig = {
      id: string;
      key: string;
      value: string;
      remark: string | null;
      createTime: string;
      updateTime: string;
    };

    // ─── Logs ────────────────────────────────────────────────────────────────
    type OperationLog = {
      id: string;
      userId: string | null;
      username: string | null;
      module: string | null;
      action: string | null;
      method: string | null;
      url: string | null;
      ip: string | null;
      responseCode: number | null;
      duration: number | null;
      createTime: string;
    };

    type OperationLogSearchParams = CommonType.RecordNullable<
      { username?: string; module?: string } & CommonSearchParams
    >;

    type LoginLog = {
      id: string;
      userId: string | null;
      username: string | null;
      ip: string | null;
      userAgent: string | null;
      status: '1' | '0';
      message: string | null;
      createTime: string;
    };

    type LoginLogSearchParams = CommonType.RecordNullable<
      { username?: string; status?: string } & CommonSearchParams
    >;
  }
}
