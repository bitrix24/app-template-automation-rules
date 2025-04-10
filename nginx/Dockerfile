FROM nginx:latest

LABEL maintainer="B24Sdk <github.com/bitrix24>"

COPY default.conf /etc/nginx/conf.d/default.conf

ADD entrypoint.sh .

RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
