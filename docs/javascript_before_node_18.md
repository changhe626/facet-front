## Node.js v18 之前版本 SDK 示例 (最终版)

本示例为您提供一个独立的 JavaScript 模块，它专为旧版 Node.js (v10+) 环境设计，以保证其广泛的兼容性。它同样实现了“懒汉式”自动初始化，通过环境变量获取配置，**无需任何手动初始化步骤**。

此版本使用了 Node.js 内置的 `http` 和 `https` 模块来执行网络请求。

### 使用方法

1.  **设置环境变量**: 在您的终端或部署环境中，设置以下两个环境变量：
    ```shell
    export FACET_BASE_URL="http://www.baidu.coom"
    export FACET_SDK_KEY="your-environment-sdk-key"
    ```

2. **引入并调用**: 在您的业务代码中，引入 `evaluate` 函数并直接调用。
   ```javascript
   const { evaluate } = require('./javascript_before_node_18.md');

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
- **向后兼容**: 使用原生的 `http`/`https` 模块，确保在旧版 Node.js 中也能正常运行。
- **零依赖**: 完全依赖 Node.js 内置模块。

### 代码: `before_node_18.js`

```javascript
/**
 * Facet 功能开关评估模块 (Node.js v18 之前兼容版)
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

let _initialized = false;
let _baseUrl;
let _sdkKey;

const _matchedPattern = new RegExp('"matched"\\s*:\\s*(true|false)');

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

function evaluate(featureName, accountId, userId) {
    return new Promise((resolve) => {
        try {
            _ensureInitialized();
        } catch (error) {
            console.error(error.message);
            return resolve(false);
        }

        if (!featureName || featureName.trim() === "") {
            console.error("错误: 功能开关名称 (featureName) 不能为空。");
            return resolve(false);
        }

        try {
            const endpoint = new URL(_baseUrl + "/api/v1/evaluate");
            endpoint.searchParams.set("sdk_key", _sdkKey);
            endpoint.searchParams.set("feature_name", featureName);
            if (userId) {
                endpoint.searchParams.set("user_id", userId);
            }
            if (accountId) {
                endpoint.searchParams.set("account_id", accountId);
            }

            const protocol = endpoint.protocol === 'https:' ? https : http;

            const options = {
                method: 'GET',
                timeout: 3000,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Facet-NodeJS-SDK/3.0 (native)'
                }
            };

            const req = protocol.request(endpoint, options, (res) => {
                if (res.statusCode !== 200) {
                    console.error(`评估失败: API 返回了非 200 的状态码。状态码: ${res.statusCode}, URL: ${endpoint}`);
                    res.resume();
                    return resolve(false);
                }

                let rawData = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => { rawData += chunk; });
                res.on('end', () => {
                    try {
                        const match = rawData.match(_matchedPattern);
                        if (match && match[1]) {
                            resolve(match[1] === 'true');
                        } else {
                            console.error("评估失败: 响应 JSON 格式不正确或缺少 'data.matched' 字段。", rawData);
                            resolve(false);
                        }
                    } catch (e) {
                        console.error(`评估失败: 解析响应时发生异常: ${e.message}`);
                        resolve(false);
                    }
                });
            });

            req.on('error', (e) => {
                console.error(`评估过程中发生网络请求错误: ${e.message}`);
                resolve(false);
            });

            req.on('timeout', () => {
                console.error("评估失败: 请求超时。");
                req.destroy();
                resolve(false);
            });

            req.end();

        } catch (error) {
            console.error(`评估过程中发生未知异常: ${error.message}`);
            resolve(false);
        }
    });
}

module.exports = { evaluate };
```
