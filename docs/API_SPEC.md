# API Specification

## Issues

### Create Issue

`POST /functions/v1/create-issue`

Input:
```json
{
  "image": "base64 or storage path",
  "lat": 0,
  "lng": 0
}
```

Output:
```json
{
  "id": "uuid",
  "issue_type": "pothole",
  "severity": "high",
  "confidence": 95,
  "description": "...",
  "trust_score": 86,
  "duplicate_of": null
}
```

If duplicate found:
```json
{
  "duplicate_of": "existing-issue-uuid",
  "message": "Issue already reported. Follow existing issue?"
}
```

### Get Issues

`GET` via Supabase client:
```typescript
supabase.from('issues').select('*').order('trust_score', { ascending: false })
```

With location (for map):
```typescript
supabase.rpc('get_issues_with_coords', { ... })
```

### Verify Issue

`POST /functions/v1/verify-issue`

Input:
```json
{
  "issue_id": "uuid",
  "verified": true
}
```

Effect: Insert verification, recalculate trust score (+2 confirm, -2 reject).

### Update Status

`PATCH` via Supabase client:
```typescript
supabase.from('issues').update({ status: 'resolved' }).eq('id', issueId)
```

## Analyze Image

`POST /functions/v1/analyze-image`

Client-side: `services/geminiService.ts` wraps this with **localStorage cache** (`lib/geminiCache.ts`).
Same image + GPS → cache hit, no network on refresh/HMR. Disable with `VITE_GEMINI_CACHE=false`.

Input:
```json
{
  "image_url": "https://..."
}
```

Output:
```json
{
  "issue_type": "pothole",
  "severity": "high",
  "confidence": 95,
  "description": "Large pothole occupying significant lane width."
}
```

## Realtime

Subscribe to `issues` table changes:
```typescript
supabase.channel('issues').on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, callback)
```
