# Coursify Queue API

Queue AI content generation from external apps (pyqdeck, etc.) or cron jobs.

## Authentication

All requests require a Bearer token:

```bash
Authorization: Bearer YOUR_COURSIFY_API_KEY
```

Set the env var `COURSIFY_API_KEY` in your production environment (e.g., Vercel env vars).

This single key is used by:

- **External apps** (pyqdeck) to queue topics
- **Cron scheduler** (cron-job.org) to trigger generation

## Endpoints

### 1. Queue Generation

**POST** `/api/coursify/generate-topic/queue`

Queue a topic for AI generation.

**Request:**

```json
{
  "topic": "Explain how machine learning works",
  "isReferenceEnabled": false,
  "clientId": "pyqdeck"
}
```

**Response (queued):**

```json
{
  "success": true,
  "jobId": "6a2051768aec25e865bc7239",
  "status": "queued",
  "message": "Job queued for generation. Check status or poll /api/coursify/generate-topic/[jobId]"
}
```

**Response (from cache):**

```json
{
  "success": true,
  "jobId": "6a2051768aec25e865bc7239",
  "status": "done",
  "fromCache": true,
  "slug": "machine-learning-explained",
  "title": "Explain how machine learning works",
  "message": "Result returned from cache"
}
```

### 2. Check Job Status

**GET** `/api/coursify/generate-topic/[jobId]`

Check the status of a queued job.

**Response (queued):**

```json
{
  "success": true,
  "jobId": "6a2051768aec25e865bc7239",
  "status": "queued",
  "topic": "Explain how machine learning works",
  "clientId": "pyqdeck",
  "message": "Generation in progress..."
}
```

**Response (done):**

```json
{
  "success": true,
  "jobId": "6a2051768aec25e865bc7239",
  "status": "done",
  "resultSlug": "machine-learning-explained",
  "message": "Result ready at /api/coursify/research/machine-learning-explained"
}
```

**Response (failed):**

```json
{
  "success": true,
  "jobId": "6a2051768aec25e865bc7239",
  "status": "failed",
  "error": "API rate limit exceeded",
  "attempts": 3
}
```

### 3. Fetch Generated Content

**GET** `/api/coursify/research/[slug]`

Once a job is done, fetch the actual generated markdown.

**Response:**

```json
{
  "title": "Explain how machine learning works",
  "content": "# Machine Learning Explained\n\n## What is ML?\n...",
  "slug": "machine-learning-explained",
  "summary": "...",
  "usage": {
    "promptTokens": 1200,
    "completionTokens": 3450
  }
}
```

## Integration Example (Python)

```python
import requests
import time

API_KEY = "your_coursify_api_key"
BASE_URL = "https://yoursite.com"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# 1. Queue generation
response = requests.post(
    f"{BASE_URL}/api/coursify/generate-topic/queue",
    headers=HEADERS,
    json={
        "topic": "How do black holes work?",
        "isReferenceEnabled": True,
        "clientId": "pyqdeck"
    }
)

data = response.json()
job_id = data["jobId"]
print(f"Job queued: {job_id}")

# 2. Poll status until done
while True:
    status_response = requests.get(
        f"{BASE_URL}/api/coursify/generate-topic/{job_id}",
        headers=HEADERS
    )

    status_data = status_response.json()
    if status_data["status"] == "done":
        slug = status_data["resultSlug"]
        print(f"Done! Result slug: {slug}")
        break
    elif status_data["status"] == "failed":
        print(f"Failed: {status_data['error']}")
        break

    print(f"Status: {status_data['status']}, waiting...")
    time.sleep(10)  # Poll every 10 seconds

# 3. Fetch content
if status_data["status"] == "done":
    content_response = requests.get(
        f"{BASE_URL}/api/coursify/research/{slug}",
        headers=HEADERS
    )
    content = content_response.json()
    print(f"Title: {content['title']}")
    print(f"Content length: {len(content['content'])} chars")
```

## Integration Example (JavaScript)

```javascript
const API_KEY = 'your_coursify_api_key';
const BASE_URL = 'https://yoursite.com';

async function generateTopic(topic) {
  // 1. Queue generation
  const queueRes = await fetch(`${BASE_URL}/api/coursify/generate-topic/queue`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic,
      isReferenceEnabled: true,
      clientId: 'pyqdeck',
    }),
  });

  const { jobId, status, resultSlug } = await queueRes.json();
  console.log(`Job queued: ${jobId}`);

  if (status === 'done' && resultSlug) {
    // Cached, result ready immediately
    return fetchContent(resultSlug);
  }

  // 2. Poll until done
  let result = null;
  while (!result) {
    const statusRes = await fetch(`${BASE_URL}/api/coursify/generate-topic/${jobId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    const statusData = await statusRes.json();

    if (statusData.status === 'done') {
      result = await fetchContent(statusData.resultSlug);
    } else if (statusData.status === 'failed') {
      throw new Error(`Generation failed: ${statusData.error}`);
    } else {
      console.log('Still generating, waiting...');
      await new Promise((r) => setTimeout(r, 10000)); // 10s
    }
  }

  return result;
}

async function fetchContent(slug) {
  const res = await fetch(`${BASE_URL}/api/coursify/research/${slug}`);
  return res.json();
}
```

## How It Works

1. **External app** calls `POST /api/coursify/generate-topic/queue` with a topic
2. **API checks cache** — if the topic was generated before, returns immediately with slug
3. **API checks queue** — if the same topic is already queued/generating, returns existing job ID (no duplicate)
4. **If new**, creates a `CoursifyExternalJob` record (queued)
5. **Cron worker** (runs hourly) picks up external jobs and processes them
   - Uses Flash tier only (free)
   - Respects $0.40/hr Pollinations budget
   - Stores results in `CoursifyResearch` (same table as web UI)
6. **External app polls** `GET /api/coursify/generate-topic/[jobId]` until done
7. **Once done**, fetches content via `GET /api/coursify/research/[slug]`

**Deduplication:**

- Same topic queued twice → returns first job's ID
- Same topic already cached → returns cached result immediately
- Prevents wasted API calls and budget

## Rate Limits

- **Budget:** ~$0.40/hour (shared across web + external API)
- **Retries:** 3 attempts per job (auto-retried hourly)
- **Queue:** Up to 10 jobs per cron run (1-hour intervals)

## Pricing

Same as web UI generation:

- **Flash tier:** ~$0.067 per generation (included in monthly budget)
- **Budget reset:** Hourly

## Troubleshooting

**401 Unauthorized**: Check your `COURSIFY_EXTERNAL_API_KEY`

**Job stuck in "queued"**: Waiting for next hourly cron run. Budget may also be depleted; check again in 1 hour.

**Job failed after 3 retries**: Check error message. May be rate-limited or content-filtered.

---

Happy generating! 🚀
