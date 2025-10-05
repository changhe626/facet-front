<template>
  <div class="login-container">
    <div class="login-header">
      <img src="@/assets/logo.svg" alt="Logo" class="logo-icon" />
      <h1>千面 (Facet)</h1>
    </div>
    <el-card class="login-card">
      <h2 class="login-title">登录至 千面</h2>
      <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          @keyup.enter="handleLogin"
      >
        <el-form-item prop="email">
          <el-input
              v-model="loginForm.email"
              placeholder="请输入用户名/邮箱"
              size="large"
              :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              show-password
              :prefix-icon="Lock"
          />
        </el-form-item>
        <el-form-item>
          <el-button
              type="primary"
              class="login-button"
              size="large"
              :loading="loading"
              @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { loginApi } from '@/api/auth';

const loginFormRef = ref(null);
const router = useRouter();
const loading = ref(false);

const loginForm = reactive({
  email: '',
  password: '',
});

const loginRules = reactive({
  email: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
  password: [{ required: true, message: '密码不能为空', trigger: 'blur' }],
});

const handleLogin = async () => {
  if (!loginFormRef.value) return;

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const response = await loginApi({
          email: loginForm.email,
          password: loginForm.password,
        });

        // 根据最新的 API 文档，存储 token 和 user 信息
        localStorage.setItem('token', response.data.token);
        // localStorage 需要存储字符串，所以我们将 user 对象转换为 JSON 字符串
        localStorage.setItem('user', JSON.stringify(response.data.user));

        ElMessage.success('登录成功！');
        // 跳转到根路径，路由会自动重定向到主布局下的默认页面
        router.push('/');

      } catch (error) {
        ElMessage.error(error.message || '登录失败，请稍后重试');
        console.error('Login failed:', error);
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped>
/* 样式与之前版本相同，此处省略以保持简洁 */
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  background-color: #f0f2f5;
}
.login-header {
  display: flex;
  align-items: center;
  margin-bottom: 40px;
}
.logo-icon {
  width: 44px;
  height: 44px;
  margin-right: 16px;
}
.login-header h1 {
  font-size: 32px;
  font-weight: 600;
}
.login-card {
  width: 100%;
  max-width: 400px;
  border-radius: 8px;
}
.login-title {
  text-align: center;
  font-size: 24px;
  margin-bottom: 24px;
}
.login-button {
  width: 100%;
}
</style>