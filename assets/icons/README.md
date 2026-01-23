# AssetFlow Logo 使用指南

本目录包含 AssetFlow 项目的所有 logo 和图标资源。

## 📁 文件说明

### 图标文件

| 文件名 | 格式 | 尺寸 | 用途 |
|--------|------|------|------|
| `logo-icon.png` | PNG | 512×512 | 应用图标、社交媒体分享图 |
| `logo-full.png` | PNG | 1200×400 | 完整横版 logo，用于网站头部、横幅 |
| `favicon.png` | PNG | 64×64 | 浏览器标签页图标（备用） |
| `favicon.svg` | SVG | 矢量 | 浏览器标签页图标（推荐） |

## 🎨 设计规范

### 配色方案

- **主色调**：深蓝色 `#1e40af` → 青色 `#06b6d4` 渐变
- **寓意**：
  - 深蓝 - 专业、信任、稳定
  - 青色 - 科技、创新、流动性

### 设计元素

1. **堆叠柱状图**：代表资产的积累和增长
2. **向上箭头**：象征资产价值上升和流动
3. **货币符号**：体现多币种、多资产支持

## 💡 使用场景

### 网页中使用

```html
<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/assets/icons/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon.png" />

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/logo-icon.png" />

<!-- 页面 Logo -->
<img src="/assets/icons/logo-full.png" alt="AssetFlow" class="h-8" />
```

### Vue 组件中使用

```vue
<template>
  <div class="logo">
    <img src="/assets/icons/logo-icon.png" alt="AssetFlow Icon" />
  </div>
</template>
```

### CSS 中使用

```css
.brand-logo {
  background-image: url('/assets/icons/logo-full.png');
  background-size: contain;
  background-repeat: no-repeat;
}
```

## 📐 间距与尺寸建议

### 清晰空间

Logo 周围应保留至少 **20px** 的清晰空间，不放置其他元素。

### 最小尺寸

- **Icon**：最小 32×32px
- **Full Logo**：最小高度 40px

### 响应式使用

```css
/* 桌面端 */
.logo-full {
  height: 64px;
}

/* 平板端 */
@media (max-width: 768px) {
  .logo-full {
    height: 48px;
  }
}

/* 移动端 */
@media (max-width: 480px) {
  .logo-icon {
    height: 40px;
  }
}
```

## 🚫 使用禁忌

❌ **不要做的事情：**

1. 不要改变 logo 的颜色（除非是单色应用场景）
2. 不要拉伸或变形 logo 比例
3. 不要在 logo 上添加阴影或特效（除非设计系统要求）
4. 不要旋转 logo
5. 不要在低对比度背景上使用

✅ **推荐做法：**

1. 保持原始宽高比
2. 在浅色背景上使用彩色版本
3. 必要时可使用纯白色或纯黑色单色版本
4. 确保清晰可见，留有足够边距

## 🎯 品牌应用示例

### GitHub README

```markdown
<div align="center">
  <img src="assets/icons/logo-icon.png" alt="AssetFlow" width="120" />
  <h1>AssetFlow</h1>
  <p>开源的 Web3 资产看板应用</p>
</div>
```

### 社交媒体

- **Twitter/X Card**：使用 `logo-icon.png` (512×512)
- **LinkedIn 封面**：可使用 `logo-full.png` 结合品牌色背景
- **微信分享**：推荐 `logo-icon.png`

## 📝 版权信息

AssetFlow Logo © 2026 AssetFlow Team  
本 Logo 仅供 AssetFlow 项目使用，受 MIT 许可证保护。

---

**需要其他尺寸或格式？**

请联系设计团队或在项目 Issue 中提出需求。
