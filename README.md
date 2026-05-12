# Media-Aware Asset Optimization Pipeline

This repo contains a production-like implementation of an automated image-optimization pipeline that runs on PRs and stores analytics for a dashboard.

High-level flow:

PR Raised → GitHub Actions → Kubernetes Job → Optimizer Container → Optimize images → Commit → Push → MongoDB log → Dashboard

See `README-SETUP.md` for local setup with Minikube and running the pipeline.
