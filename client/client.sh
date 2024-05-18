#!/bin/bash

OPTION=$1

if [ "$OPTION" == "up" ]
then
    export PORT=3001; npm run --prefix "." start &
    export PORT=3002; npm run --prefix "." start &
    export PORT=3003; npm run --prefix "." start &
else
    fuser -k tcp/3001 tcp/3002 tcp/3003 || true
fi
