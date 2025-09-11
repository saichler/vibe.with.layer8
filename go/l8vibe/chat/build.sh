#!/usr/bin/env bash
set -e
docker build --no-cache --platform=linux/amd64 -t saichler/l8vibe-chat:latest .
#docker build --platform=linux/amd64 -t saichler/probler-vnet:latest .
docker push saichler/l8vibe-chat:latest
