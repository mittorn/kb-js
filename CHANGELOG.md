# Changelog for "Hello Matrix" Bot


## Changes in v0.0.3 (2017-03-21)

- Support for end-to-end encryption!
- _NOTE:_ You need to change your configuration file, as the bot will now use username / password login instead of access tokens and requires a local storage folder; also re-run `npm install` as `matrix-js-sdk` needs to be updated and `node-localstorage` to be installed.


## Changes in v0.0.2 (2016-11-18)

- Kanban Tool integration now supports following boards for changes
- Hello Matrix can now send direct messages to individual users (being used for login notifications etc.)
- Hello Matrix no longer responds to stale messages when being restarted
- New !webhook functionality to set up arbitrary webhooks that get bridged into the room


## Changes in v0.0.1 (2016-11-09)

- Initial release
