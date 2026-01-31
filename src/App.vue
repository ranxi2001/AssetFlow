<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Password Screen -->
    <div v-if="!authenticated" class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md mx-4">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-gray-900">AssetFlow</h1>
          <p class="text-gray-500 mt-2">{{ isFirstTime ? '设置访问密码' : '请输入密码访问' }}</p>
        </div>
        <form @submit.prevent="handleLogin">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input
                v-model="password"
                type="password"
                :placeholder="isFirstTime ? '设置您的密码' : '输入密码'"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div v-if="isFirstTime">
              <label class="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
              <input
                v-model="confirmPassword"
                type="password"
                placeholder="再次输入密码"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div v-if="authError" class="text-red-500 text-sm">{{ authError }}</div>
            <button
              type="submit"
              :disabled="authLoading"
              class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
            >
              {{ authLoading ? '验证中...' : (isFirstTime ? '设置密码' : '登录') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Main Content (after authentication) -->
    <template v-else>
      <!-- Header -->
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center flex-wrap gap-4">
            <h1 class="text-3xl font-bold text-gray-900">AssetFlow 资产看板</h1>

            <!-- 汇率信息 -->
            <div class="flex items-center gap-4 text-sm">
              <div class="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg">
                <div class="text-center">
                  <div class="text-gray-500 text-xs">USD/CNY</div>
                  <div class="font-semibold text-gray-900">{{ rates.usdCny?.toFixed(4) || '-' }}</div>
                </div>
                <div class="w-px h-8 bg-gray-300"></div>
                <div class="text-center">
                  <div class="text-gray-500 text-xs">USDT C2C</div>
                  <div class="font-semibold text-green-600">{{ rates.usdtC2c?.toFixed(2) || '-' }}</div>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <!-- 隐私模式切换按钮 -->
              <button
                @click="privacyMode = !privacyMode"
                class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                :title="privacyMode ? '显示数据' : '隐藏敏感数据'"
              >
                <!-- 眼睛打开图标 -->
                <svg v-if="!privacyMode" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <!-- 眼睛关闭图标 -->
                <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
              <button
                @click="handleRefreshPrices"
                :disabled="refreshing"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg v-if="refreshing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ refreshing ? '刷新中...' : '刷新价格' }}
              </button>
              <button
                @click="handleLogout"
                class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <!-- Loading -->
        <div v-if="loading" class="flex justify-center items-center py-12">
          <svg class="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-red-800">{{ error }}</p>
            </div>
          </div>
        </div>

        <!-- Dashboard Content -->
        <div v-else>
          <Dashboard
            :data="dashboard"
            :price-history="priceHistory"
            :backfilling="backfilling"
            :privacy-mode="privacyMode"
            @backfill="handleBackfill"
            @days-change="handleDaysChange"
          />
          <AssetList
            :assets="dashboard?.assets || []"
            :by-category="dashboard?.byCategory || {}"
            :privacy-mode="privacyMode"
            @edit="openEditForm"
            @delete="handleDelete"
            @add="openAddFormWithCategory"
          />
          <button
            @click="openAddForm"
            class="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl"
          >
            +
          </button>
        </div>

        <!-- Asset Form Modal -->
        <AssetForm
          v-if="showForm"
          :asset="editingAsset"
          @close="closeForm"
          @save="handleSave"
        />
      </main>

      <!-- Footer -->
      <footer class="bg-white border-t mt-8">
        <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <p class="text-center text-sm text-gray-500">
            最后更新: {{ dashboard?.updatedAt ? new Date(dashboard.updatedAt).toLocaleString('zh-CN') : '-' }}
          </p>
        </div>
      </footer>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { getDashboard, refreshPrices, createAsset, updateAsset, deleteAsset, verifyPassword, hasPassword, getPriceHistory, backfillPriceHistory, getRates } from './api'
// 懒加载 Dashboard 组件（包含 Chart.js，体积较大）
const Dashboard = defineAsyncComponent(() => import('./components/Dashboard.vue'))
import AssetList from './components/AssetList.vue'
import AssetForm from './components/AssetForm.vue'

// Auth state
const authenticated = ref(false)
const isFirstTime = ref(false)
const password = ref('')
const confirmPassword = ref('')
const authError = ref('')
const authLoading = ref(false)

// Dashboard state
const dashboard = ref(null)
const priceHistory = ref([])
const rates = ref({})
const loading = ref(true)
const error = ref(null)
const refreshing = ref(false)
const backfilling = ref(false)
const historyDays = ref(30)
const showForm = ref(false)
const editingAsset = ref(null)
const privacyMode = ref(false)

// Cache utilities - 支持 stale-while-revalidate 模式
const CACHE_KEY = 'assetflow_cache'
const DASHBOARD_CACHE_KEY = 'assetflow_dashboard'
const getCacheKey = () => new Date().toISOString().split('T')[0] // YYYY-MM-DD
const CACHE_MAX_AGE = 6 * 60 * 60 * 1000 // 6小时内缓存可作为 stale 数据使用

function getCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    const data = JSON.parse(cached)
    // Check if cache is from today
    if (data.date !== getCacheKey()) return null
    return data
  } catch {
    return null
  }
}

// 获取可用的旧缓存（用于 stale-while-revalidate）
function getStaleCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    const data = JSON.parse(cached)
    // 检查缓存是否在可接受的时间范围内（6小时）
    if (data.timestamp && (Date.now() - data.timestamp) < CACHE_MAX_AGE) {
      return data
    }
    return null
  } catch {
    return null
  }
}

