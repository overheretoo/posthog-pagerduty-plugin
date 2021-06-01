# Posthog PagerDuty plugin

[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg?style=flat-square)](https://opensource.org/licenses/MIT)

This plugin alerts PagerDuty when a PostHog insights/trends graph goes below or above a threshold

## Installation

1. Open PostHog.
1. Head to the Plugins page from the sidebar.
1. Install from URL using this repository's URL.

## Configuring

1. Get the trends URL.
  - Go to insights
  - open network tab
  - construct the graph you want to alert on
  - Copy url
  - Add `&refresh=true` at end to force it to refresh
2. Choose threshold and operator (less than or equal, greater than or equal)
3. Enter PagerDuty service Integration key (for Events API v2)

## Questions?

### [Join our Slack community.](https://join.slack.com/t/posthogusers/shared_invite/enQtOTY0MzU5NjAwMDY3LTc2MWQ0OTZlNjhkODk3ZDI3NDVjMDE1YjgxY2I4ZjI4MzJhZmVmNjJkN2NmMGJmMzc2N2U3Yjc3ZjI5NGFlZDQ)

We're here to help you with anything PostHog!
