# Python Monaco 编辑器

这是一个基于Monaco Editor的简单Python代码编辑器，支持语法高亮、黑白主题切换和基本的代码自动补全功能。

## 功能特点

- Python语法高亮
- 黑白主题切换
- 代码自动补全（基本Python语法和函数）
- 简洁的用户界面

## 如何使用

1. 直接在浏览器中打开`index.html`文件
2. 编辑器会自动加载示例Python代码
3. 使用"切换主题"按钮可以在黑白两种主题之间切换
4. 输入代码时会自动提供代码补全建议

## 自动补全支持

编辑器支持以下Python语法和函数的自动补全：

- 基本关键字：`if`, `for`, `while`, `def`, `class`, `import`, `from`, `try`, `lambda`
- 常用函数：`print`, `list`, `dict`等

## 技术说明

- 使用Monaco Editor（VS Code的编辑器组件）
- 通过CDN加载Monaco Editor资源
- 纯前端实现，无需服务器

## 注意事项

- 此编辑器仅提供代码编辑功能，不支持代码执行
- 自动补全功能仅包含基本的Python语法和函数 