
#!/usr/bin/env bash
set -Ceu
#---------------------------------------------------------------------------
# HTTPローカルサーバを起動する
#---------------------------------------------------------------------------
Run() {
	THIS="$(realpath "${BASH_SOURCE:-0}")"; HERE="$(dirname "$THIS")"; PARENT="$(dirname "$HERE")"; THIS_NAME="$(basename "$THIS")"; APP_ROOT="$PARENT";
	cd "$HERE"
	PORT=8000
	URL="http://0.0.0.0:$PORT/"
	chromium-browser $URL
	python3 -m http.server $PORT
}
Run "$@"
