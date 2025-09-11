FROM saichler/builder:latest AS build

ENV CGO_ENABLED 1
COPY main.go /home/src/github.com/saichler/build/main.go
RUN go mod init
RUN GOPROXY=direct GOPRIVATE=github.com go mod tidy
RUN go build -o chat

FROM saichler/l8vibe-security:latest AS final
COPY --from=build /home/src/github.com/saichler/build/chat /home/run/chat

ENTRYPOINT ["/home/run/chat"]