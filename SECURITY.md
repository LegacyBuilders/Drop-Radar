# Security Policy

The Drop-Radar team takes the security of our software seriously. This document
describes how to report security vulnerabilities and how we respond to and learn
from security incidents.

## Supported Versions

Security updates are provided for the latest released version on the `main`
branch. Older versions may not receive fixes.

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |
| older   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, report them privately using one of the following channels:

1. **GitHub Private Vulnerability Reporting** (preferred): Open the
   [Security Advisories](https://github.com/LegacyBuilders/Drop-Radar/security/advisories/new)
   page and click **Report a vulnerability**.
2. **Email**: Send details to **security@legacybuilders.dev**.

When reporting, please include as much of the following as possible:

- A description of the vulnerability and its potential impact.
- Steps to reproduce, including affected versions, configuration, and any
  proof-of-concept code.
- Any suggested remediation, if known.

## Our Response Process

We follow a coordinated disclosure and incident response process:

| Stage             | Target Timeline                                  |
| ----------------- | ------------------------------------------------ |
| Acknowledgement   | Within 3 business days of your report            |
| Triage & severity | Within 7 business days                           |
| Status updates    | At least every 7 days until resolution           |
| Fix & disclosure  | Coordinated with the reporter once a fix is ready|

### Detect

We monitor automated security tooling (CodeQL code scanning, Dependency Review,
and Dependabot alerts) and inbound vulnerability reports to detect potential
security issues.

### Respond

Upon confirming an incident we:

1. Assign an owner and assess severity and scope.
2. Develop and test a fix on a private branch or advisory.
3. Release a patched version and publish a GitHub Security Advisory.
4. Credit reporters who wish to be acknowledged.

### Learn

After remediation we conduct a brief post-incident review to capture root cause,
timeline, and follow-up actions so we can prevent similar issues in the future.

## Safe Harbor

We will not pursue or support legal action against researchers who act in good
faith, avoid privacy violations and service disruption, and give us reasonable
time to remediate before public disclosure.

Thank you for helping keep Drop-Radar and its users safe.