// 获取 Dashboard 数据缓存
function getDashboardCache() {
  try {
    const cached = localStorage.getItem(DASHBOARD_CACHE_KEY)
    if (!cached) return null
    const data = JSON.parse(cached)
    // Dashboard 缓存5分钟有效
    if (data.timestamp && (Date.now() - data.timestamp) < 5 * 60 * 1000) {
      return data.dashboard
    }
    // 返回旧数据用于 stale 显示
    if (data.timestamp && (Date.now() - data.timestamp) < CACHE_MAX_AGE) {
      return { ...data.dashboard, stale: true }
    }
    return null
  } catch {
    return null
  }
}

function setDashboardCache(dashboardData) {
  try {
    localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      dashboard: dashboardData
    }))
  } catch (e) {
    console.warn('Dashboard cache write failed:', e)
  }
}

function setCache(priceHistoryData, ratesData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      date: getCacheKey(),
      timestamp: Date.now(),
      priceHistory: priceHistoryData,
      rates: ratesData
    }))
  } catch (e) {
    console.warn('Cache write failed:', e)
  }
}

async function checkPassword() {
  try {
    const result = await hasPassword()
    isFirstTime.value = !result.hasPassword
  } catch (err) {
    console.error('Error checking password:', err)
  }
}

async function handleLogin() {
  authError.value = ''

  if (isFirstTime.value) {
    if (password.value !== confirmPassword.value) {
      authError.value = '两次输入的密码不一致'
      return
    }
    if (password.value.length < 4) {
      authError.value = '密码至少需要4个字符'
      return
    }
  }

  authLoading.value = true
  try {
    await verifyPassword(password.value)
    authenticated.value = true
    sessionStorage.setItem('assetflow_auth', 'true')
    await loadDashboard()
  } catch (err) {
    authError.value = err.response?.data?.error || '密码错误'
  } finally {
    authLoading.value = false
  }
}

function handleLogout() {
  authenticated.value = false
  sessionStorage.removeItem('assetflow_auth')
  password.value = ''
  confirmPassword.value = ''
}

async function loadDashboard() {
  try {
    error.value = null

    // Stale-While-Revalidate: 先显示缓存数据，后台更新
    const cached = getCache()
    const staleCache = !cached ? getStaleCache() : null
    const dashboardCached = getDashboardCache()

    // 1. 立即显示缓存数据（如果有）
    if (dashboardCached) {
      dashboard.value = dashboardCached
      loading.value = false // 先停止加载状态
    }
    if (cached) {
      priceHistory.value = cached.priceHistory
      rates.value = cached.rates
    } else if (staleCache) {
      // 使用旧缓存先显示
      priceHistory.value = staleCache.priceHistory
      rates.value = staleCache.rates
    }

    // 2. 后台更新数据
    if (cached && dashboardCached && !dashboardCached.stale) {
      // 缓存完全有效，只需要刷新 dashboard
      const dashboardData = await getDashboard()
      dashboard.value = dashboardData
      setDashboardCache(dashboardData)
    } else {
      // 需要刷新所有数据
      const [dashboardData, historyData, ratesData] = await Promise.all([
        getDashboard(),
        getPriceHistory(null, 30),
        getRates()
      ])
      dashboard.value = dashboardData
      priceHistory.value = historyData
      rates.value = ratesData
      // Save to cache
      setCache(historyData, ratesData)
      setDashboardCache(dashboardData)
    }
  } catch (err) {
    // 如果有缓存数据，不显示错误（降级到缓存）
    if (!dashboard.value) {
      error.value = '加载数据失败: ' + (err.response?.data?.error || err.message)
    } else {
      console.warn('后台刷新失败，使用缓存数据:', err.message)
    }
  } finally {
    loading.value = false
  }
}

async function handleRefreshPrices() {
  refreshing.value = true
  try {
    await refreshPrices()
    // Clear cache to force reload
    localStorage.removeItem(CACHE_KEY)
    await loadDashboard()
  } catch (err) {
    error.value = '刷新价格失败: ' + (err.response?.data?.error || err.message)
  } finally {
    refreshing.value = false
  }
}

async function handleBackfill(days) {
  backfilling.value = true
  try {
    const result = await backfillPriceHistory(days)
    alert(result.message)
    // Clear cache and reload price history
    localStorage.removeItem(CACHE_KEY)
    priceHistory.value = await getPriceHistory(null, days)
    setCache(priceHistory.value, rates.value)
  } catch (err) {
    alert('补全数据失败: ' + (err.response?.data?.error || err.message))
  } finally {
    backfilling.value = false
  }
}

async function handleDaysChange(days) {
  historyDays.value = days
  try {
    priceHistory.value = await getPriceHistory(null, days)
    setCache(priceHistory.value, rates.value)
  } catch (err) {
    console.error('加载历史数据失败:', err)
  }
}

function openAddForm() {
  editingAsset.value = null
  showForm.value = true
}

function openAddFormWithCategory(category) {
  editingAsset.value = { category }
  showForm.value = true
}

function openEditForm(asset) {
  editingAsset.value = { ...asset }
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingAsset.value = null
}

async function handleSave(assetData) {
  try {
    if (editingAsset.value?.id) {
      await updateAsset(editingAsset.value.id, assetData)
    } else {
      await createAsset(assetData)
    }
    closeForm()
    await loadDashboard()
  } catch (err) {
    alert('保存失败: ' + (err.response?.data?.error || err.message))
  }
}

async function handleDelete(id) {
  if (!confirm('确定要删除这个资产吗?')) return
  try {
    await deleteAsset(id)
    await loadDashboard()
  } catch (err) {
    alert('删除失败: ' + (err.response?.data?.error || err.message))
  }
}

onMounted(async () => {
  await checkPassword()
  // Check if already authenticated in this session
  if (sessionStorage.getItem('assetflow_auth') === 'true') {
    authenticated.value = true
    await loadDashboard()
  }
})
</script>
