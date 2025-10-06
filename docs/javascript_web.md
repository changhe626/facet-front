## 浏览器环境 SDK 示例 (最终版)

本示例为您提供一个用于浏览器环境的独立 JavaScript 脚本。它实现了“懒汉式”自动初始化，通过读取自身 `<script>` 标签上的 `data-*` 属性来获取配置，**无需任何手动初始化调用**，对前端开发者极其友好。

### 使用方法

1.  **引入脚本**: 在您的 HTML 文件的 `<body>` 底部，像下面这样引入 `web.js` 脚本，并务必填入正确的 `id`、`data-base-url` 和 `data-sdk-key`。
    ```html
    <script 
      src="./web.js" 
      id="facet-sdk-script" 
      data-base-url="http://www.baidu.coom" 
      data-sdk-key="your-environment-sdk-key"
    ></script>
    ```

2.  **调用评估**: 在您的业务逻辑脚本中（该脚本必须在 `web.js` 之后引入），直接调用全局函数 `facetEvaluate()`。
    ```javascript
    async function checkFeature() {
        const show = await facetEvaluate('new-feature', 'account-123', 'user-abc');
        if (show) {
            // 渲染新功能...
        }
    }
    
    checkFeature();
    ```

### 主要特性

- **零初始化**: 无需在 JavaScript 中调用任何 `init()` 方法。
- **HTML 标签配置**: 直接在 `<script>` 标签上通过 `data-*` 属性进行配置，直观且便于管理。
- **全局函数**: 提供一个简单的全局函数 `facetEvaluate()`，在任何地方都可以轻松调用。
- **现代 `fetch` API**: 使用所有现代浏览器都内置的 `fetch` API，无需第三方依赖。
- **异步设计**: 基于 `async/await`，易于集成到任何前端框架或原生 JavaScript 应用中。

### 代码: `web.js`

```javascript
/**
 * Facet 功能开关评估模块 (浏览器环境 最终版)
 */

(function(window) {
    // 内部状态变量
    let _initialized = false;
    let _baseUrl;
    let _sdkKey;

    const SCRIPT_ID = "facet-sdk-script";

    /**
     * 确保模块已通过 <script> 标签的 data-* 属性完成初始化。
     */
    function _ensureInitialized() {
        if (!_initialized) {
            const scriptTag = document.getElementById(SCRIPT_ID);
            if (!scriptTag) {
                throw new Error(`错误: 无法找到ID为 "${SCRIPT_ID}" 的 <script> 标签。请确保您的 script 标签包含了该 ID。`);
            }

            _baseUrl = scriptTag.dataset.baseUrl;
            _sdkKey = scriptTag.dataset.sdkKey;

            if (!_baseUrl || _baseUrl.trim() === "") {
                throw new Error(`错误: 未在 <script> 标签中找到 "data-base-url" 属性，或该属性为空。`);
            }
            if (!_sdkKey || _sdkKey.trim() === "") {
                throw new Error(`错误: 未在 <script> 标签中找到 "data-sdk-key" 属性，或该属性为空。`);
            }
            
            _initialized = true;
        }
    }

    /**
     * 核心评估方法
     */
    async function evaluate(featureName, accountId, userId) {
        try {
            _ensureInitialized();
        } catch (error) {
            console.error(error.message);
            return Promise.resolve(false);
        }

        if (!featureName || featureName.trim() === "") {
            console.error("错误: 功能开关名称 (featureName) 不能为空。");
            return Promise.resolve(false);
        }

        const params = new URLSearchParams({
            sdk_key: _sdkKey,
            feature_name: featureName,
        });

        if (userId) {
            params.append('user_id', userId);
        }
        if (accountId) {
            params.append('account_id', accountId);
        }

        const url = `${_baseUrl}/api/v1/evaluate?${params.toString()}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(3000) // 3秒超时
            });

            if (!response.ok) {
                console.error(`评估失败: API 返回了非成功的状态码。状态码: ${response.status}, URL: ${url}`);
                return false;
            }

            const apiResponse = await response.json();

            if (apiResponse && typeof apiResponse.data === 'object' && typeof apiResponse.data.matched === 'boolean') {
                return apiResponse.data.matched;
            } else {
                console.error("评估失败: 响应 JSON 格式不正确或缺少 'data.matched' 字段。", apiResponse);
                return false;
            }

        } catch (error) {
            console.error(`评估过程中发生网络或未知异常:`, error);
            return false;
        }
    }

    // 将 evaluate 函数暴露到全局作用域，方便调用
    window.facetEvaluate = evaluate;

})(window);
```
