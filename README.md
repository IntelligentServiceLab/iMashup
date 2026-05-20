# iMashup

基于大模型的智能化 Mashup 应用开发工具。

## 目录

1. **[项目简介](#项目简介)**
2. **[功能特性](#功能特性)**
3. **[技术栈](#技术栈)**

- **[前端](#前端)**
- **[后端](#后端)**
- **[推荐服务](#推荐服务)**

4. **[项目文件说明](#项目文件说明)**

- **[iMashup_front](#iMashup_front)**
- **[iMashup_backend](#iMashup_backend)**
- **[iMashup_service](#iMashup_service)**

5. **[项目启动顺序](#项目启动顺序)**

## 项目简介

iMashup 是一个结合大语言模型、低代码开发与 Mashup 服务组合技术的智能化应用开发平台。

系统采用前后端分离架构，通过可视化流程编排方式帮助用户快速构建 API 工作流，并结合大模型实现：

* 用户需求语义理解
* 子任务自动拆解
* API 智能推荐
* 自动流程生成

从而降低 Mashup 应用开发门槛，提高开发效率。

## 功能特性

* 可视化工作流编排
* 节点拖拽与连接
* API 调用与执行
* 输入输出参数配置
* 流程执行与结果展示
* 大模型任务拆解
* API 智能推荐
* 工作流导入导出
* 登录注册与历史记录管理

## 技术栈

### 前端

* React
* TypeScript
* React Flow
* Ant Design
* Vite

### 后端

* Spring Boot
* Maven
* MyBatis Plus
* Redis
* MySQL

### 推荐服务

* Flask
* Sentence-Transformers
* FAISS
* RAG
* Large Language Model (LLM)

---

## 项目文件说明

本仓库包含 iMashup 工具的完整代码及数据库文件。

### 1. iMashup_front —— 前端代码

#### 运行方式

推荐使用 VSCode 运行

#### 安装依赖

```bash
npm install
```

#### 启动项目

```bash
npm run dev
```

#### 前端技术

* React
* TypeScript
* React Flow
* Ant Design
* Vite

### 2. iMashup_backend —— 后端代码

后端代码目录。

项目采用：

* Spring Boot
* Maven

#### 代码环境

* JDK 17

#### 启动方式

可通过 IntelliJ IDEA 启动 Spring Boot 项目。

#### 后端功能

* 用户登录注册
* 工作流管理
* API 调用
* 导入导出
* 会话管理
* 与 Python 推荐服务通信

### 3. iMashup_service —— 服务推荐代码

API 推荐与大模型相关代码目录。

#### 目录说明

##### models/sentence-transformers/all-MiniLM-L6-v2

用于 API 推荐功能的语义向量模型。

主要用于：

* 用户需求向量化
* API 描述向量化
* 相似度计算
* 语义检索

##### ServiceDiscovery

API 推荐服务代码。

主要实现：

* 用户需求解析
* 子任务处理
* 向量检索
* API 推荐
* RAG 相关逻辑

#### 相关技术

* Flask
* Sentence-Transformers
* FAISS

### 4. iMashup_data —— 数据库 SQL 代码

项目所使用的 MySQL 数据库文件。

#### 使用方式

可直接通过 MySQL Workbench 或 MySQL 命令行导入。

#### 注意事项

导入数据库后，需要保证后端配置文件中的：

* 数据库名称
* 用户名
* 密码

与实际导入后的 MySQL 配置保持一致，以及 Mapper 层中SQL语句对应的库。

## 系统特点

### 可视化低代码开发

用户可通过拖拽节点快速构建 API 工作流。

### 大模型智能推荐

结合 LLM 与 RAG 技术，实现：

* 需求理解
* 子任务划分
* API 智能推荐

### 服务组合自动化

自动完成：

* API 匹配
* 节点生成
* 流程构建

### 工作流持久化

支持：

* 本地导入导出
* 数据库存储
* 历史记录恢复

### 环境要求

### 前端

* Node.js 18+
推荐：
21.1.0
* npm

### 后端

* JDK 17
* Maven

### 数据库

* MySQL 8+

### Python

推荐：

* Python 3.10+

## 项目启动顺序

建议按照以下顺序启动：

1. 启动 MySQL 数据库
2. 导入 tool_service_tool 数据库
3. 启动 iMashup_backend
4. 启动 iMashup_service 中的 ServiceDiscovery 下的 Similarity-Search.py
5. 启动 iMashup_front

#### Contact
Email: 1400304200@qq.com (马嘉浩), 2085417395@qq.com (鲁晓荣)
