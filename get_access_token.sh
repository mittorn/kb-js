#!/bin/sh

curl -XPOST -d '{"user":"<your user>", "password":"<your password>", "type":"m.login.password"}' "https://matrix.org/_matrix/client/r0/login"
