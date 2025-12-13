<template>
  <div class="ai-chat">
    <div class="chat-header">
      <div class="header-icon">🤖</div>
      <div class="header-content">
        <h3 class="header-title">@ai.journalist</h3>
        <p class="header-subtitle">ai journalist</p>
      </div>
    </div>

    <div class="chat-messages" ref="messagesRef">
      <div v-if="messages.length === 0" class="welcome-message">
        <div class="welcome-content">
          <h4>welcome to @ai.journalist</h4>
          <p>i can help you write and improve your article.</p>
          <p class="welcome-examples">
            <strong>try saying:</strong>
            • "rewrite this paragraph"
            • "add introduction section"
            • "improve the conclusion"
            • "make it more concise"
          </p>
          <div class="welcome-time">{{ currentTime }}</div>
        </div>
      </div>

      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['message-wrapper', msg.role]"
      >
        <div class="message-content">
          {{ msg.content }}
        </div>
        <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
        <div v-if="msg.updates && msg.updates.length > 0" class="message-updates">
          <button
            v-for="update in msg.updates"
            :key="update.id"
            @click="applyUpdate(update)"
            class="update-btn"
          >
            <span class="update-icon">✏️</span>
            <span>{{ update.note || 'Apply change' }}</span>
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="message-wrapper assistant">
        <div class="message-content">
          <div class="loading-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-footer">
      <div class="quick-actions">
        <button class="quick-action" @click="quickAction('improve article')">
          improve article
        </button>
        <button class="quick-action" @click="quickAction('help')">
          <span class="help-icon">?</span> help
        </button>
      </div>
      <div class="chat-input">
        <input
          v-model="inputMessage"
          @keyup.enter="sendMessage"
          :disabled="isLoading"
          placeholder="ask me anything..."
          class="input-field"
        />
        <button 
          @click="sendMessage" 
          :disabled="isLoading || !inputMessage.trim()"
          class="send-btn"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M18 2L9 11M18 2L12 18L9 11M18 2L2 8L9 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from 'vue';
import api from '@/services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  updates?: any[];
}

const props = defineProps<{
  documentId: string;
  selectedBlockId?: string;
}>();

const emit = defineEmits<{
  'apply-update': [update: any];
}>();

const messages = ref<Message[]>([]);
const inputMessage = ref('');
const messagesRef = ref<HTMLElement>();
const isLoading = ref(false);

const currentTime = computed(() => {
  return new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
});

const formatTime = (timestamp: Date) => {
  return new Date(timestamp).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

const quickAction = (action: string) => {
  inputMessage.value = action;
  sendMessage();
};

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return;

  // Добавляем сообщение пользователя
  const userMessage: Message = {
    id: `user_${Date.now()}`,
    role: 'user',
    content: inputMessage.value,
    timestamp: new Date(),
  };
  messages.value.push(userMessage);

  const messageText = inputMessage.value;
  inputMessage.value = '';
  isLoading.value = true;

  // Скроллим вниз
  await scrollToBottom();

  console.log('Sending AI chat message:', {
    documentId: props.documentId,
    message: messageText,
  });

  try {
    // Отправляем на бэкенд
    const response = await api.post('/ai/chat', {
      documentId: props.documentId,
      message: messageText,
      selectedBlockId: props.selectedBlockId,
    });

    // Добавляем ответ AI
    const data = response.data || response;
    const aiMessage: Message = {
      id: data.id || `ai_${Date.now()}`,
      role: 'assistant',
      content: data.message || 'Извините, произошла ошибка.',
      timestamp: new Date(),
      updates: data.updates || [],
    };
    messages.value.push(aiMessage);
  } catch (error: any) {
    // Обработка ошибки
    const errorMessage: Message = {
      id: `error_${Date.now()}`,
      role: 'assistant',
      content: `Ошибка: ${error.message || 'Не удалось получить ответ от AI'}`,
      timestamp: new Date(),
    };
    messages.value.push(errorMessage);
  } finally {
    isLoading.value = false;
    await scrollToBottom();
  }
};

const applyUpdate = (update: any) => {
  emit('apply-update', update);
};

const scrollToBottom = async () => {
  await nextTick();
  if (messagesRef.value) {
    messagesRef.value.scrollTo({
      top: messagesRef.value.scrollHeight,
      behavior: 'smooth',
    });
  }
};
</script>

<style scoped>
.ai-chat {
  @apply flex flex-col overflow-hidden;
  background: transparent;
  max-height: 600px;
}

