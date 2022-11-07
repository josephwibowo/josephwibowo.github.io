---
layout: post
comments: true
title: CloudyCam
exclude: false
---

[![Dashboard Screenshot](/images/cloudycam.gif)]({{ site.baseurl }}{% link _posts/2022-11-04-CloudyCam.md %})
{: style="border:1px solid gray;"}
*CloudyCam is a Nest Camera Recorder in Python*
{: style="color:gray; font-size: 80%; text-align: center;"}

**All Credit goes to https://github.com/dend/foggycam who created the method to record Nest cameras in C#.**

# Learnings

Repo Link: https://github.com/josephwibowo/CloudyCam

- Turning a stream of bytes into a mp4 file
- WebSocket protocol and how to use the APIs to send/receive data
- Protocol Buffers (protobuf) and how to read the data Google Nest sends

# Next steps
 - Add unit/integration tests
 - Dockerize to run on something like a homelab or Unraid