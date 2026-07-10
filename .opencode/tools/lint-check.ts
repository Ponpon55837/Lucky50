import { tool } from '@opencode-ai/plugin'

export default tool({
  description: '執行 ESLint 檢查和 TypeScript 型別檢查',
  args: {
    typecheck: tool.schema
      .boolean()
      .optional()
      .describe('是否執行 TypeScript 型別檢查（vue-tsc --noEmit）'),
  },
  async execute(args, context) {
    const { $, worktree } = context
    const results: string[] = []

    // ESLint 檢查
    try {
      const lintResult = await $`cd ${worktree} && npx eslint . --format compact`.text()
      results.push(`ESLint 檢查通過:\n${lintResult}`)
    } catch (error) {
      results.push(`ESLint 檢查失敗:\n${error instanceof Error ? error.message : String(error)}`)
    }

    // TypeScript 型別檢查
    if (args.typecheck !== false) {
      try {
        const tscResult = await $`cd ${worktree} && npx vue-tsc --noEmit`.text()
        results.push(`TypeScript 型別檢查通過:\n${tscResult}`)
      } catch (error) {
        results.push(`TypeScript 型別檢查失敗:\n${error instanceof Error ? error.message : String(error)}`)
      }
    }

    return results.join('\n\n---\n\n')
  },
})
