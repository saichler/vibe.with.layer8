#!/usr/bin/env bash
set -e
docker build --no-cache --platform=linux/amd64 -t saichler/l8vibe-web:latest .
docker push saichler/l8vibe-web:latest
