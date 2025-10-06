## Java 11+ SDK 示例 (最终版: 工具类)

本示例为您提供一个静态工具类 `FacetUtil`，旨在最大程度地简化与 Facet SDK 的集成。它实现了“懒汉式”自动初始化，通过环境变量获取配置，**无需任何手动初始化步骤**。

### 使用方法

1.  **设置环境变量**: 在您的应用部署环境中，设置以下两个环境变量：
    - `FACET_BASE_URL`: 您 Facet 后端服务的地址 (例如: `http://localhost:8080`)。
    - `FACET_SDK_KEY`: 您要使用的环境的 SDK 密钥。

2.  **调用评估**: 在任何需要进行功能开关判断的业务代码中，直接调用静态方法 `FacetUtil.evaluate()`。

### 主要特性

- **零初始化**: 无需调用任何 `init()` 方法，首次使用时会自动从环境变量加载配置。
- **静态工具类**: 无需创建和管理实例，通过 `FacetUtil.evaluate()` 直接调用，简单方便。
- **线程安全**: 初始化过程是线程安全的，可放心在多线程环境中使用。
- **现代 `HttpClient`**: 内部使用高性能的 `HttpClient` 单例进行通信。
- **零依赖**: 完全依赖标准的 Java SE API。

### 代码: `Java11Demo.java` (已重构为 `FacetUtil`)

```java
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class FacetUtil {

    private static volatile boolean initialized = false;
    private static String baseUrl;
    private static String sdkKey;
    private static HttpClient httpClient;

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

                    httpClient = HttpClient.newBuilder()
                            .version(HttpClient.Version.HTTP_2)
                            .connectTimeout(Duration.ofSeconds(5))
                            .build();
                    
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

        try {
            URI uri = new URI(buildUrlString(featureName, userId, accountId));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(uri)
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                System.err.printf("评估失败: API 返回了非 200 的状态码。状态码: %d, URL: %s, 响应体: %s%n",
                        response.statusCode(), uri, response.body());
                return false;
            }

            Matcher matcher = MATCHED_PATTERN.matcher(response.body());
            if (matcher.find()) {
                return Boolean.parseBoolean(matcher.group(1));
            } else {
                System.err.printf("评估失败: 响应 JSON 中缺少 'matched' 字段或格式不正确。响应: %s%n", response.body());
                return false;
            }

        } catch (Exception e) {
            System.err.printf("评估过程中发生未知异常: %s%n", e.getMessage());
            return false;
        }
    }

    private static String buildUrlString(String featureName, String userId, String accountId) {
        StringBuilder urlString = new StringBuilder(baseUrl + "/api/v1/evaluate?");
        try {
            urlString.append("sdk_key=").append(URLEncoder.encode(sdkKey, StandardCharsets.UTF_8.name()));
            urlString.append("&feature_name=").append(URLEncoder.encode(featureName, StandardCharsets.UTF_8.name()));

            if (userId != null && !userId.isEmpty()) {
                urlString.append("&user_id=").append(URLEncoder.encode(userId, StandardCharsets.UTF_8.name()));
            }
            if (accountId != null && !accountId.isEmpty()) {
                urlString.append("&account_id=").append(URLEncoder.encode(accountId, StandardCharsets.UTF_8.name()));
            }
        } catch (java.io.UnsupportedEncodingException e) {
            throw new RuntimeException(e);
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
