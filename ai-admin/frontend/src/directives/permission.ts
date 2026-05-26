import type { App, Directive } from 'vue';
import { useAuth } from '@/hooks/business/auth';

const permissionDirective: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const { hasAuth } = useAuth();
    if (!hasAuth(binding.value)) {
      el.parentNode?.removeChild(el);
    }
  },
};

export function setupPermissionDirective(app: App) {
  app.directive('permission', permissionDirective);
}
