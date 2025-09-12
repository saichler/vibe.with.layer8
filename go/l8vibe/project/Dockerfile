FROM saichler/builder:latest AS build

ENV CGO_ENABLED 1
COPY main.go /home/src/github.com/saichler/build/main.go
RUN go mod init
RUN GOPROXY=direct GOPRIVATE=github.com go mod tidy
RUN go build -o proj

FROM saichler/l8vibe-security:latest AS final
COPY --from=build /home/src/github.com/saichler/build/proj /home/run/proj
COPY hoa.data /home/run/hoa.data

ENTRYPOINT ["/home/run/proj"]