export function cleanDescription(desc: string | null | undefined): string {
  if (!desc) return 'Gemini detected a municipal infrastructure anomaly requiring validation.'
  
  let cleaned = desc
  
  // Remove deterministic prefix text from datasets
  cleaned = cleaned.replace(/Dataset category:.*?(?=Issue description:)/i, '')
  cleaned = cleaned.replace(/Issue description:\s*/i, '')
  
  // Remove dataset suffix
  cleaned = cleaned.replace(/\s*\(Municipal Social Issues Dataset\)/ig, '')
  
  return cleaned.trim()
}
