import { transformRecordToOption } from '@/utils/common';

export const enableStatusRecord: Record<Api.Common.EnableStatus, App.I18n.I18nKey> = {
  1: 'common.yesOrNo.yes',
  2: 'common.yesOrNo.no',
};

export const enableStatusOptions = transformRecordToOption(enableStatusRecord);

export const menuTypeRecord: Record<Api.SystemManage.MenuType, App.I18n.I18nKey> = {
  1: 'route.system',
  2: 'route.home',
};

export const menuTypeOptions = transformRecordToOption(menuTypeRecord);

export const menuIconTypeRecord: Record<Api.SystemManage.IconType, App.I18n.I18nKey> = {
  1: 'common.yesOrNo.yes',
  2: 'common.yesOrNo.no',
};

export const menuIconTypeOptions = transformRecordToOption(menuIconTypeRecord);
