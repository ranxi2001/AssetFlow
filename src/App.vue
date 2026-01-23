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
            @backfill="handleBackfill"
            @days-change="handleDaysChange"
          />
          <AssetList
            :assets="dashboard?.assets || []"
            :by-category="dashboard?.byCategory || {}"
            @edit="openEditForm"
            @delete="handleDelete"
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
import { ref, onMounted } from 'vue'
import { getDashboard, refreshPrices, createAsset, updateAsset, deleteAsset, verifyPassword, hasPassword, getPriceHistory, backfillPriceHistory, getRates } from './api'
import Dashboard from './components/Dashboard.vue'
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
    const [dashboardData, historyData, ratesData] = await Promise.all([
      getDashboard(),
      getPriceHistory(null, 30),
      getRates()
    ])
    dashboard.value = dashboardData
    priceHistory.value = historyData
    rates.value = ratesData
  } catch (err) {
    error.value = '加载数据失败: ' + (err.response?.data?.error || err.message)
  } finally {
    loading.value = false
  }
}

async function handleRefreshPrices() {
  refreshing.value = true
  try {
    await refreshPrices()
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
    // 重新加载价格历史
    priceHistory.value = await getPriceHistory(null, days)
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
  } catch (err) {
    console.error('加载历史数据失败:', err)
  }
}

function openAddForm() {
  editingAsset.value = null
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
