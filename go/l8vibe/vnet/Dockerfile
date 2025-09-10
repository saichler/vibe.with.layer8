FROM saichler/probler-builder:latest AS build

ENV CGO_ENABLED 1
COPY main.go /home/src/github.com/saichler/build/main.go
RUN go mod init
RUN GOPROXY=direct GOPRIVATE=github.com go mod tidy
RUN go build -o vnet

FROM saichler/probler-security:latest AS final
COPY --from=build /home/src/github.com/saichler/build/vnet /home/run/vnet

ENTRYPOINT ["/home/run/vnet"]