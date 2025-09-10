#!/usr/bin/env bash
set -e
docker build --no-cache --platform=linux/amd64 -t saichler/builder:latest .
docker push saichler/builder:latest
