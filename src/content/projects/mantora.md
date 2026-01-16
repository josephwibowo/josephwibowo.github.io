---
layout: post
comments: true
title: Mantora
exclude: false
---

*Mantora is a Open-Source local-first MCP observer: a lightweight UI + proxy for inspecting LLM data access (sessions, tool calls, results) with protective defaults.*

[https://github.com/josephwibowo/mantora-mcp](https://github.com/josephwibowo/mantora-mcp)

Mantora sits between your LLM client (Claude/Cursor) and the target MCP server (DuckDB/Postgres). It intercepts JSON-RPC messages to log traffic and enforce safety policies.
