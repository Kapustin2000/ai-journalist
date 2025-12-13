<template>
  <Icon :icon="name" :class="props.class" />
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';

const props = defineProps<{
  name: string;
  class?: string;
}>();
</script>

