---
id: TASK-141
title: Add missing DNS records for llmsunplugged.org
status: To Do
assignee: []
created_date: '2026-08-16 07:31'
labels:
  - ops
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
DNS audit (2026-08-16, during the PDF-bucket migration) found the zone at
Namecheap (Domain List → llmsunplugged.org → Advanced DNS) missing several
best-practice records. All changes go in the Host Records table; remember to
click the green tick on each row or it silently discards.

**1. PDF bucket CNAME** (required for pdf.llmsunplugged.org — the site's PDF
links depend on it; first save attempt didn't land, authoritative NS still
return NXDOMAIN):

| Type | Host | Value |
|---|---|---|
| CNAME | `pdf` | `llms-unplugged-pdfs.t3.tigrisbucket.io.` |

**2. Apex HTTPS fix**: the bare domain currently points at Namecheap's URL
forwarder (162.255.119.83), which only redirects over plain HTTP —
https://llmsunplugged.org fails to connect, and browsers try HTTPS first.
Delete the URL Redirect record and add the GitHub Pages apex records (GitHub
then serves the apex with a cert and 301s to www itself):

| Type | Host | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |

**3. Email spoofing hardening**: the domain sends no mail but has no SPF,
DMARC or MX, so spoofed mail from @llmsunplugged.org has no policy to fail
against. Standard records for a non-sending domain:

| Type | Host | Value |
|---|---|---|
| TXT | `@` | `v=spf1 -all` |
| TXT | `_dmarc` | `v=DMARC1; p=reject; sp=reject;` |
| MX | `@` | `.` (priority `0` — RFC 7505 null MX; set Mail Settings to Custom MX) |

**Optional, skipped by default**: CAA `0 issue "letsencrypt.org"` would pin
cert issuance (both GitHub Pages and Tigris use Let's Encrypt today), but
breaks renewal silently if either provider changes CA — only add it
deliberately.

The www CNAME (→ anucybernetics.github.io) is correct and stays as-is.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 dig +short CNAME pdf.llmsunplugged.org returns llms-unplugged-pdfs.t3.tigrisbucket.io and https://pdf.llmsunplugged.org/worksheets/grid.pdf serves a PDF
- [ ] #2 https://llmsunplugged.org loads (redirecting to https://www.llmsunplugged.org) with a valid certificate
- [ ] #3 dig +short TXT llmsunplugged.org includes 'v=spf1 -all'
- [ ] #4 dig +short TXT _dmarc.llmsunplugged.org returns the DMARC reject policy
- [ ] #5 dig +short MX llmsunplugged.org returns '0 .'
<!-- AC:END -->
