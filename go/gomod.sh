#!/usr/bin/env bash

set -e

# clean up
rm -rf go.sum
rm -rf go.mod
rm -rf vendor

# fetch dependencies
go mod init
GOPROXY=direct GOPRIVATE=github.com go mod tidy
go mod vendor
cp ./vendor/github.com/saichler/l8utils/go/utils/resources/build-test-security.sh .
chmod +x ./build-test-security.sh
rm -rf vendor
./build-test-security.sh
rm -rf ./build-test-security.sh
go mod vendor
