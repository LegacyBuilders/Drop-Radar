# Security Policy

The Drop-Radar maintainers take the security of our software seriously. This
document describes how to report vulnerabilities and how we respond to and
learn from security incidents.

## Supported Versions

Security updates are provided for the latest release on the `main` branch.
Older versions may not receive fixes.

| Version | Supported          |
| ------- | ------------------ |
| latest (main) | :white_check_mark: |
| older   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, report them privately using one of the following channels:

1. **GitHub Private Vulnerability Reporting** (preferred): Open the
   [Security tab](https://github.com/LegacyBuilders/Drop-Radar/security/advisories/new)
   of this repository and click **Report a vulnerability**.
2. **Email**: security@legacybuilders.dev

Please include as much of the following information as possible to help us
triage the report quickly:

- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof of concept
- Affected version(s), components, or configuration
- Any suggested mitigation or fix

## Our Response Process

We follow a structured incident response process to detect, respond to, and
learn from security incidents:

1. **Acknowledge** — We will acknowledge your report within **3 business days**.
2. **Triage** — We assess severity and impact, typically within **7 business days**.
3. **Remediate** — We develop and test a fix, and prepare a coordinated release.
4. **Disclose** — We publish a security advisory and credit reporters who wish
   to be acknowledged.
5. **Learn** — After resolution we conduct a post-incident review to identify
   root causes and improve our processes and controls.

We ask that you give us a reasonable amount of time to address the issue before
any public disclosure, and we are happy to coordinate disclosure timing with you.

## Scope

This policy applies to the code and configuration contained in this repository.
Vulnerabilities in third-party dependencies should also be reported here so we
can track and remediate them.

## Safe Harbor

We consider security research and vulnerability disclosure conducted in good
faith and in accordance with this policy to be authorized. We will not pursue
legal action against researchers who follow this policy.
