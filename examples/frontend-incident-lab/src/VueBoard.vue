<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { loadIncidents, RequestError } from './api'
import { describeState, modes } from './contracts'
import type { RequestState } from './contracts'

const query = ref('')
const mode = ref('normal')
const state = ref<RequestState>({ status: 'idle' })
const message = computed(() => describeState(state.value))
let controller: AbortController | undefined

async function search() {
  controller?.abort('superseded')
  const current = new AbortController()
  controller = current
  state.value = { status: 'loading' }
  try {
    const data = await loadIncidents(query.value, mode.value, current.signal)
    if (controller !== current) return
    state.value = data.length ? { status: 'success', data } : { status: 'empty' }
  } catch (error) {
    if (controller !== current) return
    state.value = error instanceof RequestError && error.kind === 'cancelled'
      ? { status: 'cancelled' }
      : { status: 'error', message: error instanceof Error ? error.message : String(error) }
  }
}

onUnmounted(() => controller?.abort('unmounted'))
</script>

<template>
  <main>
    <h1>Vue 事件看板</h1>
    <p>响应式状态驱动页面，computed 派生文案，卸载清理请求。</p>
    <form @submit.prevent="search">
      <label for="query">按事件号或服务搜索</label>
      <input id="query" v-model="query" autocomplete="off" placeholder="例如 database">
      <label for="mode">故障模式</label>
      <select id="mode" v-model="mode">
        <option v-for="item in modes" :key="item.value" :value="item.value">{{ item.text }}</option>
      </select>
      <div class="actions">
        <button type="submit">查询</button>
        <button type="button" :disabled="state.status !== 'loading'" @click="controller?.abort('user')">取消</button>
      </div>
    </form>
    <p role="status" aria-live="polite" :data-status="state.status">{{ message }}</p>
    <ul v-if="state.status === 'success'">
      <li v-for="incident in state.data" :key="incident.id" :data-severity="incident.severity">
        {{ incident.id }} · {{ incident.service }} · {{ incident.severity }}
      </li>
    </ul>
  </main>
</template>
