#!/bin/bash
# bring up and bring down the servers

OPTION=$1
DATABASE="../database/organizations.json"

if [ "$OPTION" == "up" ]
then
    # bring up the database
    npx json-server --watch "$DATABASE" --port 8000 &
    # bring up the servers
    node server.js 20000 "db1" "Org1" "admin1" &
    node server.js 21000 "db2" "Org2" "admin2" &
    node server.js 22000 "db3" "Org3" "admin3" &
    node server.js 23000 "db4" "Org4" "admin4" &
    node server.js 24000 "db5" "Org5" "admin5" &
elif [ "$OPTION" == "down" ]
then
    # bring down the database
    fuser -k 8000/tcp || true
    # bring down the servers and all workers (if any)
    killall node || true &
fi
