## Java 8 SDK 示例 (最终版: 工具类)

本示例专为 Java 8 设计，旨在提供一个简单易用的静态工具类 `FacetUtil`，同时保证其在旧版 Java 环境中的广泛兼容性。它实现了“懒汉式”自动初始化，通过环境变量获取配置，**无需任何手动初始化步骤**。

### 使用方法

1.  **设置环境变量**: 在您的应用部署环境中，设置以下两个环境变量：
    - `FACET_BASE_URL`: 您 Facet 后端服务的地址 (例如: `http://localhost:8080`)。
    - `FACET_SDK_KEY`: 您要使用的环境的 SDK 密钥。

2.  **调用评估**: 在任何需要进行功能开关判断的业务代码中，直接调用静态方法 `FacetUtil.evaluate()`。

### 主要特性

- **零初始化**: 无需调用任何 `init()` 方法，首次使用时会自动从环境变量加载配置。
- **静态工具类**: 无需创建和管理实例，通过 `FacetUtil.evaluate()` 直接调用，简单方便。
- **线程安全**: 初始化过程是线程安全的，可放心在多线程环境中使用。
- **最佳兼容性**: 仅使用 Java 8 标准 API (`HttpURLConnection`) 构建，确保其在旧系统上无需任何修改即可运行。
- **零依赖**: 完全依赖标准的 Java SE API。

### 代码: `Java8Demo.java` (已重构为 `FacetUtil`)

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class FacetUtil {

    private static volatile boolean initialized = false;
    private static String baseUrl;
    private static String sdkKey;

    private static final Pattern MATCHED_PATTERN = Pattern.compile("\"matched\"\\s*:\\s*(true|false)");
    private static final Object LOCK = new Object();

    private FacetUtil() {}

    private static void ensureInitialized() {
        if (!initialized) {
            synchronized (LOCK) {
                if (!initialized) {
                    baseUrl = System.getenv("FACET_BASE_URL");
                    sdkKey = System.getenv("FACET_SDK_KEY");

                    if (baseUrl == null || baseUrl.trim().isEmpty()) {
                        throw new IllegalStateException("环境变量 FACET_BASE_URL 未设置或为空");
                    }
                    if (sdkKey == null || sdkKey.trim().isEmpty()) {
                        throw new IllegalStateException("环境变量 FACET_SDK_KEY 未设置或为空");
                    }
                    
                    initialized = true;
                }
            }
        }
    }

    public static boolean evaluate(String featureName, String accountId, String userId) {
        ensureInitialized();

        if (featureName == null || featureName.trim().isEmpty()) {
            System.err.println("错误: 功能开关名称 (featureName) 不能为空。");
            return false;
        }

        HttpURLConnection connection = null;
        try {
            URL url = new URL(buildUrlString(featureName, userId, accountId));

            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(3000);
            connection.setDoOutput(false);

            int responseCode = connection.getResponseCode();
            if (responseCode != HttpURLConnection.HTTP_OK) {
                System.err.printf("评估失败: API 返回了非 200 的状态码。状态码: %d, URL: %s%n", responseCode, url);
                return false;
            }

            StringBuilder responseBody = new StringBuilder();
            try (BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = in.readLine()) != null) {
                    responseBody.append(line);
                }
            }

            Matcher matcher = MATCHED_PATTERN.matcher(responseBody.toString());
            if (matcher.find()) {
                return Boolean.parseBoolean(matcher.group(1));
            } else {
                System.err.printf("评估失败: 响应 JSON 中缺少 'matched' 字段或格式不正确。响应: %s%n", responseBody);
                return false;
            }

        } catch (Exception e) {
            System.err.printf("评估过程中发生未知异常: %s%n", e.getMessage());
            return false;
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private static String buildUrlString(String featureName, String userId, String accountId) throws IOException {
        StringBuilder urlString = new StringBuilder(baseUrl + "/api/v1/evaluate?");
        urlString.append("sdk_key=").append(URLEncoder.encode(sdkKey, "UTF-8"));
        urlString.append("&feature_name=").append(URLEncoder.encode(featureName, "UTF-8"));

        if (userId != null && !userId.isEmpty()) {
            urlString.append("&user_id=").append(URLEncoder.encode(userId, "UTF-8"));
        }
        if (accountId != null && !accountId.isEmpty()) {
            urlString.append("&account_id=").append(URLEncoder.encode(accountId, "UTF-8"));
        }
        return urlString.toString();
    }

    public static void main(String[] args) {
        // 重要：在运行此示例前，请确保已设置以下环境变量:
        // export FACET_BASE_URL="http://www.baidu.coom"
        // export FACET_SDK_KEY="your-environment-sdk-key"

        // 现在，您可以直接调用 evaluate 方法，无需任何初始化步骤。
        String featureName = "new-dashboard";
        String currentUserId = "user-123";
        String currentAccountId = "corp-a";

        boolean showNewDashboard = FacetUtil.evaluate(featureName, currentAccountId, currentUserId);

        if (showNewDashboard) {
            System.out.println("评估结果: true. 正在为用户 user-123 展示新版仪表盘。");
        } else {
            System.out.println("评估结果: false. 正在为用户 user-123 展示旧版仪表盘。");
        }
    }
}
```

**关于JSON解析的说明:**

为简单起见并避免引入外部依赖，本示例使用正则表达式从JSON响应中解析 `matched` 字段。在生产环境中，强烈建议使用一个健壮的JSON解析库（如 `Jackson` 或 `Gson`）来更安全、更可靠地处理API响应。
