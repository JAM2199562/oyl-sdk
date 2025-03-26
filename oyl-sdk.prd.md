# oyl-sdk RPC 节点配置改造需求

## 目标

将 oyl-sdk 中硬编码的 sandshrew.io RPC 节点地址修改为可通过环境变量配置的方式，使开发者能够灵活指定自托管的 Alkanes RPC 服务。

## 修改内容

### 1. 添加环境变量支持

在项目根目录添加/修改 `.env` 文件支持，添加以下环境变量：

```bash
# RPC 节点配置
ALKANES_RPC_URL=http://localhost:18888  # 默认为本地测试节点
ALKANES_PROJECT_ID=                     # 可选，用于特定服务认证
ALKANES_VERSION=v2                      # API 版本
```

### 2. 修改 Provider 配置

**文件路径**：`src/cli/constants.ts`

将硬编码的 sandshrew.io 地址替换为环境变量：

```typescript
// 修改前
export const DEFAULT_PROVIDER = {
  // ...
  bitcoin: new Provider({
    url: 'https://mainnet.sandshrew.io',
    version: 'v2',
    projectId: process.env.SANDSHREW_PROJECT_ID!,
    network: bitcoin.networks.bitcoin,
    networkType: 'mainnet',
  }),
  // ...
}

// 修改后
export const DEFAULT_PROVIDER = {
  // ...
  bitcoin: new Provider({
    url: process.env.ALKANES_RPC_URL || 'https://mainnet.sandshrew.io',
    version: process.env.ALKANES_VERSION || 'v2',
    projectId: process.env.ALKANES_PROJECT_ID || process.env.SANDSHREW_PROJECT_ID!,
    network: bitcoin.networks.bitcoin,
    networkType: 'mainnet',
  }),
  // ...
}
```

### 3. 修改其他硬编码的 URL 引用

使用 grep 搜索项目中所有包含 "sandshrew.io" 的文件，并将硬编码的 URL 替换为环境变量引用。

## 实施步骤

1. 添加 dotenv 依赖处理（如果尚未添加）
2. 在项目入口文件添加环境变量加载
3. 修改 constants.ts 中的配置
4. 修改其他硬编码的 URL 引用
5. 创建 .env.example 文件作为示例配置
6. 更新 README.md 添加配置说明

## 示例配置

### .env.example 文件

```bash
# RPC 节点配置
# 使用自托管的 Alkanes 节点
ALKANES_RPC_URL=http://your-server:18888
ALKANES_PROJECT_ID=your-project-id
ALKANES_VERSION=v2

# 兼容旧配置
SANDSHREW_PROJECT_ID=your-project-id
```

### 使用自托管 Alkanes 的配置示例

```javascript
// 自托管 Alkanes 服务设置
// 1. 运行比特币全节点
// 2. 安装并运行 Alkanes 容器:
//    git clone https://github.com/kungfuflex/alkanes --recurse-submodules
//    cd alkanes
//    docker-compose up -d
// 3. 设置环境变量指向本地节点:
//    ALKANES_RPC_URL=http://localhost:18888
``` 