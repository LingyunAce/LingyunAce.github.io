---
title: RK3576 Ubuntu 固件项目:开发板定制实践与本地资料库
abbrlink: rk3576-ubuntu-firmware
date: 2026-08-03 15:00:00
tags: [RK3576, Ubuntu, 固件, LubanCat, 嵌入式开发]
categories: [技术博客]
---

这是本站作品集「技术博客」栏目的第一篇文章,记录我正在进行的一个嵌入式项目:**基于 LubanCat SDK 的 RK3576 开发板 Ubuntu 固件定制**。

## 项目背景

RK3576 是瑞芯微推出的高性能 SoC,集成了 8 核 CPU(4×A72 + 4×A53)与 6 TOPS NPU,常用于边缘 AI 与智能硬件场景。本项目在其开发板上定制 Ubuntu 22.04 固件,并集成 Hermes 本地语音助手能力。

## 环境拓扑

| 角色 | 位置 |
|------|------|
| 固件编译服务器 | `tx@192.168.1.35`,SDK 位于 `/home/tx/LubanCat_SDK_1` |
| 板卡运行环境 | `ostar@192.168.1.207` |
| 定制源码入口 | `ubuntu22.04/overlay-tx/`(SDK 内覆盖层) |
| 兼容入口 | `external/` 下的相对软链接 |

## 主要工作

### 1. 固件定制与构建

通过 SDK 的 overlay 机制定制 Ubuntu rootfs,规范构建入口:

```bash
cd /home/tx/LubanCat_SDK_1
./build_tx.sh                # 默认复用 rootfs 缓存,增量构建
./build_tx.sh --rebuild-rootfs   # rootfs 输入变更后必须全量重建
```

### 2. 离线语音识别(STT)集成

在板载 Hermes 中接入本地离线语音识别,采用 `faster-whisper==1.2.1` 与打包的 Base 模型(`/opt/hermes-models/faster-whisper-base`),ARM64 专用 wheels 隔离在 `overlay-tx/wheels/stt/` 下,避免污染主依赖解析器。配置为 `stt.provider: local` + `stt.local.model: base`。

**踩坑记录**:语音识别曾出现固定 15 秒报错——根因是并发的请求同时进入单例 faster-whisper 模型,而 `/api/audio/transcribe` 继承了通用的 15 秒 RPC 超时。修复方案:本地调用串行化 + 音频转写专用 120 秒超时(渲染进程与 Electron 主进程回退同时生效)。板卡热部署已完成,最终验收还需一次真实麦克风录音走通完整桌面流程。

### 3. 本地资料库管理

项目采用「本地资料库与 SDK 分离」的组织方式,不把 SDK 本体纳入版本管理:

| 目录 | 内容 |
|------|------|
| `patches/` | 系统、音频、Hermes、MonitorMCP 补丁索引 |
| `reports/daily/` | 按日期记录验证证据的日报 |
| `docs/` | 设计、计划、优化分析与历史记录 |
| `tools/` | 诊断、迁移、运行辅助脚本 |
| `artifacts/` | 固件、日志、录音、截图等构建产物 |
| `archive/` | 旧源码快照与只读历史归档 |

近期完成了第二阶段整理:空目录、缓存、失效 PID 等已隔离到 `archive/residue-20260723/`,大体积固件镜像(`*.img`)则通过 `.gitignore` 排除在版本管理之外,保证仓库轻量、可追溯。

## 小结

这个项目让我体会到:嵌入式固件开发中,**可复现的构建流程 + 证据驱动的文档记录 + 干净的版本管理**,三者缺一不可。后续我会持续更新固件构建、语音集成和板卡调试的实践细节。
