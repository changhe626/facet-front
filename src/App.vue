<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup>
import { provide, ref, watch } from 'vue';
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';

const theme = ref(localStorage.getItem('theme') || 'light');

provide('theme', theme);

watch(theme, (newTheme) => {
  if (newTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('theme', newTheme);
}, { immediate: true });

</script>

<style>
/* --- 全局样式 --- */

/* 1. 亮色主题 (默认) */
:root {
  --bg-color: #f0f2f5; /* 主背景 */
  --bg-color-overlay: #ffffff; /* 卡片、头部、侧边栏背景 */
  --text-color-primary: #303133; /* 主要文字 */
  --text-color-regular: #606266; /* 常规文字 */
  --border-color: #e6e6e6; /* 边框 */
  --el-menu-bg-color: transparent;
  --el-menu-text-color: #303133;
}

/* 2. 暗黑主题变量 */
.dark {
  --bg-color: #141414;
  --bg-color-overlay: #1d1d1d;
  --text-color-primary: #e0e0e0;
  --text-color-regular: #a8a8a8;
  --border-color: #363636;
  --el-menu-text-color: #e0e0e0;
}

/* 3. 全局布局样式 (使用变量) */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--bg-color);
  color: var(--text-color-primary);
}

/* 使用 :deep() 穿透到子组件 */
:deep(.sidebar) {
  background-color: var(--bg-color-overlay);
  border-right: 1px solid var(--border-color);
}

:deep(.header) {
  background-color: var(--bg-color-overlay);
  border-bottom: 1px solid var(--border-color);
}

:deep(.main-content) {
  background-color: var(--bg-color);
}

:deep(.logo-text),
:deep(.username),
:deep(.env-label) {
  color: var(--text-color-primary);
}

:deep(.el-menu) {
  background-color: var(--el-menu-bg-color);
}

:deep(.el-menu-item), :deep(.el-sub-menu__title) {
  color: var(--el-menu-text-color);
}

:deep(.el-menu-item:hover) {
  background-color: rgba(0, 0, 0, 0.06);
}

.dark :deep(.el-menu-item:hover) {
  background-color: #262626;
}

/* 4. Element Plus 暗黑模式覆盖 */
.dark .el-card {
  background-color: var(--bg-color-overlay) !important;
  border: 1px solid var(--border-color) !important;
}
.dark .el-card__header { border-bottom: 1px solid var(--border-color) !important; }
.dark .el-table { color: var(--text-color-regular) !important; }
.dark .el-table th.el-table__cell { background-color: #262626 !important; color: var(--text-color-primary); }
.dark .el-table td.el-table__cell, .dark .el-table th.is-leaf.el-table__cell { border-bottom: 1px solid var(--border-color) !important; }
.dark .el-table--border .el-table__inner-wrapper::after, .dark .el-table--border::after, .dark .el-table--border::before, .dark .el-table__inner-wrapper::before { background-color: var(--border-color); }
.dark .el-input__wrapper, .dark .el-textarea__inner { background-color: #262626 !important; box-shadow: none !important; border: 1px solid var(--border-color) !important; }
.dark .el-input__inner, .dark .el-textarea__inner { color: var(--text-color-primary) !important; }
.dark .el-select .el-input__wrapper.is-focus, .dark .el-input__wrapper.is-focus { border-color: #409eff !important; }
.dark .el-dialog { background-color: var(--bg-color-overlay) !important; }
.dark .el-dialog__title { color: var(--text-color-primary) !important; }
.dark .el-dialog__header { border-bottom: 1px solid var(--border-color); }
.dark .el-dialog__footer { border-top: 1px solid var(--border-color); }
.dark .el-pagination { color: var(--text-color-regular) !important; }
.dark .el-pagination button, .dark .el-pager li { background-color: #262626 !important; color: var(--text-color-regular) !important; }
.dark .el-pager li.is-active { color: #409eff !important; }
.dark .el-tag { border: 1px solid; }
.dark h1, .dark h2, .dark h3 { color: var(--text-color-primary); }

</style>
