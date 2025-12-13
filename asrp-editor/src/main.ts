import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './assets/tailwind.css';
import './style.css';
import { i18n } from './plugins/i18n';
import IconComponent from './components/Icon.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(i18n);

// Register Icon component globally
app.component('Icon', IconComponent);

app.mount('#app');

