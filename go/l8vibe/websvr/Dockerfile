FROM saichler/builder:latest AS build

COPY main.go /home/src/github.com/saichler/build/main.go
RUN go mod init
RUN GOPROXY=direct GOPRIVATE=github.com go mod tidy
RUN go build -o websvr

FROM saichler/l8vibe-security:latest AS final
COPY --from=build /home/src/github.com/saichler/build/websvr /home/run/websvr
COPY ./web /home/run/web

ENTRYPOINT ["/home/run/websvr"]