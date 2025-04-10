FROM certbot/certbot:v1.7.0

LABEL maintainer="B24Sdk <github.com/bitrix24>"

RUN apk update && apk add --no-cache docker-cli bash

ADD entrypoint.sh .

RUN chmod +x entrypoint.sh

ENTRYPOINT [ "./entrypoint.sh" ]
