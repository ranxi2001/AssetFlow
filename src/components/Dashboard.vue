<template>
  <div class="mb-8">
    <!-- Total Value Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-sm font-medium text-gray-500 mb-1">总资产 (USD)</h3>
        <p class="text-3xl font-bold text-gray-900">${{ formatNumber(data?.totalUsd || 0) }}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-sm font-medium text-gray-500 mb-1">总资产 (CNY)</h3>
        <p class="text-3xl font-bold text-gray-900">¥{{ formatNumber(data?.totalCny || 0) }}</p>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- Category Pie Chart -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">资产类别分布</h3>
        <div class="h-64">
          <Pie v-if="categoryChartData" :data="categoryChartData" :options="pieOptions" />
        </div>
      </div>

      <!-- Asset Type Pie Chart -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">资产类型分布</h3>
        <div class="h-64">
          <Pie v-if="typeChartData" :data="typeChartData" :options="pieOptions" />
        </div>
      </div>

      <!-- Individual Asset Pie Chart -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">各资产占比</h3>
        <div class="h-64">
          <Doughnut v-if="assetChartData" :data="assetChartData" :options="doughnutOptions" />
        </div>
      </div>

      <!-- Single Asset Price Chart -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">单资产价格走势</h3>
          <div class="flex items-center gap-2">
            <select
              v-model="selectedSymbol"
              class="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option v-for="symbol in availableSymbols" :key="symbol" :value="symbol">
                {{ symbol }}
              </option>
            </select>
            <select
              v-model="selectedDays"
              @change="$emit('daysChange', selectedDays)"
              class="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option :value="7">7天</option>
              <option :value="30">30天</option>
              <option :value="90">90天</option>
              <option :value="180">180天</option>
              <option :value="365">1年</option>
            </select>
            <button
              @click="$emit('backfill', selectedDays)"
              :disabled="backfilling"
              class="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50"
            >
              {{ backfilling ? '获取中...' : '补全数据' }}
            </button>
          </div>
        </div>
        <div class="h-64">
          <Line v-if="singleAssetChartData" :data="singleAssetChartData" :options="singleAssetLineOptions" />
          <div v-else class="h-full flex items-center justify-center text-gray-400">
            暂无历史数据，点击"补全数据"获取
          </div>
        </div>
      </div>
    </div>

    <!-- Total Asset Value Chart (Full Width) -->
    <div class="bg-white rounded-lg shadow p-6 mb-8">
      <h3 class="text-lg font-medium text-gray-900 mb-4">资产总价值走势 (30天)</h3>
      <div class="h-72">
        <Line v-if="totalValueChartData" :data="totalValueChartData" :options="totalValueLineOptions" />
        <div v-else class="h-full flex items-center justify-center text-gray-400">
          暂无历史数据，请先补全价格数据
        </div>
      </div>
    </div>

    <!-- Category Distribution Cards -->
    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">资产分布详情</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="(category, key) in data?.byCategory"
          :key="key"
          class="border rounded-lg p-4"
          :class="getCategoryBorderColor(key)"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium" :class="getCategoryTextColor(key)">
              {{ getCategoryLabel(key) }}
            </span>
            <span class="text-xs text-gray-500">
              {{ getPercentage(category.totalUsd) }}%
            </span>
          </div>
          <div class="text-xl font-semibold text-gray-900 mb-1">
            ${{ formatNumber(category.totalUsd) }}
          </div>
          <div class="text-sm text-gray-500">
            ¥{{ formatNumber(category.totalCny) }}
          </div>
          <!-- Progress bar -->
          <div class="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full"
              :class="getCategoryBarColor(key)"
              :style="{ width: getPercentage(category.totalUsd) + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler } from 'chart.js'
import { Pie, Doughnut, Line } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler)

const props = defineProps({
  data: Object,
  priceHistory: Array,
  backfilling: Boolean
})

defineEmits(['backfill', 'daysChange'])

const selectedDays = ref(30)
const selectedSymbol = ref('BNB')

const categoryLabels = {
  web3: 'Web3 资产',
  web2: 'Web2 资产',
  physical: '实物资产'
}

const categoryColors = {
  web3: {
    border: 'border-purple-200',
    text: 'text-purple-600',
    bar: 'bg-purple-500',
    chart: 'rgba(147, 51, 234, 0.8)',
    chartBorder: 'rgb(147, 51, 234)'
  },
  web2: {
    border: 'border-blue-200',
    text: 'text-blue-600',
    bar: 'bg-blue-500',
    chart: 'rgba(59, 130, 246, 0.8)',
    chartBorder: 'rgb(59, 130, 246)'
  },
  physical: {
    border: 'border-amber-200',
    text: 'text-amber-600',
    bar: 'bg-amber-500',
    chart: 'rgba(245, 158, 11, 0.8)',
    chartBorder: 'rgb(245, 158, 11)'
  }
}

