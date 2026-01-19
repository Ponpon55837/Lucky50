<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Fortune {
  character: string
  meaning: string
  description: string
  wealthIndex: number
  investmentAdvice: string
}

const isFloating = ref(false)
const isGenerating = ref(false)

const currentFortune = ref<Fortune>({
  character: '福',
  meaning: '福氣臨門',
  description: '今日運勢極佳，適合進行投資決策。天時地利人和，把握良機。',
  wealthIndex: 8,
  investmentAdvice: '積極',
})

const fortunes = [
  {
    character: '福',
    meaning: '福氣臨門',
    description: '今日運勢極佳，適合進行投資決策。天時地利人和，把握良機。',
    wealthIndex: 8,
    investmentAdvice: '積極',
  },
  {
    character: '祿',
    meaning: '財祿雙收',
    description: '財運亨通，投資機會多多。但需謹慎選擇，切勿貪心。',
    wealthIndex: 9,
    investmentAdvice: '謹慎樂觀',
  },
  {
    character: '壽',
    meaning: '長久穩健',
    description: '宜採用穩健投資策略，追求長期收益而非短期利潤。',
    wealthIndex: 6,
    investmentAdvice: '穩健',
  },
  {
    character: '喜',
    meaning: '喜事連連',
    description: '運勢上升，投資環境有利，可適度增加投資比例。',
    wealthIndex: 7,
    investmentAdvice: '適度積極',
  },
  {
    character: '財',
    meaning: '財源廣進',
    description: '財運極佳，適合大膽投資。但需注意風險控制。',
    wealthIndex: 10,
    investmentAdvice: '積極',
  },
]

const toggleFloat = () => {
  isFloating.value = !isFloating.value
}

const generateFortune = async () => {
  if (isGenerating.value) return

  isGenerating.value = true

  // 模擬運算過程
  setTimeout(() => {
    const randomIndex = Math.floor(Math.random() * fortunes.length)
    currentFortune.value = fortunes[randomIndex]
    isFloating.value = true
    isGenerating.value = false
  }, 1500)
}

onMounted(() => {
  // 初始動畫
  setTimeout(() => {
    isFloating.value = true
  }, 500)
})
</script>


<template>
  <div class="fortune-orb-container">
    <div
      class="fortune-orb"
      :class="{ floating: isFloating }"
      @click="toggleFloat"
    >
      <div class="orb-inner">
        <div class="orb-glow" />
        <div class="orb-surface">
          <div class="fortune-text">
            <div class="chinese-character">
              {{ currentFortune.character }}
            </div>
            <div class="fortune-meaning">
              {{ currentFortune.meaning }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="orb-controls">
      <button
        class="fortune-btn"
        :disabled="isGenerating"
        @click="generateFortune"
      >
        {{ isGenerating ? '運算中...' : '求運勢' }}
      </button>
    </div>

    <div
      v-if="currentFortune.description"
      class="fortune-description"
    >
      <h3>運勢解析</h3>
      <p>{{ currentFortune.description }}</p>
      <div class="fortune-stats">
        <div class="stat-item">
          <span class="stat-label">財運指數:</span>
          <span class="stat-value">{{ currentFortune.wealthIndex }}/10</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">投資建議:</span>
          <span class="stat-value">{{ currentFortune.investmentAdvice }}</span>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.fortune-orb-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  min-height: 500px;
  position: relative;
  will-change: transform;
}

.fortune-orb {
  width: 200px;
  height: 200px;
  position: relative;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
  will-change: transform;
}

.fortune-orb:hover {
  transform: scale(1.05) rotateY(10deg);
}

.fortune-orb.floating {
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotateY(0deg);
  }
  25% {
    transform: translateY(-10px) rotateY(90deg);
  }
  50% {
    transform: translateY(-20px) rotateY(180deg);
  }
  75% {
    transform: translateY(-10px) rotateY(270deg);
  }
}

.orb-inner {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 215, 0, 0.9) 0%,
    rgba(255, 165, 0, 0.8) 30%,
    rgba(184, 134, 11, 0.9) 70%,
    rgba(120, 53, 15, 1) 100%
  );
  box-shadow:
    0 0 30px rgba(255, 215, 0, 0.6),
    inset 0 0 30px rgba(255, 255, 255, 0.3),
    0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transform-style: preserve-3d;
}

.orb-glow {
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
  animation: pulse 3s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.orb-surface {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at top left, rgba(255, 255, 255, 0.4) 0%, transparent 50%),
    radial-gradient(ellipse at bottom right, rgba(0, 0, 0, 0.2) 0%, transparent 50%);
}

.fortune-text {
  text-align: center;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  transform: translateZ(10px);
}

.chinese-character {
  font-size: 3rem;
  font-weight: bold;
  font-family: 'Arial Unicode MS', '微軟正黑體', sans-serif;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
}

.fortune-meaning {
  font-size: 0.9rem;
  opacity: 0.9;
  font-weight: 500;
}

.orb-controls {
  margin-top: 2rem;
}

.fortune-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.fortune-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.6);
}

.fortune-btn:active:not(:disabled) {
  transform: translateY(0);
}

.fortune-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.fortune-description {
  margin-top: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.95) 100%);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  backdrop-filter: blur(10px);
}

.fortune-description h3 {
  color: #d97706;
  font-size: 1.2rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.fortune-description p {
  color: #374151;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.fortune-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(249, 250, 251, 0.8);
  border-radius: 6px;
}

.stat-label {
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  color: #d97706;
  font-weight: 600;
}

/* 移動端優化 */
@media (max-width: 768px) {
  .fortune-orb {
    width: 150px;
    height: 150px;
  }

  .chinese-character {
    font-size: 2.5rem;
  }

  .fortune-meaning {
    font-size: 0.8rem;
  }

  .fortune-orb-container {
    padding: 1rem;
    min-height: 400px;
  }

  .fortune-description {
    max-width: 90vw;
    padding: 1rem;
  }

  /* 在移動裝置上減少動畫以提升性能 */
  @media (prefers-reduced-motion: reduce) {
    .fortune-orb.floating {
      animation: none;
    }

    .orb-glow {
      animation: none;
      opacity: 0.7;
    }
  }
}

/* 高性能模式 - 減少重繪和回流 */
.fortune-orb,
.orb-inner,
.orb-glow,
.orb-surface {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform-style: preserve-3d;
  will-change: transform;
}
</style>
