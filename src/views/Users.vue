<template>
  <div class="users-page">
    <div class="page-header">
      <h1>用户管理</h1>
      <el-button type="primary" @click="handleCreate">新增用户</el-button>
    </div>

    <el-card>
      <div class="table-controls">
        <el-input
          v-model="searchKeyword"
          placeholder="按用户昵称或邮箱搜索"
          class="search-input"
          clearable
          @clear="fetchUsers"
          @keyup.enter="fetchUsers"
        >
          <template #append>
            <el-button :icon="Search" @click="fetchUsers" />
          </template>
        </el-input>
      </div>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="displayName" label="用户昵称" width="180" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="role" label="角色" width="150">
          <template #default="{ row }">
            {{ formatRole(row.role) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="200">
           <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="pagination.total > 0"
        class="pagination-container"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[5, 10, 20]"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="用户昵称" prop="displayName">
          <el-input v-model="form.displayName" placeholder="请输入用户昵称" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入用户邮箱" />
        </el-form-item>
        <el-form-item v-if="!form.id" label="初始密码" prop="initialPassword">
          <el-input v-model="form.initialPassword" type="password" show-password placeholder="请输入初始密码" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择用户角色">
            <el-option label="读写 (tenant_admin)" value="tenant_admin" />
            <el-option label="只读 (tenant_viewer)" value="tenant_viewer" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="isSubmitting">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { getUsersApi, createUserApi, updateUserApi, deleteUserApi } from '@/api/user';

// --- 列表 & 分页 & 搜索 ---
const loading = ref(true);
const tableData = ref([]);
const searchKeyword = ref('');
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const fetchUsers = async () => {
  loading.value = true;
  try {
    const params = { page: pagination.page, pageSize: pagination.pageSize, keyword: searchKeyword.value || undefined };
    const response = await getUsersApi(params);
    tableData.value = response.data.items;
    pagination.total = response.data.total;
  } catch (error) {
    ElMessage.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => { fetchUsers(); });
const handleSizeChange = (newSize) => { pagination.pageSize = newSize; fetchUsers(); };
const handleCurrentChange = (newPage) => { pagination.page = newPage; fetchUsers(); };
const formatDateTime = (isoString) => isoString ? new Date(isoString).toLocaleString() : '';

const formatRole = (role) => {
  const roleMap = {
    tenant_admin: '读写',
    tenant_viewer: '只读',
    system_admin: '系统管理员'
  };
  return roleMap[role] || role;
};

// --- 新增/编辑弹窗 ---
const dialogVisible = ref(false);
const isSubmitting = ref(false);
const formRef = ref(null);
const form = reactive({
  id: null,
  displayName: '',
  email: '',
  initialPassword: '',
  role: 'tenant_viewer',
});

const rules = computed(() => ({
  displayName: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
  email: [
    { required: true, message: '邮箱不能为空', trigger: ['blur', 'change'] },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] },
  ],
  initialPassword: [{ required: !form.id, message: '初始密码不能为空', trigger: 'blur' }],
  role: [{ required: true, message: '必须选择一个角色', trigger: 'change' }],
}));

const dialogTitle = computed(() => form.id ? '编辑用户' : '新增用户');

const handleCreate = () => { dialogVisible.value = true; };

const handleEdit = (row) => {
  form.id = row.id;
  form.displayName = row.displayName;
  form.email = row.email;
  form.role = row.role;
  dialogVisible.value = true;
};

const handleDialogClose = () => {
  formRef.value.resetFields();
  form.id = null;
  form.initialPassword = '';
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true;
      try {
        if (form.id) {
          await updateUserApi(form.id, { displayName: form.displayName, email: form.email, role: form.role });
          ElMessage.success('更新成功');
        } else {
          await createUserApi(form);
          ElMessage.success('创建成功');
        }
        dialogVisible.value = false;
        fetchUsers();
      } catch (error) {
        ElMessage.error(error.message || '操作失败');
      } finally {
        isSubmitting.value = false;
      }
    }
  });
};

// --- 删除 ---
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除用户 "${row.displayName}" 吗？`, '警告', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await deleteUserApi(row.id);
      ElMessage.success('删除成功');
      fetchUsers();
    } catch (error) {
      ElMessage.error(error.message || '删除失败');
    }
  }).catch(() => {
    ElMessage.info('已取消删除');
  });
};
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.table-controls { margin-bottom: 20px; display: flex; }
.search-input { width: 300px; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
