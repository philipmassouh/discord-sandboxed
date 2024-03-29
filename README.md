Modified by Michael Peters
Sourced to Phil for GitHub

# Discord-Sandbox <a href="https://github.com/khlam/discord-sandboxed/releases/latest"><img src="https://img.shields.io/badge/download-latest-green.svg"></a>

> Open-source Sandbox Discord client
> Because asking for privacy will get you nowhere.

Are you worried Discord is watching what programs you have open or listening to your mic even while you're not pressing your push-to-talk key?
Discord-Sandbox isolates the Discord client from reading background processes by running the [Discord web client](https://discord.com/) inside of a [\<webview>](https://developer.chrome.com/apps/tags/webview), which is finally contained inside the Electron process. While I cannot guarantee this client protects you from anything, I have tried my best to remove Discord's data collection.

Note that since this client is running the Discord web client, the following features will (unfortunately) NOT be available.

    - Viewing Streams or Streaming your desktop
    - Discord's "High Quality Audio" or whatever

## Toggle Mute

Push-to-Talk is configured using the SIGUSR2. Send a SIGUSR2 to the electron process to trigger a click on the mute button.
You can send this signal in the terminal with pkill
`pkill -SIGUSR2 --oldest electron`

> Note: Make sure to use --oldest. Otherwise, the electron GPU processes will get angry and quit passive-agressively:
> [130264:0223/232600.871793:FATAL:gpu\_data\_manager\_impl\_private.cc(448)] GPU process isn't usable. Goodbye.
> /home/michael/builds/discord-sandboxed/node_modules/electron/dist/electron exited with signal SIGTRAP

## Telemetry Mitigations

As detailed from [Luna Mendes' discord-unofficial-docs]("https://luna.gitlab.io/discord-unofficial-docs/"), Discord sends telemetry data over the `/api/science` endpoint. This project does its best to disable this telemetry communication by running javascript code into the webview that adds a blacklist/whitelist to the default `XMLHttpRequest` behavior. In this way, we explicitly block all communication with the `science` address, while simultaneously whitelisting addresses needed for minimum Discord functionality. See the full code in [mainRender.js]("./views/js/mainRender.js").

Discord likely does other sneaky things to spy on us. If you have any ideas on improving this project's security/privacy please let me know by opening an issue!

Clicking on the Logs icon in the client will open the Log window, which will detail when a communication by the client is blocked.

<p align="center">
<img src="./docs/img/logs.PNG" />
</p>

## What this Client Tries to Do

Discord-Sandbox tries to isolate the Discord client within the Electron process, preventing it from watching keystrokes or processes it has no business in.

## What this Client Cannot Do

Discord's desktop application has the capabilities to collect a lot of user-behavior information.
This project seeks to isolate your keystrokes and background processes from Discord.
Discord can still collect the following information. Since these are inherent to the service, we can't do much about it.

- Messages, client data, emails, and voice data
- Links you have clicked/opened from within the client (Passing links to a browser has been disabled to somewhat mitigate this)

### How does Push-to-Talk Work?

The [Discord web client](https://discord.com/) lacks push-to-talk detection while the browser session does not have window focus. This project works enables system-wide push-to-talk while respecting your privacyby using a separate key-press detection library, [iohook](https://www.npmjs.com/package/iohook), and mediating its interaction with Discord.
This separates your activity from Discord without compromising usability.

When your push-to-talk key is held down, the renderer process will send a `backspace` key-down keycode to the [\<webview>](https://developer.chrome.com/apps/tags/webview). This opens your microphone without giving the client window focus, so you can use Discord without worrying about the client listening in on whatever else you're running.

# Installation (for Linux)

## Prereqs

- Make sure you've installed libxkbcommon-x11 `pacman -S libxkbcommon-x11`

## Building From Source

1. Install [Node (https://nodejs.org/en/download/)](https://nodejs.org/en/download/)
2. Clone Repo `git clone https://github.com/khlam/discord-sandboxed.git`
3. Install dependencies `npm i && npm i -d`
4. To test it out, run `npm start`

## Packaging and Installing on Arch Linux (pacman)

1. `yay -S libxcrypt-compat` Currently, electron-builder's ruby depends on an old version of libxcrypt so you might need to install the libxcrypt-compat library (especially if you're on a pretty minimal system)
2. `npm run package-pacman` Create the pacman package with electron-builder
3. `./dist/linux-unpacked/discord-sandbox` Test the unpacked version
4. `pacman -U ./dist/discord-sandbox-x.x.x.pacman` Install with pacman

> This Discord-Sandbox open source project is not affiliated with Discord or Discord Inc.
> I do not claim to have created Discord.
> Discord-Sandbox is not the official Discord client.
> Discord is a freeware VoIP application made by Discord Inc.
> You can download the official Discord client [Here](https://discord.com/).
