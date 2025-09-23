// Simple helper that returns React nodes with <mark> around matches.
export function highlightText(text: string | undefined, query?: string) {
  if (!text) return null
  if (!query) return text
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(${safe})`, 'ig')
  const parts = text.split(re)
  return (
    <>
      {parts.map((p, i) =>
        re.test(p) ? <mark key={i} className="bg-yellow-200 text-black rounded px-0.5">{p}</mark> : <span key={i}>{p}</span>
      )}
    </>
  )
}

export default highlightText
