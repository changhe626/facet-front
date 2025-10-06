## Node.js v18+ SDK 示例 (最终版)

本示例为您提供一个独立的 JavaScript 模块，旨在最大程度地简化与 Facet SDK 的集成。它实现了“懒汉式”自动初始化，通过环境变量获取配置，**无需任何手动初始化步骤**。

此版本使用了 Node.js v18 起内置的 `fetch` API，是针对现代 Node.js 环境的推荐实现。

### 使用方法

1.  **设置环境变量**: 在您的终端或部署环境中，设置以下两个环境变量：
    ```shell
    export FACET_BASE_URL="http://www.baidu.coom"
    export FACET_SDK_KEY="your-environment-sdk-key"
    ```

2. **引入并调用**: 在您的业务代码中，引入 `evaluate` 函数并直接调用。
   ```javascript
   const { evaluate } = require('./javascript_after_node_18.md');

   async function checkFeature() {
       const show = await evaluate('new-feature', 'account-123', 'user-abc');
       if (show) {
           // ...
       }
   }
   ```

### 主要特性

- **零初始化**: 无需调用任何 `init()` 方法，首次使用时会自动从环境变量加载配置。
- **模块化**: 只暴露必需的 `evaluate` 函数，保持代码整洁。
- **环境变量配置**: 将配置与代码分离，提高了安全性与灵活性。
- **现代 `fetch` API**: 使用 Node.js v18+ 内置的 `fetch`，无需第三方依赖。
- **异步设计**: 基于 `async/await`，易于集成到现代 Node.js 应用中。

### 代码: `after_node_18.js`

```javascript
/**
 * Facet 功能开关评估模块 (Node.js v18+ 最终版)
 */

let _initialized = false;
let _baseUrl;
let _sdkKey;

function _ensureInitialized() {
    if (!_initialized) {
        _baseUrl = process.env.FACET_BASE_URL;
        _sdkKey = process.env.FACET_SDK_KEY;

        if (!_baseUrl || _baseUrl.trim() === "") {
            throw new Error("错误: 环境变量 FACET_BASE_URL 未设置或为空");
        }
        if (!_sdkKey || _sdkKey.trim() === "") {
            throw new Error("错误: 环境变量 FACET_SDK_KEY 未设置或为空");
        }
        
        _initialized = true;
    }
}

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
                'User-Agent': 'Facet-NodeJS-SDK/3.0'
            },
            signal: AbortSignal.timeout(3000)
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

module.exports = { evaluate };
```
