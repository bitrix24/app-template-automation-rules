#!/bin/bash

DH='/etc/nginx/certs/dhparam.pem'

if [ ! -e "$DH" ] ; then
  openssl dhparam -out "$DH" 2048
fi

exec "$@"
