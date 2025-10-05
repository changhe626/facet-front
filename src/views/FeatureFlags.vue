<template>
  <div class="feature-flags-page">
    <div class="page-header">
      <h1>功能开关管理</h1>
      <el-button type="primary" @click="handleCreate" :disabled="!currentEnvId">新增开关</el-button>
    </div>

    <el-card>
      <div class="table-controls">
        <el-input
          v-model="searchKeyword"
          placeholder="按名称搜索"
          class="search-input"
          clearable
          @clear="fetchFeatureFlags"
          @keyup.enter="fetchFeatureFlags"
          :disabled="!currentEnvId"
        >
          <template #append>
            <el-button :icon="Search" @click="fetchFeatureFlags" :disabled="!currentEnvId" />
          </template>
        </el-input>
      </div>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="名称" width="220" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'info'">
              {{ row.status ? '已开启' : '已关闭' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedBy" label="最后修改人" width="180" />
        <el-table-column prop="updatedAt" label="最后修改时间" width="200">
           <template #default="{ row }">
            {{ formatDateTime(row.updatedAt) }}
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
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px" @close="handleDialogClose">
      <div v-loading="isLoadingDetails">
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="名称" prop="name">
                <el-input v-model="form.name" placeholder="请输入开关名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="状态" prop="status">
                <el-switch v-model="form.status" active-text="开启" inactive-text="关闭" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="描述" prop="description">
            <el-input v-model="form.description" type="textarea" placeholder="请输入功能开关的描述" />
          </el-form-item>

          <el-divider />
          
          <label class="el-form-item__label">白名单规则</label>
          <div class="rule-creator">
              <el-input v-model="newRule.accountId" placeholder="账户ID" class="rule-input-account" />
              <el-input v-model="newRule.userIdsStr" placeholder="输入用户ID, 用英文逗号隔开" class="rule-input-users" />
              <el-button @click="addRule" type="primary" plain>添加规则</el-button>
          </div>

          <el-table :data="form.whitelist_rules" border style="width: 100%; margin-top: 10px;" empty-text="暂无规则">
              <el-table-column prop="accountId" label="账户ID" />
              <el-table-column label="用户ID列表">
                  <template #default="{ row }">
                      <el-tag v-for="uid in row.userIds" :key="uid" style="margin-right: 5px;">{{ uid }}</el-tag>
                  </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                  <template #default="{ $index }">
                      <el-button link type="danger" @click="deleteRule($index)">删除</el-button>
                  </template>
              </el-table-column>
          </el-table>

        </el-form>
      </div>
      <template #footer>
        <div v-if="!isLoadingDetails">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="isSubmitting">确认</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, inject, watch, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { getFeatureFlagsApi, getFeatureFlagDetailsApi, createFeatureFlagApi, updateFeatureFlagApi, deleteFeatureFlagApi } from '@/api/featureFlags';

const currentEnvId = inject('currentEnv');

// --- 列表 & 分页 & 搜索 ---
const loading = ref(false);
const tableData = ref([]);
const searchKeyword = ref('');
const pagination = reactive({ page: 1, pageSize: 10, total: 0 });

const fetchFeatureFlags = async () => {
  if (!currentEnvId.value) { tableData.value = []; pagination.total = 0; return; }
  loading.value = true;
  try {
    const params = { page: pagination.page, pageSize: pagination.pageSize, keyword: searchKeyword.value || undefined };
    const response = await getFeatureFlagsApi(currentEnvId.value, params);
    tableData.value = response.data.items;
    pagination.total = response.data.total;
  } catch (error) {
    ElMessage.error('获取功能开关列表失败');
    tableData.value = []; pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

watch(currentEnvId, (newEnvId) => { if (newEnvId) { pagination.page = 1; searchKeyword.value = ''; fetchFeatureFlags(); } }, { immediate: false });
onMounted(() => { if (currentEnvId.value) { fetchFeatureFlags(); } });

const handleSizeChange = (newSize) => { pagination.pageSize = newSize; fetchFeatureFlags(); };
const handleCurrentChange = (newPage) => { pagination.page = newPage; fetchFeatureFlags(); };
const formatDateTime = (isoString) => isoString ? new Date(isoString).toLocaleString() : '';

// --- 新增/编辑弹窗 ---
const dialogVisible = ref(false);
const isSubmitting = ref(false);
const isLoadingDetails = ref(false);
const formRef = ref(null);
const form = reactive({ id: null, name: '', description: '', status: true, whitelist_rules: [] });
const newRule = reactive({ accountId: '', userIdsStr: '' });

const rules = reactive({ name: [{ required: true, message: '名称不能为空', trigger: 'blur' }] });
const dialogTitle = computed(() => form.id ? '编辑功能开关' : '新增功能开关');

const addRule = () => {
  if (!newRule.accountId) { ElMessage.warning('请输入账户ID'); return; }
  const userIdsArray = newRule.userIdsStr.split(',').map(id => id.trim()).filter(id => id !== '');
  if (userIdsArray.length === 0) { ElMessage.warning('请输入至少一个有效的用户ID'); return; }
  form.whitelist_rules.push({ accountId: newRule.accountId, userIds: userIdsArray });
  newRule.accountId = '';
  newRule.userIdsStr = '';
};

const deleteRule = (index) => { form.whitelist_rules.splice(index, 1); };

const handleCreate = () => { dialogVisible.value = true; };

const handleEdit = async (row) => {
  dialogVisible.value = true;
  isLoadingDetails.value = true;
  form.id = row.id;
  try {
    const response = await getFeatureFlagDetailsApi(currentEnvId.value, row.id);
    const details = response.data;
    form.name = details.name;
    form.status = details.status;
    form.description = details.description;
    form.whitelist_rules = details.whitelist_rules || [];
  } catch (error) {
    ElMessage.error('获取开关详情失败');
    dialogVisible.value = false;
  } finally {
    isLoadingDetails.value = false;
  }
};

const handleDialogClose = () => {
  if (formRef.value) { formRef.value.resetFields(); }
  form.id = null;
  form.description = '';
  form.whitelist_rules = [];
  newRule.accountId = '';
  newRule.userIdsStr = '';
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true;
      try {
        const dataToSubmit = { name: form.name, description: form.description, status: form.status, whitelist_rules: form.whitelist_rules };
        if (form.id) {
          await updateFeatureFlagApi(currentEnvId.value, form.id, dataToSubmit);
          ElMessage.success('更新成功');
        } else {
          await createFeatureFlagApi(currentEnvId.value, dataToSubmit);
          ElMessage.success('创建成功');
        }
        dialogVisible.value = false;
        fetchFeatureFlags();
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
  ElMessageBox.confirm(`确定要删除开关 "${row.name}" 吗？`, '警告', { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' })
    .then(async () => {
      try {
        await deleteFeatureFlagApi(currentEnvId.value, row.id);
        ElMessage.success('删除成功');
        fetchFeatureFlags();
      } catch (error) {
        ElMessage.error(error.message || '删除失败');
      }
    }).catch(() => { ElMessage.info('已取消删除'); });
};
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.table-controls { margin-bottom: 20px; display: flex; }
.search-input { width: 300px; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
.rule-creator { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
.rule-input-account { flex: 1; }
.rule-input-users { flex: 2; }
</style>
