export enum FsNodeType {
  FILE = 'file',
  FOLDER = 'folder'
}

export const nameExtensionSplit = (fullName: string): [string, string | null] => {
  if (!fullName.includes('.')) {
    return [fullName, null]
  }
  const lastDot = fullName.lastIndexOf('.')
  const name = fullName.substring(0, lastDot)
  const extension = fullName.substring(lastDot + 1)
  return [name, extension]
}

export interface FsNodeInterface {
  name: string
  aliases?: string[]
  children?: FsNodeInterface[]
}

export class FsNode implements FsNodeInterface {
  type: FsNodeType
  name: string
  aliases: string[]
  parent!: FsNode
  children: FsNode[]

  constructor(type: FsNodeType, name: string, aliases: string[] = []) {
    this.type = type
    this.name = name
    this.aliases = aliases
    this.parent = this
    this.children = []
  }

  /**
   * Determine whether this node represents a file system folder.
   * @return {boolean} whether this node represents a file system folder
   */
  get isFolder(): boolean {
    return this.isType(FsNodeType.FOLDER)
  }

  /**
   * Determine whether this node represents a file system file.
   * @return {boolean} whether this node represents a file system file
   */
  get isFile(): boolean {
    return this.isType(FsNodeType.FILE)
  }

  /**
   * Determine whether this node is the root of the file system.
   * @return {boolean} whether this node is the root of the file system
   */
  get isRoot(): boolean {
    return this.parent === this
  }

  /**
   * Get all forms of the name for this node. This includes the primary name
   * and all aliases, with and without the extension.
   *
   * In addition to the name and all aliases, for
   * - files, the name without the extension
   * - folders, the name with the trailing slash
   * - the root node, a single slash
   * is also accepted.
   *
   * Duplicates names are removed.
   *
   * @returns {string[]} the list of all valid names for the node
   */
  get allNames(): string[] {
    const allNames = [this.name, ...this.aliases]
    if (this.isFile) {
      allNames.forEach((name) => {
        const [nameMinusExtension] = nameExtensionSplit(name)
        allNames.push(nameMinusExtension)
      })
    }
    if (this.isFolder) {
      allNames.forEach((name) => {
        allNames.push(`${name}/`)
      })
    }
    if (this.isRoot) {
      allNames.push('/')
    }
    return Array.from(new Set(allNames))
  }

  /**
   * Determine whether this node represents a file system file or folder.
   * @param {FsNodeType} type - the type of the node to compare this node with
   * @return {boolean} whether this node is of the given node type
   */
  isType(type: FsNodeType): boolean {
    return this.type === type
  }

  /**
   * Traverse the tree using the DFT algorithm. DFT was preferred over BFT
   * because it requires less code.
   *
   * The argument is a callback function that accepts a node and returns
   * a boolean value, which if `false`, stops further traversal.
   *
   * @param {function} func - the function to execute on each node
   * @return {boolean} whether to continue traversal
   */
  traverse(func: (node: FsNode) => boolean): boolean {
    let shouldContinue = func(this)
    if (!shouldContinue) {
      return shouldContinue
    }

    Array.from(this.children.values())
      .every((child) => {
        shouldContinue = child.traverse(func)
        return shouldContinue
      })
    return shouldContinue
  }

  /**
   * Parse a POJO representation of a file system node or subtree into an
   * `FsNode` object.
   *
   * @param {FsNodeInterface} pojo - the POJO representation to parse
   * @return {FsNode} the parsed `FsNode` instance generated from the POJO
   */
  static parse(pojo: FsNodeInterface): FsNode {
    const type = pojo.children ? FsNodeType.FOLDER : FsNodeType.FILE
    const node = new FsNode(type, pojo.name, pojo.aliases)
    if (pojo.children) {
      pojo.children.forEach((childPojo) => {
        const childNode = FsNode.parse(childPojo)
        node.children.push(childNode)
        childNode.parent = node
      })
    }
    return node
  }
}