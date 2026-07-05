---
name: Wouter v3 wildcard route pitfall
description: Bare suffix wildcards (e.g. "/admin*") in wouter v3 do not behave as path wildcards — they compile to a plain regex and silently fail to match nested paths, breaking entire route subtrees (e.g. admin panels returning 404).
---

Wouter v3 uses `regexparam` under the hood. A pattern like `"/admin*"` (a bare `*`
appended directly to a literal path segment) is NOT treated as "match `/admin` and
anything under it." Instead `regexparam` compiles it to `/^\/admin*\/?$/i`, where the
`*` is a regex quantifier on the preceding character (`n`), not a wildcard segment.
This only matches `/admi`, `/admin`, `/adminn`, etc. — never `/admin/anything`.

**Why:** This causes routes nested behind such a wildcard (e.g. an admin section with
`/admin`, `/admin/login`, `/admin/dashboard`, ...) to intermittently or entirely fail
to match, producing a client-side 404 even though the route "looks" like it should
match. The bug is easy to miss because a bare `/admin` request may coincidally match
while `/admin/login` silently falls through to the app's catch-all/not-found route.

**How to apply:** When restoring, auditing, or writing wouter v3 route trees:
- Never use a bare trailing `*` directly after a literal path segment (`"/admin*"`).
- Prefer explicit, fully-enumerated routes when the route set is small and fixed
  (safest, avoids wildcard semantics entirely).
- If a true prefix/wildcard match is needed, use the named wildcard param form
  (`"/admin/:rest*"`) or wouter's `nest` prop on `<Route>` — but note `:rest*` still
  requires a `/` before it, so it won't match the bare prefix itself; combine with an
  explicit exact route for the prefix if needed.
- If an admin/login flow appears broken (login page 404s, dashboard redirects loop to
  a 404), check for this exact wildcard pattern before assuming an auth bug.
