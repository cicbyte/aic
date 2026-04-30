FROM golang:1.23-alpine AS builder

ARG TARGETOS=linux
ARG TARGETARCH=amd64
ARG GOPROXY=https://goproxy.cn,direct

RUN apk add --no-cache git

ENV GOPROXY=${GOPROXY}
ENV GO111MODULE=on

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -ldflags="-s -w" -o aic .

FROM alpine

RUN apk add --no-cache ca-certificates tzdata

ENV WORKDIR=/app
ENV TZ=Asia/Shanghai

WORKDIR $WORKDIR

COPY --from=builder /build/aic $WORKDIR/
COPY --from=builder /build/resource $WORKDIR/resource/
COPY --from=builder /build/manifest/config $WORKDIR/manifest/config/

RUN chmod +x $WORKDIR/aic

EXPOSE 8000

VOLUME ["$WORKDIR/data", "$WORKDIR/manifest/config"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/api/v1/health || exit 1

WORKDIR $WORKDIR
CMD ["./aic"]
