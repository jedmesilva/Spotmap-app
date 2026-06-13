---
name: shell-quote CVE firewall block
description: shell-quote versions 1.8.3 and below are blocked by the Replit Socket Security firewall due to a Critical CVE; only 1.8.4 passes.
---

# shell-quote firewall block

The Replit package firewall (Socket Security) blocks all shell-quote versions except 1.8.4 with a Critical CVE error.

**Why:** shell-quote <=1.8.3 has a critical CVE that Socket Security flags. Version 1.8.4 is the patched release and passes the firewall.

**How to apply:** Add this to `pnpm-workspace.yaml` overrides section whenever shell-quote appears as a transitive dep (e.g. via react-devtools-core > react-native):

```yaml
overrides:
  shell-quote: "1.8.4"
```
