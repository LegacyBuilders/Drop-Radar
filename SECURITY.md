# Security Policy

The Drop-Radar team takes the security of our software seriously. This document
describes how to report vulnerabilities and what to expect from our incident
response process.

## Supported Versions

Security updates are provided for the most recent release on the `main` branch.

| Version        | Supported          |
| -------------- | ------------------ |
| latest (`main`)| :white_check_mark: |
| older releases | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, report them privately using one of the following channels:

1. **GitHub Private Vulnerability Reporting (preferred):**
   Open a report via the repository's
   [Security Advisories](https://github.com/LegacyBuilders/Drop-Radar/security/advisories/new)
   page.
2. **Email:** Send details to `security@legacybuilders.dev`.

When reporting, please include as much of the following as possible:

- A description of the vulnerability and its potential impact.
- Steps to reproduce or a proof-of-concept.
- Affected version(s), component(s), or configuration.
- Any suggested mitigation, if known.

## Our Response Process

We follow a structured incident response process to detect, respond to, and
learn from security incidents:

1. **Acknowledgement** — We aim to acknowledge your report within **2 business days**.
2. **Triage & Assessment** — We validate and assess severity (typically within **5 business days**).
3. **Remediation** — We develop and test a fix, prioritized by severity.
4. **Disclosure** — We coordinate a release and public disclosure with you, and
   credit reporters who wish to be acknowledged.
5. **Post-Incident Review** — After resolution, we conduct a retrospective to
   identify root causes and improve our controls.

## Disclosure Policy

We practice coordinated disclosure. Please give us a reasonable opportunity to
remediate the issue before any public disclosure. We will keep you informed of
progress throughout the process.

## Scope

This policy applies to the latest code in this repository. Vulnerabilities in
third-party dependencies should be reported to the respective maintainers, though
we welcome notifications so we can update affected dependencies.
