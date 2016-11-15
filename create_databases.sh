#!/bin/sh

# Bitmessage module
sqlite3 bitmessage.sqlite "CREATE TABLE bm_rooms ( room VARCHAR(100) PRIMARY KEY, bm_id VARCHAR(100), active INT(1) );"

# Kanban module
sqlite3 kanban.sqlite "CREATE TABLE auth_requests (id VARCHAR(40), matrix_user VARCHAR(100), room_id VARCHAR(100), requested_at DATETIME);"
sqlite3 kanban.sqlite "CREATE TABLE api_keys ( matrix_user VARCHAR(100), domain VARCHAR(50), api_key VARCHAR(100), stored_at DATETIME );"
sqlite3 kanban.sqlite "CREATE TABLE followed_boards ( matrix_user VARCHAR(100), room_id VARCHAR(100), board_id VARCHAR(100), last_check DATETIME, stored_at DATETIME );"

# Wunderlist module
sqlite3 wunderlist.sqlite "CREATE TABLE auth_requests (id VARCHAR(32), matrix_user VARCHAR(255), requested_at DATETIME , secret_key VARCHAR(32), room_id VARCHAR(100));"
sqlite3 wunderlist.sqlite "CREATE TABLE auth_tokens (matrix_user VARCHAR(255), auth_token VARCHAR(255), obtained_at DATETIME);"
sqlite3 wunderlist.sqlite "CREATE TABLE monitors ( matrix_room VARCHAR(225), matrix_user VARCHAR(255), list_id INTEGER, webhook_id INTEGER , secret_key VARCHAR(100), list_title VARCHAR(200));"

