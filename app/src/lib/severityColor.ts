export function severityColor(severity: string): string {
  const s = severity.toLowerCase()
  if (s === 'high') return 'var(--color-brand-primary)'
  if (s === 'medium') return '#7a7a7a'
  return '#1d1d1f'
}

export function statusEmoji(status: string): string {
  switch (status) {
    case 'resolved':
      return '✓'
    case 'in_progress':
      return '🔧'
    case 'verified':
      return '✔'
    default:
      return '⚠'
  }
}

export function feedMessage(issue: { issue_type: string; status: string }): string {
  const type = issue.issue_type
  if (issue.status === 'resolved') return `✓ ${type} fixed in your area`
  if (issue.status === 'verified') return `✔ ${type} verified nearby`
  return `⚠ New ${type.toLowerCase()} reported nearby`
}
