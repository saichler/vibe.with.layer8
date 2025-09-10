FROM golang:1.24-alpine AS build
RUN apk update
RUN apk upgrade
RUN apk add gcc
RUN apk add build-base
RUN apk add git
#RUN apk add go
RUN apk add --no-cache libc6-compat
RUN mkdir -p /home/src/github.com/saichler/build

COPY patch/plugin.go /usr/lib/go/src/runtime/plugin.go
ENV GOPATH /home
ENV CGO_ENABLED 1

WORKDIR /home/src/github.com/saichler/build