#!/bin/sh

curl -XPOST -d '{"user":"<your bot username>", "password":"<your bot password>", "type":"m.login.password"}' "http://localhost:8008/_matrix/client/api/v1/register"
