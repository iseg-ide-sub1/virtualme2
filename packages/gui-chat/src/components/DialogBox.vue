<template>
  <div class="dialog-box">
    <div v-for="dialog in dialogs" :key="dialog.id" class="dialog-item">
      <ModelDialog v-if="'name' in dialog" :dialog="dialog" />
      <UserDialog v-else :dialog="dialog" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import type { DialogItem, Model } from '@/types'
import UserDialog from './dialog/UserDialog.vue'
import ModelDialog from './dialog/ModelDialog.vue'
const dialogs = reactive<DialogItem[]>([
  {
    id: 'u-01',
    content: 'Who are you?'
  },
  {
    id: 'm-01',
    content: '### 数学公式\n泰勒级数展开用于近似 \\(e^x\\) 在 \\(x=1\\) 时的形式为:\n\\[ e = \\sum_{n=0}^{\\infty} \\frac{1}{n!} = 1 + \\frac{1}{1!} + \\frac{1}{2!} + \\frac{1}{3!} + \\cdots \\]\n\n这里的 \\(n!\\) 表示阶乘，即 \\(n! = n \\times (n-1) \\times \\ldots \\times 1\\), 并且 \\(0! = 1\\)。\n\n### Python 代码实现\n下面是一段Python代码，用来计算上述泰勒级数直到第 `N` 项为止的和，从而得到 \\(e\\) 的近似值。\n\n```python\ndef factorial(n):\n    \"\"\"计算并返回n的阶乘\"\"\"\n    if n == 0:\n        return 1\n    else:\n        return n * factorial(n - 1)\n\ndef estimate_e(N):\n    \"\"\"使用前N项泰勒级数估计e的值\"\"\"\n    e_approx = 0.0\n    for i in range(N + 1):\n        e_approx += 1 / factorial(i)\n    return e_approx\n\n# 设置项数 N\nN = 100  # 可以根据需要调整此数值\napprox_e = estimate_e(N)\nprint(f\"Estimation of e using the first {N} terms: {approx_e}\")\n```\n\n这段代码首先定义了一个递归函数 `factorial` 来计算任意正整数的阶乘。接着定义了 `estimate_e` 函数，它利用泰勒级数的前 `N` 项来估算 \\(e\\) 的值。最后，我们设定了 `N` 的值（这里是100），调用 `estimate_e` 函数，并打印出结果。\n\n你可以改变 `N` 的值来看看不同数量级下 \\(e\\) 的估计精度变化。随着 `N` 增大，\\(e\\) 的估计值会更加接近真实的 \\(e\\) 值。',
    type: 'ollama',
    name: 'qwen-2.5'
  },
  {
    id: 'u-02',
    content: 'Who are you?'
  },
  {
    id: 'm-02',
    content: '```c\nfor (int i = 0; i < n; i++) {\n    sum += i;\n}\n```',
    type: 'openai',
    name: 'qwen-max'
  },
  {
    id: 'u-03',
    content: 'Who are you?'
  },
  {
    id: 'm-03',
    content: '```vue\n<template>\n  <div>Hello World</div>\n</template>\n```',
    type: 'ollama',
    name: 'qwen-2.5'
  },
  {
    id: 'u-04',
    content: 'Who are you?'
  },
  {
    id: 'm-04',
    content: '```\nprint("hello")\n```',
    type: 'openai',
    name: 'qwq-32b'
  }
]);
</script>

<style scoped>
.dailog-box {
  overflow-y: auto;
  scrollbar-width: thin;
}
</style>