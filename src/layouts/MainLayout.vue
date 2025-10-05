<template>
  <el-container class="main-layout">
    <!-- 左侧导航栏 -->
    <el-aside width="220px" class="sidebar">
      <div class="logo-area">
        <img src="@/assets/logo.svg" alt="Logo" class="logo-icon" />
        <span class="logo-text">千面 Facet</span>
      </div>
      <el-menu
        active-text-color="#409eff"
        class="el-menu-vertical-demo"
        default-active="/overview"
        router
      >
        <el-menu-item index="/overview">
          <el-icon><TrendCharts /></el-icon>
          <span>概览</span>
        </el-menu-item>
        <el-menu-item index="/feature-flags">
          <el-icon><Switch /></el-icon>
          <span>功能开关</span>
        </el-menu-item>
        <el-menu-item index="/environments">
          <el-icon><Setting /></el-icon>
          <span>环境与配置</span>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <span>用户与权限</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶部操作栏 -->
      <el-header class="header">
        <div class="header-left">
          <span class="env-label">当前环境：</span>
          <span v-if="isLoadingEnv" class="loading-text">加载中...</span>
          <template v-else>
            <span v-if="environments.length === 0" class="loading-text">请先创建环境</span>
            <template v-else>
              <el-select v-model="selectedEnv" placeholder="请选择环境" size="small" class="env-select">
                <el-option
                  v-for="item in environments"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
              <el-button v-if="selectedEnv !== currentEnv" type="primary" size="small" @click="confirmSwitch" class="switch-btn">确定切换</el-button>
            </template>
          </template>
        </div>
        <div class="header-right">
          <el-button @click="toggleTheme" :icon="theme === 'dark' ? Sunny : Moon" circle />
          <el-button :icon="QuestionFilled" circle />
          <el-button :icon="Bell" circle />
          <el-dropdown>
            <span class="el-dropdown-link">
              <el-avatar size="small" :src="user.avatarUrl" />
              <span class="username">{{ user.displayName }}</span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleOpenProfile">个人中心</el-dropdown-item>
                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主工作区 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>

    <!-- 个人中心弹窗 -->
    <el-dialog v-model="profileDialogVisible" title="个人中心" width="600px">
      <div v-if="userDetails">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户ID">{{ userDetails.id }}</el-descriptions-item>
          <el-descriptions-item label="用户昵称">{{ userDetails.displayName }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ userDetails.email }}</el-descriptions-item>
          <el-descriptions-item label="角色">{{ userDetails.role }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(userDetails.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="最后登录">{{ formatDateTime(userDetails.lastLoginAt) }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <div v-else>
        <p>加载中...</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="profileDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, onMounted, provide, inject } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  TrendCharts, Switch, Setting, User, ArrowDown, QuestionFilled, Bell, Sunny, Moon
} from '@element-plus/icons-vue';
import { getActiveEnvironmentsApi } from '@/api/environment';
import { getMeApi, getUserDetailsApi } from '@/api/user';

const router = useRouter();
const theme = inject('theme');

const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
};

const currentEnv = ref(null);
const selectedEnv = ref(null);
const environments = ref([]);
const user = ref({ id: null, displayName: '...', avatarUrl: '' });
const isLoadingEnv = ref(true);

provide('currentEnv', currentEnv);

const storedUser = localStorage.getItem('user');
if (storedUser) {
  try {
    user.value = JSON.parse(storedUser);
  } catch (e) {
    console.error("Failed to parse user from localStorage", e);
    localStorage.removeItem('user');
  }
}

const fetchEnvironments = async () => {
  isLoadingEnv.value = true;
  try {
    const response = await getActiveEnvironmentsApi();
    const envList = response.data;
    if (envList && envList.length > 0) {
      environments.value = envList;
      currentEnv.value = envList[0].id;
      selectedEnv.value = envList[0].id;
    } else {
      environments.value = [];
    }
  } catch (error) {
    ElMessage.error('获取环境列表失败');
  } finally {
    isLoadingEnv.value = false;
  }
};

const fetchFreshUserInfo = async () => {
  try {
    const response = await getMeApi();
    user.value = response.data;
    localStorage.setItem('user', JSON.stringify(response.data));
  } catch (error) {
    console.error('Failed to fetch fresh user info:', error);
  }
};

const confirmSwitch = () => {
  currentEnv.value = selectedEnv.value;
  const currentEnvName = environments.value.find(e => e.id === currentEnv.value)?.name;
  ElMessage.success(`环境已切换至: ${currentEnvName}`);
};

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
  ElMessage.success('您已成功退出');
};

const profileDialogVisible = ref(false);
const userDetails = ref(null);

const handleOpenProfile = async () => {
  if (!user.value.id) {
    ElMessage.error('无法获取用户ID，请重新登录');
    return;
  }
  userDetails.value = null;
  profileDialogVisible.value = true;
  try {
    const response = await getUserDetailsApi(user.value.id);
    userDetails.value = response.data;
  } catch (error) {
    ElMessage.error(error.message || '获取用户详情失败');
    profileDialogVisible.value = false;
  }
};

const formatDateTime = (isoString) => {
  if (!isoString || isoString.startsWith('0001')) return '-';
  return new Date(isoString).toLocaleString();
};

onMounted(() => {
  fetchEnvironments();
  fetchFreshUserInfo();
});

</script>

<style scoped>
/* 移除所有特定于组件的背景和颜色样式，使其完全由全局样式控制 */
.main-layout, .el-container {
  height: 100vh;
}

.sidebar {
  border-right: 1px solid var(--el-border-color-lighter, #e6e6e6);
}

.logo-area {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  height: 60px;
  box-sizing: border-box;
}

.logo-icon {
  width: 32px;
  height: 32px;
  margin-right: 12px;
}

.logo-text {
  font-size: 18px;
  font-weight: bold;
}

.el-menu {
  border-right: none;
  background-color: transparent; /* 关键：继承父容器背景 */
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color-lighter, #e6e6e6);
}

.header-left, .header-right {
  display: flex;
  align-items: center;
}

.header-right {
  justify-content: flex-end;
}

.env-label {
  margin-right: 10px;
  font-size: 14px;
  white-space: nowrap;
}

.loading-text {
  font-size: 14px;
}

.env-select {
  min-width: 130px;
}

.switch-btn {
  margin-left: 10px;
}

.header-right > * {
  margin-left: 20px;
}

.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.username {
  margin-left: 8px;
}

.main-content {
  padding: 20px;
}
</style>