const typeColors = {
  crypto: { chart: 'rgba(147, 51, 234, 0.8)', label: '加密货币' },
  stablecoin: { chart: 'rgba(16, 185, 129, 0.8)', label: '稳定币' },
  defi: { chart: 'rgba(139, 92, 246, 0.8)', label: 'DeFi' },
  nft: { chart: 'rgba(217, 70, 239, 0.8)', label: 'NFT' },
  gold: { chart: 'rgba(245, 158, 11, 0.8)', label: '黄金' },
  silver: { chart: 'rgba(156, 163, 175, 0.8)', label: '白银' },
  cash: { chart: 'rgba(34, 197, 94, 0.8)', label: '现金' },
  property: { chart: 'rgba(168, 85, 247, 0.8)', label: '房产' },
  alipay: { chart: 'rgba(59, 130, 246, 0.8)', label: '支付宝' },
  wechat: { chart: 'rgba(34, 197, 94, 0.8)', label: '微信' },
  bank: { chart: 'rgba(99, 102, 241, 0.8)', label: '银行存款' },
  stock: { chart: 'rgba(236, 72, 153, 0.8)', label: '股票' },
  fund: { chart: 'rgba(244, 63, 94, 0.8)', label: '基金' },
  bond: { chart: 'rgba(251, 146, 60, 0.8)', label: '债券' },
  other: { chart: 'rgba(107, 114, 128, 0.8)', label: '其他' }
}

const assetColors = [
  'rgba(147, 51, 234, 0.8)',
  'rgba(59, 130, 246, 0.8)',
  'rgba(16, 185, 129, 0.8)',
  'rgba(245, 158, 11, 0.8)',
  'rgba(239, 68, 68, 0.8)',
  'rgba(236, 72, 153, 0.8)',
  'rgba(99, 102, 241, 0.8)',
  'rgba(20, 184, 166, 0.8)'
]

const priceLineColors = {
  'BNB': { line: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.1)' },
  'BTC': { line: 'rgb(247, 147, 26)', bg: 'rgba(247, 147, 26, 0.1)' },
  'ETH': { line: 'rgb(98, 126, 234)', bg: 'rgba(98, 126, 234, 0.1)' },
  'XAU': { line: 'rgb(255, 215, 0)', bg: 'rgba(255, 215, 0, 0.1)' },
  'USD1': { line: 'rgb(16, 185, 129)', bg: 'rgba(16, 185, 129, 0.1)' },
  'USDT': { line: 'rgb(38, 161, 123)', bg: 'rgba(38, 161, 123, 0.1)' },
  'CNY': { line: 'rgb(239, 68, 68)', bg: 'rgba(239, 68, 68, 0.1)' }
}

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        font: { size: 12 },
        padding: 15
      }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const value = context.raw
          const total = context.dataset.data.reduce((a, b) => a + b, 0)
          const percentage = ((value / total) * 100).toFixed(1)
          return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${percentage}%)`
        }
      }
    }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: {
    legend: {
      position: 'right',
      labels: {
        font: { size: 11 },
        padding: 10
      }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const value = context.raw
          const total = context.dataset.data.reduce((a, b) => a + b, 0)
          const percentage = ((value / total) * 100).toFixed(1)
          return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${percentage}%)`
        }
      }
    }
  }
}

