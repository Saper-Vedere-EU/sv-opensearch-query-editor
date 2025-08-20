import { type App } from 'vue'
import * as components from './components'

function install(app: App) {
  for (const key in components) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.component(key, (components as any)[key])
  }
}

export default { install }

export * from './components'
