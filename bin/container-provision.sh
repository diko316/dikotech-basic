#!/bin/sh

mkdir -p ${APP_CWD}/source

apk add --no-cache bash || exit $?

cp ${APP_CWD}/setup/container-entrypoint.sh /usr/local/bin/entrypoint.sh && \
    chmod +x /usr/local/bin/entrypoint.sh || exit $?

cd ${APP_CWD}/cache && \
    npm install -y -dd || exit $?

