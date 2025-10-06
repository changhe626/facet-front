## Go 1.18 之前版本 SDK 示例 (最终版)

本示例为您提供一个可以直接运行的 Go 程序，它专为 Go 1.18 之前的旧版本环境设计，以保证其广泛的兼容性。它同样实现了“懒汉式”自动初始化，通过环境变量获取配置，**无需任何手动初始化步骤**。

此版本使用了已废弃的 `io/ioutil` 包，这是在 Go 1.16 中被 `io` 包取代之前的标准做法。

### 使用方法

1.  **设置环境变量**: 在您的终端或部署环境中，设置以下两个环境变量：
    ```shell
    export FACET_BASE_URL="http://www.baidu.coom"
    export FACET_SDK_KEY="your-environment-sdk-key"
    ```

2.  **运行代码**: 直接使用 `go run` 命令运行此文件。
    ```shell
    go run before_1_18.go
    ```

### 主要特性

- **零初始化**: 无需调用任何 `init()` 方法，首次使用时会自动从环境变量加载配置。
- **线程安全**: 使用 `sync.Once` 保证初始化过程在多 goroutine 环境下只执行一次，绝对安全。
- **环境变量配置**: 将配置与代码分离，提高了安全性与灵活性。
- **向后兼容**: 使用 `io/ioutil`，确保在 Go 1.18 之前的版本中也能正常编译和运行。
- **零依赖**: 完全依赖 Go 标准库。

### 代码: `before_1_18.go`

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil" // <-- 保持使用 ioutil 以兼容旧版本
	"net/http"
	"net/url"
	"os"
	"sync"
	"time"
)

var (
	initOnce   sync.Once
	baseUrl    string
	sdkKey     string
	httpClient *http.Client
)

type apiResponse struct {
	Data struct {
		Matched bool `json:"matched"`
	} `json:"data"`
}

func ensureInitialized() {
	initOnce.Do(func() {
		baseUrl = os.Getenv("FACET_BASE_URL")
		sdkKey = os.Getenv("FACET_SDK_KEY")

		if baseUrl == "" {
			panic("错误: 环境变量 FACET_BASE_URL 未设置或为空")
		}
		if sdkKey == "" {
			panic("错误: 环境变量 FACET_SDK_KEY 未设置或为空")
		}

		httpClient = &http.Client{
			Timeout: 10 * time.Second,
		}
	})
}

func evaluate(ctx context.Context, featureName, accountId, userId string) bool {
	ensureInitialized()

	if featureName == "" {
		fmt.Println("错误: 功能开关名称 (featureName) 不能为空。")
		return false
	}

	endpoint, err := url.Parse(baseUrl + "/api/v1/evaluate")
	if err != nil {
		fmt.Printf("错误: 解析基础 URL 失败: %v\n", err)
		return false
	}

	queryParams := url.Values{}
	queryParams.Set("sdk_key", sdkKey)
	queryParams.Set("feature_name", featureName)
	if userId != "" {
		queryParams.Set("user_id", userId)
	}
	if accountId != "" {
		queryParams.Set("account_id", accountId)
	}
	endpoint.RawQuery = queryParams.Encode()

	// 兼容旧版本的请求创建方式
	req, err := http.NewRequest("GET", endpoint.String(), nil)
	if err != nil {
		fmt.Printf("错误: 创建 HTTP 请求失败: %v\n", err)
		return false
	}
	req = req.WithContext(ctx)

	resp, err := httpClient.Do(req)
	if err != nil {
		fmt.Printf("评估过程中发生网络错误: %v\n", err)
		return false
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := ioutil.ReadAll(resp.Body) // <-- 使用 ioutil
		fmt.Printf("评估失败: API 返回了非 200 的状态码。状态码: %d, URL: %s, 响应体: %s\n",
			resp.StatusCode, endpoint.String(), string(bodyBytes))
		return false
	}

	bodyBytes, err := ioutil.ReadAll(resp.Body) // <-- 使用 ioutil
	if err != nil {
		fmt.Printf("评估失败: 读取响应体失败: %v\n", err)
		return false
	}

	var res apiResponse
	if err := json.Unmarshal(bodyBytes, &res); err != nil {
		fmt.Printf("评估失败: 解析 JSON 响应失败: %v, 响应体: %s\n", err, string(bodyBytes))
		return false
	}

	return res.Data.Matched
}

func main() {
	// 重要：在运行此示例前，请确保已设置以下环境变量:
	// export FACET_BASE_URL="http://www.baidu.coom"
	// export FACET_SDK_KEY="your-environment-sdk-key"

	// 现在，您可以直接调用 evaluate 方法，无需任何初始化步骤。
	featureName := "new-dashboard"
	currentUserID := "user-123"
	currentAccountID := "corp-a"

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	showNewDashboard := evaluate(ctx, featureName, currentAccountID, currentUserID)

	if showNewDashboard {
		fmt.Printf("评估结果: true. 正在为用户 %s 展示新版仪表盘。\n", currentUserID)
	} else {
		fmt.Printf("评估结果: false. 正在为用户 %s 展示旧版仪表盘。\n", currentUserID)
	}
}
```
