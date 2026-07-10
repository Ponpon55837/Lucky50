import { tool } from '@opencode-ai/plugin'

export default tool({
  description: '執行 Vitest 單元測試，支援指定檔案或全部測試',
  args: {
    file: tool.schema
      .string()
      .optional()
      .describe('要執行的測試檔案路徑（選填，不填則執行全部）'),
    coverage: tool.schema
      .boolean()
      .optional()
      .describe('是否產生覆蓋率報告'),
  },
  async execute(args, context) {
    const { $, worktree } = context
    const fileArg = args.file ? ` ${args.file}` : ''
    const coverageFlag = args.coverage ? ' --coverage' : ''

    try {
      const result = await $`cd ${worktree} && npx vitest run${fileArg}${coverageFlag} --reporter=verbose`.text()
      return result
    } catch (error) {
      return `測試執行失敗: ${error instanceof Error ? error.message : String(error)}`
    }
  },
})
