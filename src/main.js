import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'bootstrap/dist/css/bootstrap.min.css'

// Import your auth util
import { setupAxiosInterceptors } from '@/utils/auth'

// Create the Vue app
const app = createApp(App)

// Setup axios interceptors for authentication
setupAxiosInterceptors(router)

app.use(store).use(router).mount('#app')
