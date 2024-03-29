<template>
  <div class="tree">
    <template v-if="node && isNodeOk">
      <slot/>
      <span class="shape">{{ shape }}</span>
      <Navigable
        :node="node"
        :show-aliases="verbose"/>
      <Tree
        v-for="(child, index) in node.children ?? []"
        :key="index"
        :argv="[
          ...verbose ? ['--verbose']: [],
          child.absolutePath
        ]"
        allow-files
        is-subtree>
        <slot/>
        <span class="shape">{{ childShape }}</span>
      </Tree>
    </template>
    <template v-else>
      <strong class="error">{{ dirpath }}</strong> is not a valid directory.
    </template>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent } from 'vue'

  import { Binary } from '@/models/bin'
  import { Arg, ArgType, NodeArg } from '@/models/arg'
  import { FsNodeType, specialNames } from '@/models/fs_tree'

  import { binComposition, binProps } from '@/compositions/bin'

  import Navigable from '@/components/navigable/Navigable.vue'

  const dirpathFn = () => new NodeArg(
    ArgType.POSITIONAL,
    'dirpath',
    'the path or name of the directory whose contents to list',
    FsNodeType.FOLDER,
    specialNames.CURRENT_DIR[0],
  )
  const verboseFn = () => new Arg<boolean>(
    ArgType.KEYWORD,
    'verbose',
    'whether to display more information on-screen',
    Boolean,
    false,
    ['v'],
  )
  export const binaryFn = (): Binary<[NodeArg], [Arg<boolean>]> => {
    const dirpath = dirpathFn()
    const verbose = verboseFn()
    return new Binary<[NodeArg], [Arg<boolean>]>(
      'Tree',
      'tree',
      'List contents of directory recursively like a tree.',
      [dirpath],
      [verbose],
    )
  }

  /**
   * Lists contents of directory recursively like a tree.
   */
  export default defineComponent({
    name: 'Tree',
    components: {
      Navigable,
    },
    props: {
      ...binProps,
      /**
       * whether to allow the node at `args.dirpath` to be a file; This is used
       * internally as a workaround to display children nodes that are files.
       */
      allowFiles: {
        type: Boolean,
        default: false,
      },
      /**
       * whether the tree is a subtree invoked by the `Tree` component; This
       * determines whether the terminal will be set to ready on mount.
       */
      isSubtree: {
        type: Boolean,
        default: false,
      },
    },
    setup(props, { slots }) {
      const isRoot = computed(() => !slots.default)

      const binary = binaryFn()
      const dirpath = binary.args[0]
      const verbose = binary.kwargs[0]

      binComposition(isRoot.value)
      binary.processArgs(props.argv)

      const verboseValue = verbose.value

      const dirpathValue = dirpath.handlerValue
      const node = dirpath.value
      const isNodeValidType = props.allowFiles || node?.isFolder
      const isNodeOk = dirpath.isNodeFound && isNodeValidType

      const shapes = {
        pipe: '│',
        tee: '├',
        bend: '└',
        dash: '─',
        space: '\xa0',
      }
      const isLastChild = computed(() => {
        if (!node) return false
        const siblings = node.parent.children
        return siblings.indexOf(node) === siblings.length - 1
      })
      const shape = computed(() => {
        if (isRoot.value) {
          return ''
        }
        if (isLastChild.value) {
          return `${shapes.bend}${shapes.dash.repeat(2)}${shapes.space}`
        }
        return `${shapes.tee}${shapes.dash.repeat(2)}${shapes.space}`
      })
      const childShape = computed(() => {
        if (isRoot.value) {
          return ''
        }
        if (isLastChild.value) {
          return `${shapes.space.repeat(3)}${shapes.space}`
        }
        return `${shapes.pipe}${shapes.space.repeat(2)}${shapes.space}`
      })

      return {
        dirpath: dirpathValue,
        verbose: verboseValue,

        node,
        isNodeOk,
        shape,
        childShape,
      }
    },
  })
</script>

<style scoped lang="css">
  .shape {
    --default-tree-shapes-color: var(--color-secondary-fg);
    color: var(--tree-shapes-color, var(--default-tree-shapes-color));
  }
</style>
