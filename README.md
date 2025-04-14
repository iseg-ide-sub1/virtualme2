<div align="center" >
    <img src="./assets/media/banner.png" />
    <h1 align="center">
        <img src="./assets/icons/sidebar1.png" width="36px" height="36px"/>
        <span>virtualme2</span>
        <img src="./assets/icons/sidebar2.png" width="36px" height="36px"/>
    </h1>
    <p>VirtualMe项目2.0：基于 virtual-me 项目和 light-at 项目，整理和重构1.0项目、集成大模型聊天界面。</p>
    <p>
        | <a href="https://github.com/iseg-ide-sub1/virtual-me"><b>virtual-me</b></a>
        | <a href="https://github.com/HiMeditator/light-at"><b>light-at</b></a> |
    </p>
</div>

<hr>

## 📥 下载

暂不提下载。

## 📚 用户手册

- [用户手册](docs/user-manual_zh-cn.md)

## ✨ 特性

待添加。

## 🚀 项目运行

VirtualeMe2 项目基于 [virtual-me](https://github.com/iseg-ide-sub1/virtual-me) 和 [light-at](https://github.com/HiMeditator/light-at) 进行重构与合并。

如果想要更深入的了解项目具体结构，可参考 [技术文档](./docs/technical/)。

### 安装依赖

如果环境没有 `pnpm` 先执行 `npm install -g pnpm` 安装。

```bash
pnpm install
```

### 运行前端

通过此命令运行的前端没有接入 VS Code，无法进行交互。

```bash
pnpm dev
```

### 打包前端内容到插件

每次修改完前端部分需要执行该命令才能将内容更新到插件中。

```bash
pnpm build
```

### 运行插件

使用 VS Code，找到 `运行 > 启动调试` 运行插件。Windows 用户可以通过快捷键 `F5` 运行插件。

### 打包插件

打包前请确保前端更改已经通过 `pnpm build` 更新到插件中。

```bash
pnpm package
```
