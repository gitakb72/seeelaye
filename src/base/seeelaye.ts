import type { App } from 'vue'
import type { Store } from 'vuex'

import type { Binary } from '@/bins'

import type { TerminalState } from '@/store/state'

import { seeelayeKey } from '@/base/injection'

import { Interaction } from '@/models/interaction'

import Input from '@/components/input/Input.vue'
import Prompt from '@/components/prompt/Prompt.vue'
import Spinner from '@/components/spinner/Spinner.vue'

import Input_ from '@/components/input/Input_.vue'
import Prompt_ from '@/components/prompt/Prompt_.vue'
import Navigable_ from '@/components/navigable/Navigable_.vue'
import Executable_ from '@/components/executable/Executable_.vue'

export interface IInstallOptions {
  /**
   * whether to globally register the components included in the package
   */
  registerComponents?: boolean
  /**
   * whether to globally register the presentational components included in the
   * package; These components are not supposed to be used directly.
   */
  registerPureComponents?: boolean
}

/**
 * This is the main class of the project. All operations on the CLI need to be
 * communicated via this class.
 */
export class Seeelaye {
  store: Store<unknown>
  storeModule: string

  /**
   * Create a new object of class `Seeelaye`.
   *
   * @param store - the Vuex store instance used in the app
   * @param storeModule - the name of the Vuex store module that holds CLI state
   * @param bins - the name to use in the greeting
   */
  constructor(store: Store<unknown>, storeModule: string, bins: Record<string, Binary> = {}) {
    this.store = store
    this.storeModule = storeModule

    Interaction.allBins = {
      ...Interaction.allBins,
      ...bins,
    }
  }

  /* ***************
   * Vuex wrappers *
   *************** */

  /**
   * Get the state from the Vuex module used by see·el·aye.
   * @returns the state object of see·el·aye's Vuex module
   */
  get state(): TerminalState {
    // TypeScript hack: Assumes all values of state object to be terminal states
    return (this.store.state as Record<string, TerminalState>)[this.storeModule]
  }

  /**
   * Compute a getter in the Vuex module used by see·el·aye.
   * @param getterName - the unprefixed name of the getter to compute
   * @param payload - the data payload object to pass to the getter
   * @returns the return  value from the computed getter
   */
  compute<T = void>(getterName: string, payload: unknown = null): T {
    const fqn = `${this.storeModule}/${getterName}`
    if (payload) {
      return this.store.getters[fqn](payload)
    }
    return this.store.getters[fqn]()
  }

  /**
   * Commit a mutation in the Vuex module used by see·el·aye.
   * @param mutationName - the unprefixed name of the mutation to commit
   * @param payload - the data payload object to pass to the mutation
   */
  commit(mutationName: string, payload: unknown = null): void {
    const fqn = `${this.storeModule}/${mutationName}`
    if (payload) {
      this.store.commit(fqn, payload)
      return
    }
    this.store.commit(fqn)
  }

  /**
   * Dispatch an action to the Vuex module used by see·el·aye.
   * @param actionName - the unprefixed name of the action to dispatch
   * @param payload - the data payload object to pass to the action
   * @returns the return value from the dispatched action
   */
  dispatch<T = void>(actionName: string, payload: unknown = null): Promise<T> {
    const fqn = `${this.storeModule}/${actionName}`
    if (payload) {
      return this.store.dispatch(fqn, payload)
    }
    return this.store.dispatch(fqn)
  }

  /* *********
   * Install *
   ********* */

  /**
   * Install this plugin in Vue app. Do not call this function, it will be
   * invoked automatically when using the `.use()` method on the `App` instance.
   *
   * @see {@link https://v3.vuejs.org/guide/plugins.html#using-a-plugin|Vue docs} for usage instructions
   * @param app - the app in which to install this instance as a plugin
   * @param options - the configuration to use when setting up the plugin
   */
  install(app: App, options: IInstallOptions = {}): void {
    app.provide(seeelayeKey, this)
    // eslint-disable-next-line no-param-reassign
    app.config.globalProperties.$seeelaye = this

    if (options.registerComponents ?? true) {
      const components = {
        Input,
        Prompt,
        Spinner,
      }
      Object.entries(components).forEach(([name, component]) => {
        app.component(name, component)
      })

      if (options.registerPureComponents) {
        const pureComponents = {
          Input_,
          Prompt_,
          Navigable_,
          Executable_,
        }
        Object.entries(pureComponents).forEach(([name, component]) => {
          let regName = name.replace(/_$/, '')
          regName = `Pure${regName}`
          app.component(regName, component)
        })
      }
    }
  }
}
