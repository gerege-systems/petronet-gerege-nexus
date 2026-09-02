# PetroNet System

**蒙古国燃料监测与管理一体化平台**

**PetroNet** 把蒙古国石油产品的进口、储存、配送与零售汇入一条数据流，实时监控，
并让监管机构、燃料企业和司机看到同一组数字。系统为矿产资源与石油管理局（AMGTG）
建设，将取代现行的 **mpetro** 系统 —— 参见[系统需求](https://plan.petronet.mn/)。

<p>
  <a href="../README.md"><img src="assets/icons/flag-mn.png" width="18" height="18" alt=""> Монгол</a>
  &nbsp;·&nbsp;
  <a href="README_AR.md"><img src="assets/icons/flag-ar.png" width="18" height="18" alt=""> العربية</a>
  &nbsp;·&nbsp;
  <img src="assets/icons/flag-zh.png" width="18" height="18" alt=""> <b>中文</b>
  &nbsp;·&nbsp;
  <a href="README_EN.md"><img src="assets/icons/flag-en.png" width="18" height="18" alt=""> English</a>
  &nbsp;·&nbsp;
  <a href="README_FR.md"><img src="assets/icons/flag-fr.png" width="18" height="18" alt=""> Français</a>
  &nbsp;·&nbsp;
  <a href="README_RU.md"><img src="assets/icons/flag-ru.png" width="18" height="18" alt=""> Русский</a>
  &nbsp;·&nbsp;
  <a href="README_ES.md"><img src="assets/icons/flag-es.png" width="18" height="18" alt=""> Español</a>
</p>

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](../LICENSE)
[![Go Version](https://img.shields.io/badge/Go-1.26-00ADD8.svg)](https://go.dev)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black.svg)](https://nextjs.org)

---

## 目录

- [问题](#问题)
- [平台做什么](#平台做什么)
- [核心设计](#核心设计)
- [监管链](#监管链)
- [已经完成的部分](#已经完成的部分)
- [如何构建](#如何构建)
- [仓库结构](#仓库结构)
- [快速开始](#快速开始)
- [配置](#配置)
- [部署](#部署)
- [测试](#测试)
- [安全](#安全)
- [文档索引](#文档索引)

---

## 问题

蒙古国有 200 多家燃料企业、110 多个油库和 1500 多座加油站。它们的数据分散在两套
互不相通的系统里，而且大部分是每周一到两次**手工录入**的。

没有任何一个地方能立刻回答：此刻哪个牌号、多少升、在什么位置。于是国家储备只能
凭估算管理；一旦供应收紧，剩下的就只有粗糙的手段——单双号、每次加油 ₮50,000 的
统一上限，以及排队。

这不只是供应问题，更是信息问题——而信息问题正是软件真正能解决的那一类。

## 平台做什么

| | | 公开页面 |
| --- | --- | --- |
| 1 | **监管链**——进口合同 → 海关 → 化验 → 油库 → 运输 → 加油站油罐 → 油枪 → 用户。每一升都能追溯到它所属的批次。 | [`/supply`](https://petronet.mn/supply) |
| 2 | **加油站 POS**——一层驱动，能与任何厂商的加油机和液位仪对话，从现代前庭控制器到脉冲计数器；断网时照常营业。 | [`/stations`](https://petronet.mn/stations) |
| 3 | **代金券**——只有实际到货的燃料才会生成额度，再按距离、需求和等待时长分配。 | [`/vouchers`](https://petronet.mn/vouchers) |
| 4 | **国家监管**——库存、价格、质量、税收与差异集中在一块看板上，底下是不可改写的审计链。 | [`/oversight`](https://petronet.mn/oversight) |

同一套基础设施有两种运行模式。危机时它负责配给：限额与配额几分钟内可调，优先类别
保有专属储备，代金券带时间窗发放。平时它负责监管：税收、价格、质量与库存监控，
"进口—储存—销售"自动对账，需求预测与战略储备预警。

## 核心设计

> **代金券不是承诺，而是已预留的一升油。**

只有当燃料实际进入加油站油罐、且自动液位仪确认液位上升之后，代金券才会产生。

由此得出两点。系统永远不会承诺超过它拥有的量，队伍也就没有形成的理由；而不上报
到货的加油站不会产生任何代金券，也就没有人被指引过去——合规由设计强制执行，而不
靠检查员。

## 监管链

| 环节 | 记录什么 | 来源 |
| --- | --- | --- |
| 进口 | 合同、供应商、牌号、吨位、贸易术语、价格、预计日期 | 进口商门户 / API |
| 口岸 | 报关单号、HS 编码、税费、口岸 | 海关 |
| 质量 | 辛烷值、密度、硫、水分、化验证书 | 认可实验室 |
| 计量 | 观测升数、温度、密度 → **15 °C 下的升数** | ASTM D1250 / API MPMS 11.1 |
| 油库 | 油罐、容量、液位、余量、划入国家储备的数量 | 液位仪 |
| 运输 | 油罐车、司机、装载量、目的地、GPS 轨迹、电子铅封 | 承运方模块 |
| 加油站 | 接收量、液位上升、差异、接收人员 | 液位仪 + 人工确认 |
| 油枪 | 累计表、每笔交易的升数与金额、班次读数 | 前庭控制器 |
| 用户 | 额度、代金券、核销、票据、增值税 | PetroNet + e-Barimt |

每个环节都与上一个环节对账，因此差异会直接指出它出现的时间、地点和责任方。

## 已经完成的部分

这不是计划，而是仓库中已有内容的清单：有测试，并在真实的 PostgreSQL 上运行过。
完整列表与后续安排见[开发计划](https://plan.petronet.mn/plan/)。

- 油库与加油站登记、车牌、状态、通过 XYP 的核验
- 产品字典，采用 JODI 分类，七个牌号
- 监管机构权限，背后是行级安全策略
- 策略即数据——限额、容差、期限，无需发版即可修改
- 加油站技术台账（A–D 类）
- 报告期、报送、明细行与结论
- 校验规则——平衡、连续性、容量、偏差、计量
- 15 °C 体积换算（ASTM D1250 / API MPMS 11.1）
- 报告版本管理及其上的哈希链
- Excel 模板的导出与导入
- 审核流程——批准、退回、四眼原则
- 出入库记录，含车牌、关闭状态与差异
- 全国日汇总、覆盖率、可用天数
- 缺报数据检测与覆盖缺口报告
- ΔA–ΔE 对账
- 七种报表，Excel 与 CSV，可定时并邮件发送
- 开放数据：`/api/v1/petro/public/daily` 的全国日汇总
- 企业报送界面与监管机构界面

## 如何构建

PetroNet 是 [Gerege Nexus](https://github.com/gerege-systems/open-gerege-nexus)
平台的**二级发行版**。本仓库不含内核代码——`go.mod` 里的一行就是全部。这里存放的
是燃料业务逻辑（`modules/petro/`），以及为它构建的地图、运营界面和公开页面
（`frontend/`）。

模块通过公开的 `pkg/nexus` 契约注册自己的路由、菜单、权限和迁移，并编译进同一个
Go 二进制。身份、租户、RBAC、SSO、报表和审计链来自平台，不在此重写。

该部署自行完成身份认证：自有登录、自有 OIDC issuer、自有数据库。公民通过
[eID Mongolia](https://eidmongolia.mn) 识别，而不是靠一个本系统必须保管的密码。

## 仓库结构

```
main.go                   注册 petro 模块并启动平台宿主
modules/petro/            燃料模块：登记、报表、监管、代金券
  migrations/             该模块的 SQL，单一历史
cmd/petro-import/         现有 mpetro 数据的导入工具
catalog/                  应用目录、清单与版本编年
frontend/                 Next.js 前端——公开站点、地图、运营界面
deploy/                   Dockerfile、compose 栈、监控、备份脚本
nginx/                    本次部署对外的六个虚拟主机
docs/                     本文档，七种语言
```

## 快速开始

前置条件：Go 1.26+、Node.js 20+、PostgreSQL 16+（或 Docker）。

```bash
# 一次全部启动
docker compose -f deploy/docker-compose.yml up -d

# 或只启动 API
go run .

# 以及前端
cd frontend && npm ci && npm run dev
```

前端在 [http://localhost:3000](http://localhost:3000) 上响应。

尚未创建组织的部署会把所有访客送往 `/setup`。向导所需的令牌在启动时向 API 日志
写入一次：

```bash
docker logs gerege_petronet_backend 2>&1 | grep -i "setup token"
```

## 配置

完整列表见 [`.env.example`](../.env.example)。决定部署行为的关键值：

| 变量 | 说明 |
| --- | --- |
| `PUBLIC_ORIGIN` | 本实例对外地址。在一处同时定义 CORS、OIDC issuer 与 eID 回调 |
| `PETRONET_POSTGRES_PASSWORD` | 本栈自己的数据库 |
| `SSO_DEFAULT_CLIENT_SECRET` | 生产环境缺少它平台拒绝启动 |
| `BRAND_*` | 部署的名称、描述、配色与图标 |
| `SERVICE_URL_*` | 控制台、数据仓库、备份、监控与文档的地址。首页只绘制已配置的那些 |
| `EID_RP_UUID` / `EID_RP_SECRET` | eID 依赖方凭据。缺少则无法使用 eID 登录 |
| `CONTROL_PLANE_HOST` | 运营控制台唯一应答的主机名 |
| `PROMETHEUS_URL` | 控制台读取平台健康状况的来源 |

## 部署

生产主机上有 `/opt/petronet/`——`src/`（本仓库）、`.env`（chmod 600）和
`brand/`。更新只需两条命令：

```bash
cd /opt/petronet/src && git pull && ./deploy.sh
```

`deploy.sh` 从本仓库同时构建后端与前端镜像，因此 API、地图和运营界面始终以同一个
修订版发布。

六个主机名并列存在：平台（`petronet.mn`）、运营控制台（`admin.`）、监控
（`monitor.`）、数据仓库图（`dwh.`）、本文档（`docs.`）与备份说明
（`backups.`）。它们各自是什么，以及 nginx 配置中的陷阱，见
[本部署文档](DEPLOYMENT.md)。

## 测试

```bash
go vet ./... && go test -race ./...     # Go：单元测试与 PostgreSQL 集成测试
cd frontend && npm test && npm run build
```

CI 在每次 push 和 pull request 上运行两者，并构建两个 Docker 镜像。

## 安全

- 会话令牌是随机的 256 位值；只存储其 SHA-256 摘要。
- 密码使用 bcrypt 哈希，登录尝试受频率限制。
- 租户数据由数据库角色、租户上下文和已声明表上的行级安全隔离。监管机构的可见
  范围是 SQL 中的策略，而不是处理器里的一次判断。
- 报告版本以哈希相连，已批准的报送无法在链上不留痕迹地被修改。
- 运营控制台拥有独立的身份、cookie、审计链和数据库角色，且只在
  `CONTROL_PLANE_HOST` 上应答。

漏洞请按 [`SECURITY.md`](../SECURITY.md) 所述方式报告。

## 文档索引

| 文档 | 说明 |
| --- | --- |
| [文档中心](README.md) | 全部文档与译文 |
| [系统需求](https://plan.petronet.mn/) | 客户提出了什么要求 |
| [开发计划](https://plan.petronet.mn/plan/) | 已完成什么、接下来做什么、验收标准 |
| [国际实践](https://plan.petronet.mn/benchmarks/) | 其他国家如何解决，哪些失败了 |
| [本次部署](DEPLOYMENT.md) | 主机名、端口、备份——仅限本主机 |
| [架构](ARCHITECTURE.md) | 平面、schema、数据如何隔离 |
| [编写模块](MODULES.md) | `pkg/nexus` 契约 |
| [运维](OPERATIONS.md) | 部署、监控、备份与恢复 |
| [应急手册](RUNBOOKS.md) | 出问题时怎么办 |
| [翻译](TRANSLATION.md) | 语言政策与生成器 |
| [参与贡献](../CONTRIBUTING.md) · [安全](../SECURITY.md) · [行为准则](../CODE_OF_CONDUCT.md) | 项目规范 |

---

## 许可证

Copyright (c) 2026 **Gerege Systems Development Team, Gerege Nomadica
Foundation**。依 Apache 2.0 许可证分发——见 [`LICENSE`](../LICENSE)。

国旗图标来自 [Flaticon](https://www.flaticon.com/)
（[署名](assets/icons/ATTRIBUTION.md)）。
