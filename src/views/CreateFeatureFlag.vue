<template>
  <div class="create-feature-flag-page">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <span>创建功能开关</span>
        </div>
      </template>

      <el-form :model="form" label-position="top">
        <el-row :gutter="40">
          <el-col :span="12">
            <el-form-item label="名称">
              <el-input v-model="form.name" placeholder="请输入功能开关的唯一名称" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input
                v-model="form.description"
                type="textarea"
                rows="4"
                placeholder="请输入详细描述，说明此开关的用途"
              />
            </el-form-item>
            <el-form-item label="标签">
              <el-tag
                v-for="tag in form.tags"
                :key="tag"
                class="mx-1"
                closable
                :disable-transitions="false"
                @close="handleTagClose(tag)"
              >
                {{ tag }}
              </el-tag>
              <el-input
                v-if="tagInputVisible"
                ref="InputRef"
                v-model="tagInputValue"
                class="ml-1 w-20"
                size="small"
                @keyup.enter="handleTagInputConfirm"
                @blur="handleTagInputConfirm"
              />
              <el-button v-else class="button-new-tag ml-1" size="small" @click="showTagInput">
                + 添加标签
              </el-button>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="开关状态">
              <el-switch v-model="form.status" active-text="开" inactive-text="关" />
            </el-form-item>
            <el-form-item label="数据类型">
              <el-select v-model="form.dataType" placeholder="请选择返回的数据类型">
                <el-option label="布尔型" value="boolean" />
                <el-option label="字符串" value="string" />
                <el-option label="数字" value="number" />
                <el-option label="JSON" value="json" />
              </el-select>
            </el-form-item>
            <el-form-item label="过期策略">
              <el-select v-model="form.expirationPolicy" placeholder="默认永不过期">
                <el-option label="永不过期" value="none" />
                <el-option label="30天后自动下线" value="30d_ttl" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider />

        <el-form-item label="白名单">
          <el-input v-model="whitelistInput" placeholder="请输入用户ID，按回车键添加" @keyup.enter="addWhitelistUser" />
        </el-form-item>
        <div>
          <el-tag
            v-for="user in form.whitelist"
            :key="user"
            closable
            @close="removeWhitelistUser(user)"
            style="margin-right: 5px; margin-bottom: 5px;"
          >
            {{ user }}
          </el-tag>
        </div>

      </el-form>

      <template #footer>
        <div class="form-actions">
          <el-button @click="onCancel">取消</el-button>
          <el-button type="primary" @click="onSubmit">确认创建</el-button>
        </div>
      </template>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue';
import { ElMessage } from 'element-plus';

// --- Form Data ---
const form = reactive({
  name: '',
  description: '',
  tags: [],
  status: true,
  dataType: 'boolean',
  expirationPolicy: 'none',
  whitelist: [],
});

// --- Tag Input Logic ---
const tagInputVisible = ref(false);
const InputRef = ref(null);
const tagInputValue = ref('');

const handleTagClose = (tag) => {
  form.tags.splice(form.tags.indexOf(tag), 1);
};

const showTagInput = () => {
  tagInputVisible.value = true;
  nextTick(() => {
    InputRef.value.input.focus();
  });
};

const handleTagInputConfirm = () => {
  if (tagInputValue.value) {
    form.tags.push(tagInputValue.value);
  }
  tagInputVisible.value = false;
  tagInputValue.value = '';
};

// --- Whitelist Logic ---
const whitelistInput = ref('');

const addWhitelistUser = () => {
  if (whitelistInput.value && !form.whitelist.includes(whitelistInput.value)) {
    form.whitelist.push(whitelistInput.value);
  }
  whitelistInput.value = '';
};

const removeWhitelistUser = (user) => {
  form.whitelist.splice(form.whitelist.indexOf(user), 1);
};

// --- Form Actions ---
const onSubmit = async () => {
  console.log('Submitting form:', form);
  // try {
  //   // const response = await api.featureFlags.create(form);
  //   ElMessage.success('功能开关创建成功！');
  //   // router.push('/feature-flags'); // Redirect to the list page
  // } catch (error) {
  //   ElMessage.error(error.message || '创建失败');
  // }
  ElMessage.info('正在模拟提交...请在控制台查看数据');
};

const onCancel = () => {
  // router.back();
  ElMessage.info('操作已取消');
};

</script>

<style scoped>
.form-card {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  font-size: 20px;
  font-weight: bold;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.mx-1 {
  margin-right: 5px;
}

.ml-1 {
  margin-left: 5px;
}

.w-20 {
  width: 120px;
}

.button-new-tag {
  margin-left: 5px;
}
</style>