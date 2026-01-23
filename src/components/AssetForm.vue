<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
      <div class="px-6 py-4 border-b">
        <h3 class="text-lg font-medium text-gray-900">
          {{ asset ? '编辑资产' : '添加资产' }}
        </h3>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <!-- Quick Add Presets -->
        <div v-if="!asset" class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">快速添加</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="preset in presets"
              :key="preset.name"
              type="button"
              @click="applyPreset(preset)"
              class="px-3 py-1 text-xs rounded-full border hover:bg-gray-50"
              :class="selectedPreset === preset.name ? 'bg-blue-100 border-blue-500 text-blue-700' : 'border-gray-300 text-gray-600'"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">资产名称 *</label>
          <input
            v-model="form.name"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="如: BNB, 黄金, 工商银行"
          />
        </div>

        <!-- Category -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">分类 *</label>
          <select
            v-model="form.category"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="web3">Web3 资产</option>
            <option value="web2">Web2 资产</option>
            <option value="physical">实物资产</option>
          </select>
        </div>

        <!-- Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">类型 *</label>
          <select
            v-model="form.type"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <optgroup label="Web3">
              <option value="crypto">加密货币</option>
              <option value="stablecoin">稳定币</option>
              <option value="defi">DeFi</option>
              <option value="nft">NFT</option>
            </optgroup>
            <optgroup label="Web2">
              <option value="bank">银行存款</option>
              <option value="wealth">银行理财</option>
              <option value="alipay">支付宝</option>
              <option value="wechat">微信</option>
              <option value="stock">股票</option>
              <option value="fund">基金</option>
              <option value="bond">债券</option>
            </optgroup>
            <optgroup label="实物">
              <option value="gold">黄金</option>
              <option value="silver">白银</option>
              <option value="cash">现金</option>
              <option value="property">房产</option>
            </optgroup>
            <optgroup label="其他">
              <option value="other">其他</option>
            </optgroup>
          </select>
        </div>

        <!-- Symbol -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">符号/代币</label>
          <input
            v-model="form.symbol"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="如: BNB, XAU, CNY"
          />
          <p class="mt-1 text-xs text-gray-500">
            支持: BNB, ETH, BTC, SOL, DOGE, XAU(黄金), CNY(人民币), USD1/USDT/USDC(稳定币)
          </p>
        </div>

        <!-- Amount -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">数量 *</label>
          <input
            v-model.number="form.amount"
            type="number"
            step="any"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        <!-- Unit -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">单位</label>
          <select
            v-model="form.unit"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="个">个</option>
            <option value="CNY">CNY</option>
            <option value="USD">USD</option>
            <option value="g">克(g)</option>
            <option value="oz">盎司(oz)</option>
            <option value="股">股</option>
            <option value="份">份</option>
          </select>
        </div>

        <!-- Location -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">存放位置</label>
          <input
            v-model="form.location"
            type="text"
            list="locationSuggestions"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="如: 币安钱包, 网商银行, 支付宝"
          />
          <datalist id="locationSuggestions">
            <option value="币安钱包" />
            <option value="OKX钱包" />
            <option value="MetaMask" />
            <option value="Ledger" />
            <option value="支付宝" />
            <option value="微信" />
            <option value="实物" />
          </datalist>
        </div>

        <!-- Buttons -->
        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {{ asset ? '保存' : '添加' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  asset: Object
})

const emit = defineEmits(['close', 'save'])

const selectedPreset = ref('')

const presets = [
  { name: 'bnb', label: 'BNB', category: 'web3', type: 'crypto', symbol: 'BNB', unit: '个', location: '币安钱包' },
  { name: 'eth', label: 'ETH', category: 'web3', type: 'crypto', symbol: 'ETH', unit: '个', location: '钱包' },
  { name: 'btc', label: 'BTC', category: 'web3', type: 'crypto', symbol: 'BTC', unit: '个', location: '钱包' },
  { name: 'usdt', label: 'USDT', category: 'web3', type: 'stablecoin', symbol: 'USDT', unit: '个', location: '币安钱包' },
  { name: 'usd1', label: 'USD1', category: 'web3', type: 'stablecoin', symbol: 'USD1', unit: '个', location: '币安钱包' },
  { name: 'gold', label: '黄金', category: 'physical', type: 'gold', symbol: 'XAU', unit: 'g', location: '实物' },
  { name: 'bank', label: '银行存款', category: 'web2', type: 'bank', symbol: 'CNY', unit: 'CNY', location: '' },
  { name: 'wealth', label: '银行理财', category: 'web2', type: 'wealth', symbol: 'CNY', unit: 'CNY', location: '' },
  { name: 'alipay', label: '支付宝', category: 'web2', type: 'alipay', symbol: 'CNY', unit: 'CNY', location: '支付宝' },
  { name: 'wechat', label: '微信', category: 'web2', type: 'wechat', symbol: 'CNY', unit: 'CNY', location: '微信' },
  { name: 'stock', label: '股票', category: 'web2', type: 'stock', symbol: 'CNY', unit: '股', location: '' },
]

const form = ref({
  name: '',
  category: 'web3',
  type: 'crypto',
  symbol: '',
  amount: 0,
  unit: '个',
  location: ''
})

function applyPreset(preset) {
  selectedPreset.value = preset.name
  form.value = {
    name: preset.label,
    category: preset.category,
    type: preset.type,
    symbol: preset.symbol,
    amount: 0,
    unit: preset.unit,
    location: preset.location
  }
}

// Initialize form with existing asset data
watch(() => props.asset, (newAsset) => {
  if (newAsset) {
    form.value = {
      name: newAsset.name || '',
      category: newAsset.category || 'web3',
      type: newAsset.type || 'crypto',
      symbol: newAsset.symbol || '',
      amount: newAsset.amount || 0,
      unit: newAsset.unit || '个',
      location: newAsset.location || ''
    }
  } else {
    form.value = {
      name: '',
      category: 'web3',
      type: 'crypto',
      symbol: '',
      amount: 0,
      unit: '个',
      location: ''
    }
    selectedPreset.value = ''
  }
}, { immediate: true })

function handleSubmit() {
  emit('save', { ...form.value })
}
</script>
