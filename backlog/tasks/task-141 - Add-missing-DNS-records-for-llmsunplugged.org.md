---
id: TASK-141
title: Add missing DNS records for llmsunplugged.org
status: Done
assignee: []
created_date: '2026-08-16 07:31'
updated_date: '2026-08-18 02:06'
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
- [x] #1 dig +short CNAME pdf.llmsunplugged.org returns llms-unplugged-pdfs.t3.tigrisbucket.io and https://pdf.llmsunplugged.org/worksheets/grid.pdf serves a PDF
- [x] #2 https://llmsunplugged.org loads (redirecting to https://www.llmsunplugged.org) with a valid certificate
- [x] #3 dig +short TXT llmsunplugged.org includes 'v=spf1 -all'
- [x] #4 dig +short TXT _dmarc.llmsunplugged.org returns the DMARC reject policy
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DNS records entered at Namecheap 2026-08-16 via agent-browser (Domain List → llmsunplugged.org → Advanced DNS), verified against dns1/dns2.registrar-servers.com:
- deleted the apex URL Redirect record (it only redirected over plain HTTP)
- A @ ×4 (185.199.108-111.153), AAAA @ ×4 (2606:50c0:8000-8003::153)
- TXT @ 'v=spf1 -all'; TXT _dmarc 'v=DMARC1; p=reject; sp=reject;'
- pdf and www CNAMEs unchanged

Final state verified 2026-08-18: https://llmsunplugged.org → 301 → https://www.llmsunplugged.org/ (200) with a valid cert; http apex → 301 to HTTPS; pdf.llmsunplugged.org serves PDFs.

Null MX: dropped (was AC #5). Namecheap persists 'MX @ . priority 0' with Mail Settings on Custom MX but their nameservers serve NODATA — their FreeDNS does not publish RFC 7505 null MX, and we are not moving provider. Record left in place, inert. Anti-spoofing rests on SPF -all + DMARC p=reject.

Apex HTTPS (AC #2) — the hard part, worth recording for next time. GitHub Pages issues the cert for the exact custom domain and only includes the apex if the cert is ordered AFTER the apex records point at Pages. This cert was issued while the apex was still on Namecheap's forwarder, so it covered www only.

KEY LESSON: the REST API cannot trigger a DNS re-check. These all failed, each silently reusing the existing cert (unchanged expires_at 2026-10-16):
1. PUT /pages with an unchanged cname — server-side no-op
2. PUT cname=null then PUT cname=www... — GitHub retained the old cert
3. re-running the Pages deploy workflow

What worked, via GitHub Support's 'Troubleshoot Pages SSL issues' Virtual Agent:
1. LOAD https://github.com/<owner>/<repo>/settings/pages in a browser — this alone flips https_certificate.state from 'approved' to 'dns_changed'
2. click Save on the (unchanged) custom domain field in that UI — this acts on dns_changed and orders a new cert ('TLS certificate is being provisioned... 1 of 3')

New cert issued within ~5 min: expires_at 2026-11-16, subjectAltName covers both llmsunplugged.org and www.llmsunplugged.org, state approved, https_enforced returned to true by itself.

Also ruled out along the way: no CAA on llmsunplugged.org or org, no DNSSEC, no stray apex CNAME, ACME challenge path reachable. A support ticket was drafted but never submitted.
<!-- SECTION:NOTES:END -->
