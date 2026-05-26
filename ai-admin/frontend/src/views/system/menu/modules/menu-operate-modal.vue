<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { enableStatusOptions, menuIconTypeOptions, menuTypeOptions } from '@/constants/business';
import { fetchGetAllPages, fetchAddMenu, fetchUpdateMenu } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { getLocalIcons } from '@/utils/icon';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';
import {
  getLayoutAndPage, getPathParamFromRoutePath, getRoutePathByRouteName,
  getRoutePathWithParam, transformLayoutAndPageToComponent,
} from './shared';

defineOptions({ name: 'MenuOperateModal' });

export type OperateType = NaiveUI.TableOperateType | 'addChild';

interface Props {
  operateType: OperateType;
  rowData?: Api.SystemManage.Menu | null;
  allPages: string[];
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<OperateType, string> = { add: '新增菜单', addChild: '新增子菜单', edit: '编辑菜单' };
  return titles[props.operateType];
});

type Model = Pick<
  Api.SystemManage.Menu,
  'menuType' | 'menuName' | 'routeName' | 'routePath' | 'component' | 'order' | 'icon' | 'iconType' | 'status' | 'parentId'
> & { layout: string; page: string; pathParam: string };

const model = ref(createDefaultModel());

function createDefaultModel(): Model {
  return {
    menuType: '1', menuName: '', routeName: '', routePath: '', pathParam: '',
    component: '', layout: '', page: '', icon: '', iconType: '1',
    parentId: null, status: '1', order: 0,
  };
}

const rules: Record<'menuName' | 'status' | 'routeName' | 'routePath', App.Global.FormRule> = {
  menuName: defaultRequiredRule, status: defaultRequiredRule,
  routeName: defaultRequiredRule, routePath: defaultRequiredRule,
};

const localIcons = getLocalIcons();
const localIconOptions = localIcons.map<SelectOption>(item => ({
  label: () => (
    <div class="flex-y-center gap-16px">
      <SvgIcon localIcon={item} class="text-icon" />
      <span>{item}</span>
    </div>
  ),
  value: item,
}));

const showLayout = computed(() => model.value.parentId === null);
const showPage = computed(() => model.value.menuType === '2');

const pageOptions = computed(() => {
  const allPages = [...props.allPages];
  if (model.value.routeName && !allPages.includes(model.value.routeName)) allPages.unshift(model.value.routeName);
  return allPages.map(page => ({ label: page, value: page }));
});

const layoutOptions = [{ label: 'base', value: 'base' }, { label: 'blank', value: 'blank' }];

function handleInitModel() {
  model.value = createDefaultModel();
  if (!props.rowData) return;
  if (props.operateType === 'addChild') {
    Object.assign(model.value, { parentId: props.rowData.id });
  }
  if (props.operateType === 'edit') {
    const { component, ...rest } = props.rowData;
    const { layout, page } = getLayoutAndPage(component);
    const { path, param } = getPathParamFromRoutePath(rest.routePath);
    Object.assign(model.value, rest, { layout, page, routePath: path, pathParam: param });
  }
}

function closeModal() {
  visible.value = false;
}

function handleUpdateRoutePathByRouteName() {
  model.value.routePath = model.value.routeName ? getRoutePathByRouteName(model.value.routeName) : '';
}

function getSubmitParams() {
  const { layout, page, pathParam, ...params } = model.value;
  params.component = transformLayoutAndPageToComponent(layout, page);
  params.routePath = getRoutePathWithParam(model.value.routePath, pathParam);
  return params;
}

async function handleSubmit() {
  await validate();
  const params = getSubmitParams();
  if (props.operateType === 'add' || props.operateType === 'addChild') {
    const { error } = await fetchAddMenu(params);
    if (error) return;
  } else {
    const { error } = await fetchUpdateMenu(props.rowData!.id, params);
    if (error) return;
  }
  window.$message?.success($t('common.updateSuccess'));
  closeModal();
  emit('submitted');
}

watch(visible, () => {
  if (visible.value) {
    handleInitModel();
    restoreValidation();
  }
});

watch(() => model.value.routeName, handleUpdateRoutePathByRouteName);
</script>

<template>
  <NModal v-model:show="visible" :title="title" preset="card" class="w-800px">
    <NScrollbar class="h-480px pr-20px">
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="100">
        <NGrid responsive="screen" item-responsive>
          <NFormItemGi span="24 m:12" label="菜单类型" path="menuType">
            <NRadioGroup v-model:value="model.menuType" :disabled="props.operateType === 'edit'">
              <NRadio v-for="item in menuTypeOptions" :key="item.value" :value="item.value" :label="$t(item.label)" />
            </NRadioGroup>
          </NFormItemGi>
          <NFormItemGi span="24 m:12" label="菜单名称" path="menuName">
            <NInput v-model:value="model.menuName" placeholder="请输入菜单名称" />
          </NFormItemGi>
          <NFormItemGi span="24 m:12" label="路由名称" path="routeName">
            <NInput v-model:value="model.routeName" placeholder="如 system_user" />
          </NFormItemGi>
          <NFormItemGi span="24 m:12" label="路由路径" path="routePath">
            <NInput v-model:value="model.routePath" disabled placeholder="自动生成" />
          </NFormItemGi>
          <NFormItemGi v-if="showLayout" span="24 m:12" label="布局" path="layout">
            <NSelect v-model:value="model.layout" :options="layoutOptions" placeholder="请选择布局" />
          </NFormItemGi>
          <NFormItemGi v-if="showPage" span="24 m:12" label="页面组件" path="page">
            <NSelect v-model:value="model.page" :options="pageOptions" placeholder="请选择页面" />
          </NFormItemGi>
          <NFormItemGi span="24 m:12" label="排序" path="order">
            <NInputNumber v-model:value="model.order" class="w-full" placeholder="排序值" />
          </NFormItemGi>
          <NFormItemGi span="24 m:12" label="图标类型" path="iconType">
            <NRadioGroup v-model:value="model.iconType">
              <NRadio v-for="item in menuIconTypeOptions" :key="item.value" :value="item.value" :label="$t(item.label)" />
            </NRadioGroup>
          </NFormItemGi>
          <NFormItemGi span="24 m:12" label="图标" path="icon">
            <NInput v-if="model.iconType === '1'" v-model:value="model.icon" placeholder="iconify 图标名">
              <template #suffix>
                <SvgIcon v-if="model.icon" :icon="model.icon" class="text-icon" />
              </template>
            </NInput>
            <NSelect v-else v-model:value="model.icon" :options="localIconOptions" placeholder="请选择本地图标" />
          </NFormItemGi>
          <NFormItemGi span="24 m:12" label="状态" path="status">
            <NRadioGroup v-model:value="model.status">
              <NRadio v-for="item in enableStatusOptions" :key="item.value" :value="item.value" :label="$t(item.label)" />
            </NRadioGroup>
          </NFormItemGi>
        </NGrid>
      </NForm>
    </NScrollbar>
    <template #footer>
      <NSpace justify="end" :size="16">
        <NButton @click="closeModal">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