// Category Pie Chart Data
const categoryChartData = computed(() => {
  if (!props.data?.byCategory) return null

  const labels = []
  const data = []
  const colors = []

  for (const [key, category] of Object.entries(props.data.byCategory)) {
    if (category.totalUsd > 0) {
      labels.push(categoryLabels[key] || key)
      data.push(category.totalUsd)
      colors.push(categoryColors[key]?.chart || 'rgba(107, 114, 128, 0.8)')
    }
  }

  return {
    labels,
    datasets: [{
      data,
      backgroundColor: colors,
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }
})

// Asset Type Pie Chart Data
const typeChartData = computed(() => {
  if (!props.data?.assets) return null

  const typeMap = {}
  for (const asset of props.data.assets) {
    const type = asset.type
    if (!typeMap[type]) {
      typeMap[type] = 0
    }
    typeMap[type] += asset.valueUsd || 0
  }

  const labels = []
  const data = []
  const colors = []

  for (const [type, value] of Object.entries(typeMap)) {
    if (value > 0) {
      labels.push(typeColors[type]?.label || type)
      data.push(value)
      colors.push(typeColors[type]?.chart || 'rgba(107, 114, 128, 0.8)')
    }
  }

  return {
    labels,
    datasets: [{
      data,
      backgroundColor: colors,
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }
})

// Individual Asset Doughnut Chart Data
const assetChartData = computed(() => {
  if (!props.data?.assets) return null

  const sortedAssets = [...props.data.assets]
    .filter(a => a.valueUsd > 0)
    .sort((a, b) => b.valueUsd - a.valueUsd)

  return {
    labels: sortedAssets.map(a => a.name),
    datasets: [{
      data: sortedAssets.map(a => a.valueUsd),
      backgroundColor: sortedAssets.map((_, i) => assetColors[i % assetColors.length]),
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }
})

// 可用的资产符号列表
const availableSymbols = computed(() => {
  if (!props.priceHistory || props.priceHistory.length === 0) return ['BNB']
  const symbols = new Set()
  for (const item of props.priceHistory) {
    if (!['CNY', 'USDT', 'USDC'].includes(item.symbol)) {
      symbols.add(item.symbol)
    }
  }
  return Array.from(symbols).sort()
})

// 单资产价格走势图数据
const singleAssetChartData = computed(() => {
  if (!props.priceHistory || props.priceHistory.length === 0) return null

  const symbol = selectedSymbol.value
  const filteredData = props.priceHistory.filter(item => item.symbol === symbol)

  if (filteredData.length === 0) return null

  // 按日期排序
  const sortedData = [...filteredData].sort((a, b) =>
    new Date(a.recorded_at) - new Date(b.recorded_at)
  )

  const color = priceLineColors[symbol] || { line: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.1)' }

  return {
    labels: sortedData.map(d => {
      const date = new Date(d.recorded_at)
      return `${date.getMonth() + 1}/${date.getDate()}`
    }),
    datasets: [{
      label: `${symbol} 价格 (USD)`,
      data: sortedData.map(d => d.price_usd),
      borderColor: color.line,
      backgroundColor: color.bg,
      tension: 0.3,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 5
    }]
  }
})

// 资产总价值走势图数据
const totalValueChartData = computed(() => {
  if (!props.priceHistory || props.priceHistory.length === 0 || !props.data?.assets) return null

  // 按日期分组价格
  const priceByDate = {}
  for (const item of props.priceHistory) {
    const date = item.recorded_at
    if (!priceByDate[date]) {
      priceByDate[date] = {}
    }
    priceByDate[date][item.symbol] = item.price_usd
  }

  const dates = Object.keys(priceByDate).sort()
  if (dates.length === 0) return null

  // 计算每天的总价值（使用当前持仓量 * 历史价格）
  const totalValues = dates.map(date => {
    let total = 0
    for (const asset of props.data.assets) {
      const symbol = asset.symbol?.toUpperCase()
      if (symbol && priceByDate[date][symbol] !== undefined) {
        total += asset.amount * priceByDate[date][symbol]
      } else if (symbol === 'CNY') {
        // CNY 使用固定汇率近似
        total += asset.amount / 7.2
      }
    }
    return total
  })

  return {
    labels: dates.map(d => {
      const date = new Date(d)
      return `${date.getMonth() + 1}/${date.getDate()}`
    }),
    datasets: [{
      label: '总资产价值 (USD)',
      data: totalValues,
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      tension: 0.3,
      fill: true,
      pointRadius: 2,
      pointHoverRadius: 5
    }]
  }
})

// 单资产图表配置
const singleAssetLineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => `$${context.raw?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '-'}`
      }
    }
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      beginAtZero: false,
      ticks: {
        callback: (value) => '$' + value.toLocaleString()
      }
    }
  }
}

// 总价值图表配置
const totalValueLineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => `总价值: $${context.raw?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '-'}`
      }
    }
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      beginAtZero: false,
      ticks: {
        callback: (value) => '$' + value.toLocaleString()
      }
    }
  }
}

function formatNumber(num) {
  if (num === undefined || num === null) return '0'
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getCategoryLabel(key) {
  return categoryLabels[key] || key
}

function getCategoryBorderColor(key) {
  return categoryColors[key]?.border || 'border-gray-200'
}

function getCategoryTextColor(key) {
  return categoryColors[key]?.text || 'text-gray-600'
}

function getCategoryBarColor(key) {
  return categoryColors[key]?.bar || 'bg-gray-500'
}

function getPercentage(value) {
  if (!props.data?.totalUsd || props.data.totalUsd === 0) return 0
  return ((value / props.data.totalUsd) * 100).toFixed(1)
}
</script>
