<template>
  <div class="environments-page">
    <div class="page-header">
      <h1>环境管理</h1>
      <el-button type="primary" @click="handleCreate">新增环境</el-button>
    </div>

    <el-card>
      <div class="table-controls">
        <el-input
          v-model="searchKeyword"
          placeholder="按环境名称搜索"
          class="search-input"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-select v-model="searchStatus" placeholder="按状态筛选" clearable @change="handleSearch" class="status-select">
          <el-option label="已激活" :value="true" />
          <el-option label="未激活" :value="false" />
        </el-select>
        <el-button :icon="Search" type="primary" @click="handleSearch">搜索</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="名称" width="180" />
        <el-table-column prop="sdkKey" label="SDK Key" />
        <el-table-column prop="isActive" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'">
              {{ row.isActive ? '已激活' : '未激活' }}
            </el-tag>
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
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入环境名称" />
        </el-form-item>
        <el-form-item v-if="!form.id" label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入环境描述" />
        </el-form-item>
        <el-form-item label="状态" prop="isActive">
          <el-switch v-model="form.isActive" active-text="激活" inactive-text="禁用" />
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
import { getEnvironmentsApi, createEnvironmentApi, updateEnvironmentApi, deleteEnvironmentApi } from '@/api/environment';

// --- 列表 & 分页 & 搜索 ---
const loading = ref(true);
const tableData = ref([]);
const searchKeyword = ref('');
const searchStatus = ref(null); // 使用 null 来代表“全部”
const pagination = reactive({
  page: 1,
  pageSize: 5,
  total: 0,
});

const fetchEnvironments = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchKeyword.value || undefined,
      is_active: searchStatus.value === null ? undefined : searchStatus.value,
    };
    const response = await getEnvironmentsApi(params);
    tableData.value = response.data.items;
    pagination.total = response.data.total;
  } catch (error) {
    ElMessage.error('获取环境列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1; // 每次搜索都重置到第一页
  fetchEnvironments();
};

const handleSizeChange = (newSize) => { pagination.pageSize = newSize; fetchEnvironments(); };
const handleCurrentChange = (newPage) => { pagination.page = newPage; fetchEnvironments(); };
const formatDateTime = (isoString) => isoString ? new Date(isoString).toLocaleString() : '';
onMounted(() => { fetchEnvironments(); });

// --- 新增/编辑弹窗 ---
const dialogVisible = ref(false);
const isSubmitting = ref(false);
const formRef = ref(null);
const form = reactive({ id: null, name: '', description: '', isActive: true });
const rules = reactive({ name: [{ required: true, message: '环境名称不能为空', trigger: 'blur' }] });
const dialogTitle = computed(() => form.id ? '编辑环境' : '新增环境');

const handleCreate = () => { dialogVisible.value = true; };
const handleEdit = (row) => {
  form.id = row.id;
  form.name = row.name;
  form.isActive = row.isActive;
  dialogVisible.value = true;
};
const handleDialogClose = () => {
  formRef.value.resetFields();
  form.id = null;
  form.description = '';
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true;
      try {
        if (form.id) {
          await updateEnvironmentApi(form.id, { name: form.name, isActive: form.isActive });
          ElMessage.success('更新成功');
        } else {
          await createEnvironmentApi({ name: form.name, description: form.description, isActive: form.isActive });
          ElMessage.success('创建成功');
        }
        dialogVisible.value = false;
        fetchEnvironments();
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
  ElMessageBox.confirm(`确定要删除环境 "${row.name}" 吗？此操作不可恢复。`, '警告', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await deleteEnvironmentApi(row.id);
      ElMessage.success('删除成功');
      fetchEnvironments();
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
.table-controls { display: flex; align-items: center; margin-bottom: 20px; gap: 15px; }
.search-input { width: 240px; }
.status-select { width: 120px; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
