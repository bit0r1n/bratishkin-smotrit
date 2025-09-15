export function titleContainsIgnoredWord(
  title: string,
  ignoreList: string[]
): boolean {
  return ignoreList.some((word) =>
    title.toLowerCase().includes(word.toLowerCase())
  )
}
