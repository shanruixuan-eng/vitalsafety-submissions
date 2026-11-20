# 惟泰安全供稿收集站 · 项目源码

本源码基于当前在线站点的第 5 版，源提交为 `33aa1d8508d402202530cf1b61c40c066ef52fda`。导出时保留了数据库与图片存储的绑定名称，并移除了在线站点的项目编号。

## 本地启动

解压后，用终端进入 `vitalsafety-submissions` 目录。使用 Node.js 22.13 或更新版本，首次安装依赖需要访问 npm 软件源。

```sh
npm run install:ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_moaning_freak.sql
npm start
```

初始化数据库的命令只需对一份新的本地数据库执行一次。启动后打开终端显示的地址。本地测试稿件和上传图片存放在项目的 `.wrangler/state` 目录。在线站点的访问控制由托管平台提供。

## 修改入口

| 要修改的内容 | 文件 |
| --- | --- |
| 首页、投稿流程、已收稿件页面 | `app/submission-desk.tsx` |
| 两类供稿字段、产品信息、图片规则及校验 | `lib/submissions.ts` |
| 首页可展开的试行规范 | `app/submission-policy.tsx` |
| 版式、颜色与响应式样式 | `app/globals.css` |
| 工厂头图与品牌素材 | `public/` |
| 收稿接口、图片读取和数据库结构 | `app/api/submissions/`、`db/schema.ts`、`drizzle/` |

如需独立部署，后端需要 Cloudflare Worker 运行环境以及 `DB`（D1）和 `BUCKET`（R2）绑定。项目名称、客户资料与图片权限等信息供内部核实，独立部署时应配置访问控制。更完整的框架和命令说明见 `README.md`。
