<template>
  <div class="pwd">
    {{ workDir }}
  </div>
</template>

<script lang="ts">
  import { defineComponent } from 'vue'

  import { useSeeelaye } from '@/base/injection'

  import { Binary } from '@/models/bin'

  import { binComposition } from '@/compositions/bin'

  export const binaryFn = (): Binary<[], []> => new Binary<[], []>(
    'WorkDir',
    'pwd',
    'Display the current working directory.',
    [],
    [],
  )

  /**
   * Displays the current working directory.
   */
  export default defineComponent({
    name: 'WorkDir',
    setup() {
      binComposition()

      const seeelaye = useSeeelaye()
      const workDir = seeelaye.state.currentNode?.absolutePath ?? 'unknown'

      return {
        workDir,
      }
    },
  })
</script>
