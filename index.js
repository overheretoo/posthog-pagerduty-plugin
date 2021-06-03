import { URL } from 'url'

export async function runEveryMinute(meta) {
    const activeIncidentKey = await meta.cache.get("pagerduty_active_incident")
    const isInError = await isTrendErroring(meta)

    // console.log({ activeIncidentKey, isInError })

    if (activeIncidentKey && !isInError) {
        await resolvePagerduty(activeIncidentKey, meta)
        console.log('Resolved pagerduty incident', activeIncidentKey)
    } else if (!activeIncidentKey && isInError) {
        const key = await triggerPagerduty(meta)
        console.log('Triggered pagerduty incident', key)
    } else if (isInError) {
        console.log('Pagerduty incident is active, ignoring error for now')
    } else {
        console.log('All good! 😍')
    }
}

async function isTrendErroring(meta) {
    const { data } = await getTrend(meta)
    return !data.slice(-2).some((value) =>
        !dataPointInError(value, parseFloat(meta.config.threshold), meta.config.operator)
    )
}

function dataPointInError(value, threshold, operator) {
    if (operator.startsWith('≤')) {
        return value <= threshold
    } else {
        return value >= threshold
    }
}

async function getTrend(meta) {
    const response = await fetch(insightsApiUrl(meta.config.posthogTrendUrl), {
        headers: {
            authorization: `Bearer ${meta.config.posthogApiKey}`
        }
    })

    if (!response.ok) {
        throw Error(`Error from PostHog API: status=${response.status} response=${await response.text()}`)
    }

    const results = await response.json()

    console.log('Got PostHog trends response', results)
    return results.result[0]
}

async function triggerPagerduty(meta) {
    const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'accept': 'application/vnd.pagerduty+json;version=2',
        },
        body: JSON.stringify({
            "routing_key": meta.config.pagerdutyIntegrationKey,
            "event_action": "trigger",
            "payload": {
                "summary": `${meta.config.pagerdutyIncidentSummary} - query returned 0`,
                "source": meta.config.posthogHost,
                "severity": "critical",
            },
            "links": [
                {
                    "href": meta.config.posthogTrendUrl,
                    "text": "Posthog Trends API query url"
                }
            ],
            "custom_details": {
                "operator": meta.config.operator,
                "threshold": meta.config.threshold
            }
        })
    })

    if (!response.ok) {
        throw Error(`Error from PagerDuty API: status=${response.status} response=${await response.text()}`)
    }

    // console.log('Got PagerDuty response', { status: response.status, text: await response.clone().text() })

    const { dedup_key } = await response.json()
    await meta.cache.set("pagerduty_active_incident", dedup_key)

    return dedup_key
}

async function resolvePagerduty(incidentKey, meta) {
    const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'accept': 'application/vnd.pagerduty+json;version=2',
        },
        body: JSON.stringify({
            "routing_key": meta.config.pagerdutyIntegrationKey,
            "event_action": "resolve",
            "dedup_key": incidentKey,
        })
    })

    await meta.cache.set("pagerduty_active_incident", null)
}

function insightsApiUrl(trendsUrl) {
    let url = new URL(trendsUrl)

    url.searchParams.set('refresh', 'true')
    if (url.pathname === '/insights') {
        url = new URL(`${url.origin}/api/insight/trend${url.search}${url.hash}`)
    }

    if (!url.pathname.startsWith('/api/insight/trend')) {
        throw Error(`Not a valid trends URL: ${trendsUrl}`)
    }

    return url.href
}
