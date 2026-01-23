<template>
  <div class="space-y-6">
    <div v-for="(category, key) in byCategory" :key="key" class="bg-white rounded-lg shadow overflow-hidden">
      <!-- Category Header -->
      <div class="px-6 py-4 border-b" :class="getCategoryHeaderBg(key)">
        <h3 class="text-lg font-medium" :class="getCategoryHeaderText(key)">
          {{ getCategoryLabel(key) }}
        </h3>
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
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3"
                    :class="getAssetIconBg(asset.type)">
                    {{ getAssetIcon(asset.type) }}
                  </div>
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

defineEmits(['edit', 'delete'])

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

const assetTypeIcons = {
  crypto: { icon: '₿', bg: 'bg-orange-500' },
  stablecoin: { icon: '$', bg: 'bg-green-500' },
  gold: { icon: '金', bg: 'bg-yellow-500' },
  alipay: { icon: '支', bg: 'bg-blue-500' },
  default: { icon: '?', bg: 'bg-gray-500' }
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

function getAssetIcon(type) {
  return assetTypeIcons[type]?.icon || assetTypeIcons.default.icon
}

function getAssetIconBg(type) {
  return assetTypeIcons[type]?.bg || assetTypeIcons.default.bg
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
