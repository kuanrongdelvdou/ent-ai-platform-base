import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // 超级管理员角色
  const superRole = await prisma.role.upsert({
    where: { code: 'super' },
    update: {},
    create: { name: '超级管理员', code: 'super', status: 1, remark: '拥有所有权限' },
  });

  // 超级管理员账号
  const hashed = await bcrypt.hash('soybean123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'soybean' },
    update: {},
    create: {
      username: 'soybean',
      password: hashed,
      realName: '超级管理员',
      status: 1,
      userRoles: { create: { roleId: superRole.id } },
    },
  });
  console.log('✓ 管理员账号:', admin.username);

  // 清空旧菜单（重新生成保证 component 格式正确）
  await prisma.roleMenu.deleteMany({});
  await prisma.menu.deleteMany({});

  // 首页（登录后默认跳转）
  await prisma.menu.create({
    data: {
      parentId: null, type: 2, name: 'home',
      path: '/home', component: 'layout.base$view.home',
      icon: 'carbon:home', sort: 1, status: 1,
    },
  });

  // 系统管理目录
  const systemMenu = await prisma.menu.create({
    data: {
      parentId: null, type: 1, name: 'system',
      path: '/system', component: 'layout.base',
      icon: 'carbon:settings', sort: 10, status: 1,
    },
  });

  // 系统监控目录
  const monitorMenu = await prisma.menu.create({
    data: {
      parentId: null, type: 1, name: 'monitor',
      path: '/monitor', component: 'layout.base',
      icon: 'carbon:activity', sort: 20, status: 1,
    },
  });

  // 系统工具目录
  const toolMenu = await prisma.menu.create({
    data: {
      parentId: null, type: 1, name: 'tool',
      path: '/tool', component: 'layout.base',
      icon: 'carbon:tool-box', sort: 30, status: 1,
    },
  });

  // AI 中枢目录
  const knowledgeMenu = await prisma.menu.create({
    data: {
      parentId: null, type: 1, name: 'knowledge',
      path: '/knowledge', component: 'layout.base',
      icon: 'carbon:data-base', sort: 40, status: 1,
    },
  });

  // 系统管理子菜单
  const systemChildren = [
    { name: 'system_user',  path: '/system/user',  component: 'layout.base$view.system_user',  icon: 'carbon:user',       sort: 1 },
    { name: 'system_role',  path: '/system/role',  component: 'layout.base$view.system_role',  icon: 'carbon:user-role',  sort: 2 },
    { name: 'system_menu',  path: '/system/menu',  component: 'layout.base$view.system_menu',  icon: 'carbon:menu',       sort: 3 },
    { name: 'system_dept',  path: '/system/dept',  component: 'layout.base$view.system_dept',  icon: 'carbon:tree-view',  sort: 4 },
  ];

  for (const c of systemChildren) {
    await prisma.menu.create({
      data: { parentId: systemMenu.id, type: 2, name: c.name, path: c.path, component: c.component, icon: c.icon, sort: c.sort, status: 1 },
    });
  }

  // 系统监控子菜单
  const monitorChildren = [
    { name: 'monitor_operation-log', path: '/monitor/operation-log', component: 'layout.base$view.monitor_operation-log', icon: 'carbon:document-tasks', sort: 1 },
    { name: 'monitor_login-log',     path: '/monitor/login-log',     component: 'layout.base$view.monitor_login-log',     icon: 'carbon:login',          sort: 2 },
  ];

  for (const c of monitorChildren) {
    await prisma.menu.create({
      data: { parentId: monitorMenu.id, type: 2, name: c.name, path: c.path, component: c.component, icon: c.icon, sort: c.sort, status: 1 },
    });
  }

  // 系统工具子菜单
  const toolChildren = [
    { name: 'tool_dict',   path: '/tool/dict',   component: 'layout.base$view.tool_dict',   icon: 'carbon:book',       sort: 1 },
    { name: 'tool_config', path: '/tool/config', component: 'layout.base$view.tool_config', icon: 'carbon:parameter',  sort: 2 },
  ];

  for (const c of toolChildren) {
    await prisma.menu.create({
      data: { parentId: toolMenu.id, type: 2, name: c.name, path: c.path, component: c.component, icon: c.icon, sort: c.sort, status: 1 },
    });
  }

  // AI 中枢子菜单
  const knowledgeChildren = [
    { name: 'knowledge_knowledge-base', path: '/knowledge/knowledge-base', component: 'layout.base$view.knowledge_knowledge-base', icon: 'carbon:folder-details', sort: 1 },
    { name: 'knowledge_model-config', path: '/knowledge/model-config', component: 'layout.base$view.knowledge_model-config', icon: 'carbon:machine-learning-model', sort: 2 },
  ];

  for (const c of knowledgeChildren) {
    await prisma.menu.create({
      data: { parentId: knowledgeMenu.id, type: 2, name: c.name, path: c.path, component: c.component, icon: c.icon, sort: c.sort, status: 1 },
    });
  }

  const buttonGroups = [
    { page: 'system_user', prefix: 'user', label: '用户' },
    { page: 'system_role', prefix: 'role', label: '角色' },
    { page: 'system_menu', prefix: 'menu', label: '菜单' },
    { page: 'system_dept', prefix: 'dept', label: '部门' },
    { page: 'tool_dict', prefix: 'dict', label: '字典' },
    { page: 'tool_config', prefix: 'config', label: '参数' },
    { page: 'knowledge_knowledge-base', prefix: 'knowledge', label: '知识库' },
  ];
  const actions = [
    { code: 'add', label: '新增', sort: 1 },
    { code: 'edit', label: '编辑', sort: 2 },
    { code: 'delete', label: '删除', sort: 3 },
  ];

  for (const group of buttonGroups) {
    const page = await prisma.menu.findFirstOrThrow({ where: { name: group.page } });
    await prisma.menu.createMany({
      data: actions.map((action) => ({
        parentId: page.id,
        type: 3,
        name: `${group.prefix}_${action.code}`,
        permission: `${group.prefix}:${action.code}`,
        sort: action.sort,
        status: 1,
        path: null,
        component: null,
        icon: null,
      })),
    });
  }

  const knowledgePage = await prisma.menu.findFirstOrThrow({ where: { name: 'knowledge_knowledge-base' } });
  const modelConfigPage = await prisma.menu.findFirstOrThrow({ where: { name: 'knowledge_model-config' } });
  await prisma.menu.create({
    data: {
      parentId: knowledgePage.id,
      type: 3,
      name: 'knowledge_search',
      permission: 'knowledge:search',
      sort: 4,
      status: 1,
      path: null,
      component: null,
      icon: null,
    },
  });
  await prisma.menu.create({
    data: {
      parentId: modelConfigPage.id,
      type: 3,
      name: 'model_config',
      permission: 'model:config',
      sort: 1,
      status: 1,
      path: null,
      component: null,
      icon: null,
    },
  });

  // 给超级管理员角色分配所有菜单
  const allMenus = await prisma.menu.findMany({ select: { id: true } });
  await prisma.roleMenu.createMany({
    data: allMenus.map((m) => ({ roleId: superRole.id, menuId: m.id })),
  });

  const allKnowledgeBases = await prisma.knowledgeBase.findMany({ select: { id: true } });
  if (allKnowledgeBases.length) {
    await prisma.knowledgeBaseRole.createMany({
      data: allKnowledgeBases.map((kb) => ({ kbId: kb.id, roleId: superRole.id })),
      skipDuplicates: true,
    });
  }

  console.log('✓ 菜单已重建，共', allMenus.length, '条');
  console.log('✓ Seed 完成');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
