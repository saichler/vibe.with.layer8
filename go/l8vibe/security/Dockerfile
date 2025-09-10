FROM saichler/builder:latest AS build

RUN git clone https://github.com/saichler/l8utils
RUN go mod init
RUN GOPROXY=direct GOPRIVATE=github.com go mod tidy
WORKDIR /home/src/github.com/saichler/build/l8utils/go/utils/shallow_security
RUN go build -buildmode=plugin -o loader.so Loader.go Provider.go
RUN mv loader.so ../../../../.

FROM alpine AS final
RUN apk add --no-cache libc6-compat
RUN mkdir -p /home/run
WORKDIR /home/run
COPY --from=build /home/src/github.com/saichler/build/loader.so /home/run/loader.so