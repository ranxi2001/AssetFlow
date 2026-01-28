<template>
  <div class="space-y-6">
    <div v-for="(category, key) in byCategory" :key="key" class="bg-white rounded-lg shadow overflow-hidden">
      <!-- Category Header -->
      <div class="px-6 py-4 border-b flex justify-between items-center" :class="getCategoryHeaderBg(key)">
        <h3 class="text-lg font-medium" :class="getCategoryHeaderText(key)">
          {{ getCategoryLabel(key) }}
        </h3>
        <button
          @click="$emit('add', key)"
          class="px-4 py-1.5 border-2 rounded-md text-sm font-medium transition-colors hover:bg-white"
          :class="getAddButtonClass(key)"
        >
          新增
        </button>
      </div>

      <!-- Asset Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">资产名称</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单价 (USD)</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">价值 (USD)</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">价值 (CNY)</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">位置</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="asset in category.assets" :key="asset.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <!-- Image-based icon for supported symbols -->
                  <template v-if="hasImageIcon(asset)">
                    <div class="w-8 h-8 mr-3 flex-shrink-0">
                      <img :src="getImageIconSrc(asset)" :alt="asset.symbol" class="w-full h-full rounded-full object-cover" />
                    </div>
                  </template>
                  <!-- Text-based icon fallback -->
                  <template v-else>
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3"
                      :class="getAssetIconBg(asset)">
                      {{ getAssetIcon(asset) }}
                    </div>
                  </template>
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ asset.name }}</div>
                    <div class="text-xs text-gray-500">{{ asset.symbol }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatAmount(asset.amount) }} {{ asset.unit }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${{ formatNumber(asset.price?.priceUsd || 0) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${{ formatNumber(asset.valueUsd) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ¥{{ formatNumber(asset.valueCny) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ asset.location || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="$emit('edit', asset)" class="text-blue-600 hover:text-blue-900 mr-3">编辑</button>
                <button @click="$emit('delete', asset.id)" class="text-red-600 hover:text-red-900">删除</button>
              </td>
            </tr>
          </tbody>
          <!-- Category Total -->
          <tfoot class="bg-gray-50">
            <tr>
              <td colspan="3" class="px-6 py-3 text-sm font-medium text-gray-900">小计</td>
              <td class="px-6 py-3 text-sm font-bold text-gray-900">${{ formatNumber(category.totalUsd) }}</td>
              <td class="px-6 py-3 text-sm font-bold text-gray-900">¥{{ formatNumber(category.totalCny) }}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  assets: Array,
  byCategory: Object
})

defineEmits(['edit', 'delete', 'add'])

const categoryLabels = {
  web3: 'Web3 资产',
  web2: 'Web2 资产',
  physical: '实物资产'
}

const categoryHeaderStyles = {
  web3: { bg: 'bg-purple-50', text: 'text-purple-800' },
  web2: { bg: 'bg-blue-50', text: 'text-blue-800' },
  physical: { bg: 'bg-amber-50', text: 'text-amber-800' }
}

// Symbol-based image icons (SVG files)
const symbolImageIcons = {
  'BTC': '/icons/btc.svg',
  'BNB': '/icons/bnb.svg',
  'ETH': '/icons/eth.svg',
  'USDT': '/icons/usdt.svg',
  'USD1': '/icons/usd1.webp',
  'USDG': '/icons/usdg.webp',
  'SOL': '/icons/sol.svg',
  'XAU': '/icons/gold.svg',
}

// Location-based image icons (for banks etc.)
const locationImageIcons = {
  '建设银行': '/icons/ccb.jpg',
  '工商银行': '/icons/icbc.png',
  '网商银行': '/icons/mybank.png',
  '招商银行': '/icons/cmb.png',
}

// Name-based image icons (for specific products)
const nameImageIcons = {
  '帮你投': '/icons/bangnitou.png',
  '基金': '/icons/fund.svg',
  '余额宝': '/icons/yuebao.png',
}

// Check if asset has an image icon (by symbol, name, or location)
function hasImageIcon(asset) {
  if (asset.symbol && symbolImageIcons[asset.symbol.toUpperCase()]) {
    return true
  }
  if (asset.name && nameImageIcons[asset.name]) {
    return true
  }
  if (asset.location) {
    for (const key in locationImageIcons) {
      if (asset.location.includes(key)) return true
    }
  }
  return false
}

// Get image icon source path (by symbol, name, or location)
function getImageIconSrc(asset) {
  // First check symbol
  if (asset.symbol && symbolImageIcons[asset.symbol.toUpperCase()]) {
    return symbolImageIcons[asset.symbol.toUpperCase()]
  }
  // Then check name for specific products
  if (asset.name && nameImageIcons[asset.name]) {
    return nameImageIcons[asset.name]
  }
  // Then check location for banks
  if (asset.location) {
    for (const key in locationImageIcons) {
      if (asset.location.includes(key)) return locationImageIcons[key]
    }
  }
  return ''
}

// 预定义的类型图标（有这些的优先使用）
const assetTypeIcons = {
  crypto: { icon: '₿', bg: 'bg-orange-500' },
  stablecoin: { icon: '$', bg: 'bg-green-500' },
  defi: { icon: '⚡', bg: 'bg-purple-500' },
  nft: { icon: '🎨', bg: 'bg-pink-500' },
  gold: { icon: '金', bg: 'bg-yellow-500' },
  silver: { icon: '银', bg: 'bg-gray-400' },
  alipay: { icon: '支', bg: 'bg-blue-500' },
  wechat: { icon: '微', bg: 'bg-green-600' },
}

// 颜色池 - 用于没有预定义图标的资产
const iconColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-red-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-fuchsia-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-amber-500',
  'bg-lime-500',
]

// 根据字符串生成稳定的hash值
function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

function getCategoryLabel(key) {
  return categoryLabels[key] || key
}

function getCategoryHeaderBg(key) {
  return categoryHeaderStyles[key]?.bg || 'bg-gray-50'
}

function getCategoryHeaderText(key) {
  return categoryHeaderStyles[key]?.text || 'text-gray-800'
}

// 获取资产图标：优先使用类型图标，否则用名称首字母
function getAssetIcon(asset) {
  // 如果有预定义的类型图标，使用它
  if (asset.type && assetTypeIcons[asset.type]) {
    return assetTypeIcons[asset.type].icon
  }
  // 否则使用资产名称首字母
  return asset.name ? asset.name.charAt(0) : '?'
}

// 获取图标背景色：优先使用类型颜色，否则用名称hash生成
function getAssetIconBg(asset) {
  // 如果有预定义的类型颜色，使用它
  if (asset.type && assetTypeIcons[asset.type]) {
    return assetTypeIcons[asset.type].bg
  }
  // 否则根据名称hash生成稳定的颜色
  if (!asset.name) return 'bg-gray-500'
  const hash = hashString(asset.name)
  const colorIndex = hash % iconColors.length
  return iconColors[colorIndex]
}

function getAddButtonClass(key) {
  const buttonStyles = {
    web3: 'border-purple-600 text-purple-700 hover:bg-purple-50',
    web2: 'border-blue-600 text-blue-700 hover:bg-blue-50',
    physical: 'border-amber-600 text-amber-700 hover:bg-amber-50'
  }
  return buttonStyles[key] || 'border-gray-600 text-gray-700'
}

function formatNumber(num) {
  if (num === undefined || num === null) return '0.00'
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatAmount(num) {
  if (num === undefined || num === null) return '0'
  // For amounts, show more precision if needed
  if (num < 1) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
  }
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
}
</script>
