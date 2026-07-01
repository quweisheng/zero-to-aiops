# AIOps Knowledge Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the AIOps repository from a technology list into a tutorial-style knowledge base with a repeatable deep-dive article standard.

**Architecture:** Keep the VitePress site structure unchanged. Add a writing standard and template, then rewrite three core markdown files as exemplar tutorials that future technology articles can follow.

**Tech Stack:** VitePress, Markdown, GitHub Pages, official documentation references.

## Global Constraints

- Do not copy full official documentation.
- Keep each article original, beginner-friendly, and operation-oriented.
- Preserve existing VitePress routes.
- Run a fresh local build before committing.

---

### Task 1: Add the Knowledge Writing Standard

**Files:**
- Create: `docs/tech-stack/writing-standard.md`
- Create: `docs/templates/tech-stack-deep-dive.md`
- Modify: `docs/tech-stack/README.md`
- Modify: `docs/.vitepress/config.mts`

**Interfaces:**
- Consumes: Existing `docs/tech-stack` information architecture.
- Produces: A reusable deep-dive standard linked from the site navigation.

- [ ] **Step 1: Create the writing standard**

Write the expected article structure, official-source rule, hands-on rule, troubleshooting rule, interview rule, and learning-evidence rule.

- [ ] **Step 2: Create the reusable article template**

Create a copyable markdown template that future technology-stack files can use.

- [ ] **Step 3: Link the standard**

Add the writing standard to the technical stack sidebar and total checklist.

### Task 2: Rewrite the Three Exemplar Articles

**Files:**
- Modify: `docs/tech-stack/observability/prometheus.md`
- Modify: `docs/tech-stack/observability/grafana.md`
- Modify: `docs/tech-stack/cloud-native/docker-compose.md`

**Interfaces:**
- Consumes: Official Prometheus, Grafana, and Docker Compose docs.
- Produces: Three readable exemplar tutorials for the knowledge base.

- [ ] **Step 1: Rewrite Prometheus**

Cover metrics, labels, pull model, TSDB, scrape configuration, PromQL, alert rules, AIOps usage, labs, troubleshooting, interview questions, and learning evidence.

- [ ] **Step 2: Rewrite Grafana**

Cover data sources, dashboards, panels, variables, alerting, provisioning mindset, AIOps dashboard design, troubleshooting, interview questions, and learning evidence.

- [ ] **Step 3: Rewrite Docker Compose**

Cover services, networks, volumes, environment variables, service discovery, common commands, a Prometheus and Grafana lab, troubleshooting, interview questions, and learning evidence.

### Task 3: Update Site Entry Points

**Files:**
- Modify: `docs/index.md`
- Modify: `docs/tech-stack/progress.md`

**Interfaces:**
- Consumes: The new writing standard and exemplar articles.
- Produces: Clear navigation for readers who arrive at the homepage.

- [ ] **Step 1: Add a knowledge-base quality section to the homepage**

List the first three exemplar tutorials and explain the article standard.

- [ ] **Step 2: Mark exemplar status in progress**

Add a note that Prometheus, Grafana, and Docker Compose are the first deep-dive examples.

### Task 4: Verify and Publish

**Files:**
- No source files created by this task.

**Interfaces:**
- Consumes: All changed markdown and VitePress config.
- Produces: A pushed commit on `main`.

- [ ] **Step 1: Run the local build**

Run: `npm run docs:build`

- [ ] **Step 2: Check for obvious mojibake**

Run a repository-wide search for common mojibake marker characters and confirm no tutorial article matches.

- [ ] **Step 3: Check git diff whitespace**

Run: `git diff --check`

- [ ] **Step 4: Commit and push**

Commit message: `docs: upgrade aiops knowledge depth examples`
