FROM zenika/alpine-chrome

LABEL maintainer="B24Sdk <github.com/bitrix24>"

USER root
RUN apk add --no-cache \
    nginx \
    dbus && \
    # D-Bus
    mkdir -p /var/run/dbus && \
    mkdir -p /etc/dbus-1/services && \
    dbus-uuidgen > /var/lib/dbus/machine-id && \
    # Nginx
    mkdir -p /var/lib/nginx/tmp && \
    # Chrome
    chown -R chrome:chrome /var/lib/nginx /run /var/log/nginx /var/run/dbus && \
    rm -rf /var/cache/apk/*

COPY nginx.conf /etc/nginx/nginx.conf
COPY *.service /etc/dbus-1/services
COPY entrypoint.sh /

RUN chmod +x /entrypoint.sh

# USER chrome

ENTRYPOINT ["/entrypoint.sh"]