.chat-header {
  @apply flex items-center gap-3 p-3 mb-3;
  background: transparent;
  border-bottom: 1px solid rgb(30 41 59 / 0.5);
}

.header-icon {
  @apply flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
}

.header-content {
  @apply flex-1;
}

.header-title {
  @apply text-base font-semibold;
  color: rgb(226 232 240);
  letter-spacing: -0.01em;
}

.header-subtitle {
  @apply text-sm;
  color: rgb(148 163 184);
}

.chat-messages {
  @apply flex-1 overflow-y-auto space-y-4 mb-3;
  @apply bg-slate-900 border border-slate-800 rounded-3xl p-4;
  max-height: 400px;
}

.welcome-message {
  @apply p-5 rounded-xl;
  background: rgb(15 23 42 / 0.4);
  border: 1px solid rgb(30 41 59 / 0.5);
}

.welcome-content h4 {
  @apply text-base font-semibold mb-2;
  color: rgb(226 232 240);
  letter-spacing: -0.01em;
}

.welcome-content p {
  @apply text-sm mb-3;
  color: rgb(148 163 184);
  line-height: 1.6;
}

.welcome-examples {
  @apply mt-3;
  white-space: pre-line;
}

.welcome-examples strong {
  @apply block mb-2 text-sm;
  color: rgb(203 213 225);
}

.welcome-time {
  @apply text-xs mt-3;
  color: rgb(100 116 139);
}

.message-wrapper {
  @apply space-y-1;
}

.message-wrapper.user .message-content {
  @apply ml-auto;
}

.message-content {
  @apply p-3 rounded-lg max-w-[85%] inline-block;
  background: rgb(15 23 42 / 0.6);
  color: rgb(226 232 240);
  font-size: 14px;
  line-height: 1.6;
  border: 1px solid rgb(30 41 59 / 0.5);
}

.message-wrapper.user .message-content {
  background: rgb(14 165 233 / 0.15);
  border-color: rgb(14 165 233 / 0.3);
}

.message-time {
  @apply text-xs;
  color: rgb(100 116 139);
  margin-top: 4px;
}

.message-wrapper.user .message-time {
  @apply text-right;
}

.message-updates {
  @apply mt-2 space-y-2;
}

.update-btn {
  @apply flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm transition;
  background: rgb(14 165 233 / 0.1);
  border: 1px solid rgb(14 165 233 / 0.3);
  color: rgb(56 189 248);
}

.update-btn:hover {
  background: rgb(14 165 233 / 0.2);
  border-color: rgb(14 165 233 / 0.5);
}

.update-icon {
  @apply text-base;
}

.loading-dots {
  @apply flex gap-1;
}

.loading-dots span {
  @apply w-2 h-2 rounded-full animate-bounce;
  background: rgb(148 163 184);
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

.chat-footer {
  @apply border-t;
  background: transparent;
  border-color: rgb(30 41 59 / 0.5);
}

.quick-actions {
  @apply flex gap-2 p-3 border-b;
  border-color: rgb(30 41 59 / 0.3);
}

.quick-action {
  @apply px-3 py-1.5 rounded-lg text-xs font-medium transition;
  background: rgb(15 23 42 / 0.4);
  color: rgb(148 163 184);
  border: 1px solid rgb(30 41 59 / 0.5);
}

.quick-action:hover {
  background: rgb(15 23 42 / 0.6);
  color: rgb(203 213 225);
  border-color: rgb(51 65 85);
}

.help-icon {
  @apply inline-flex items-center justify-center w-4 h-4 rounded-full text-xs;
  background: rgb(30 41 59 / 0.5);
}

.chat-input {
  @apply flex gap-2 p-4;
}

.input-field {
  @apply flex-1 px-4 py-2.5 rounded-lg text-sm transition;
  background: rgb(15 23 42 / 0.4);
  border: 1px solid rgb(30 41 59 / 0.5);
  color: rgb(226 232 240);
}

.input-field::placeholder {
  color: rgb(100 116 139);
}

.input-field:focus {
  outline: none;
  background: rgb(15 23 42 / 0.6);
  border-color: rgb(14 165 233 / 0.5);
}

.input-field:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.send-btn {
  @apply px-4 py-2.5 rounded-lg transition flex items-center justify-center;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: white;
  min-width: 48px;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.send-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
  transform: none;
}
</style>

