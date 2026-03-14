# UI State Contract

This document defines the binding contract for route-level and section-level loading, error, and empty states in the Angular app.

## Purpose

Use one consistent rule for:
- first-render loading
- recoverable load failures
- legitimate empty datasets

The goal is to prevent three common product failures:
- showing a normal empty screen when the route actually failed
- using global toasts as the only indicator of a blocking route error
- mixing ad hoc copy and custom placeholders across equivalent states

## State Ownership

### Route-level loading

Use `app-loading` with `variant="skeleton"` when the main page content cannot render yet.

Use this for:
- page entry fetches
- route-bound detail pages
- pages where the main shell is present but the entire data surface is blocked

Do not use inline spinners for a blocked route.

### Section-level loading

Use inline loading only when:
- the page itself is already usable
- a subsection, tab, feed, or widget is refreshing independently
- the user still has meaningful surrounding context

Examples:
- insight side panels
- lazy chart panels inside an already loaded page
- modal subsection refreshes

### Route-level errors

Use `app-page-error-state` when the user cannot complete the primary page task because the route data failed to load.

Requirements:
- provide a clear title
- provide a concrete message
- wire `(retry)` to the real load method

Use toasts only as secondary/background feedback, not as the sole signal for a blocked route.

### Section-level errors

Use local error UI inside the relevant card/shell when:
- the rest of the page still works
- only one subsection failed

Do not escalate section failures to a full route-level error unless they block the page’s primary function.

### Empty states

Use `app-empty-state` only when the data loaded successfully and the empty result is legitimate.

Never show `app-empty-state` for:
- network/API failure
- authorization failure
- unresolved loading

## Copy Rules

### Empty-state headings

Prefer clear, product-grade headings:
- `Performance trend unavailable`
- `Goals will appear here`
- `Recovery trend unavailable`

Avoid:
- `Coming soon`
- `No data yet`
- `No X yet` when the product can say something more precise

### Empty-state descriptions

Descriptions should explain one of:
- what unlocks the state
- what action the user should take next
- why the content is unavailable

Good:
- `Start logging daily check-ins to unlock your sleep trend.`
- `Join a team to compare your performance.`

Avoid vague filler:
- `No data yet`
- `Nothing here`

## Decision Rules

Ask these in order:

1. Did the page fail to load?
Use `app-page-error-state`.

2. Is the route still loading its main content?
Use `app-loading` with `variant="skeleton"`.

3. Did the route load successfully but return zero relevant items?
Use `app-empty-state`.

4. Is only one subsection loading or failing?
Keep the state local to that section.

## Exceptions

Custom states are allowed only when one of these is true:
- onboarding/setup flows where the state is itself the product experience
- wizard/stepper flows where the UI is not a normal data page
- dashboards using a documented custom skeleton system

If a custom pattern is used, it must still obey the same semantic rules:
- loading must not look like empty
- failure must not look like success or emptiness
- empty must only appear after a successful load

## Current Canonical Components

- loading: `app-loading`
- route error: `app-page-error-state`
- empty state: `app-empty-state`

## Enforcement Notes

When auditing a page:
- check the first render path
- check the first failure path
- check the zero-data path
- confirm those three states are visually and semantically distinct

If a page uses:
- toast only for initial failure
- inline loader for a blocked route
- empty state during failure

it is out of contract and should be fixed.
