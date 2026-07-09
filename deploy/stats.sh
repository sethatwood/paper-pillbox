#!/usr/bin/env bash
#
# Read Paper Pillbox's traffic from the web server's own access logs.
#
# There is no analytics script on the site, so this is the only place usage
# data exists. The logs never contained a full visitor IP address: nginx
# truncates them on write (see nginx.conf).
#
#   ./stats.sh                       interactive dashboard in the terminal
#   ./stats.sh --html report.html    write a report you can scp home
#
# Run it on the server, as the forge user.

set -euo pipefail

SITE="paperpillbox.com"
LOG_DIR="/var/log/nginx"

# Must match `log_format privacy` in nginx.conf. If you change one and not the
# other, GoAccess reports failed parses rather than quietly guessing.
LOG_FORMAT='%h - [%d:%t %^] "%r" %s %b "%R" "%u"'
DATE_FORMAT='%d/%b/%Y'
TIME_FORMAT='%H:%M:%S'

html_out=""
while [ $# -gt 0 ]; do
  case "$1" in
    --html) html_out="${2:?--html needs a path}"; shift 2 ;;
    -h|--help) sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

if ! command -v goaccess >/dev/null 2>&1; then
  echo "goaccess is not installed. Run: sudo apt install goaccess" >&2
  exit 1
fi

if ! sudo test -e "${LOG_DIR}/${SITE}-access.log"; then
  echo "No access log at ${LOG_DIR}/${SITE}-access.log" >&2
  echo >&2
  echo "Almost always this means Forge's 'access_log off;' is still in the" >&2
  echo "site's nginx config. It cancels every access_log directive at the" >&2
  echo "same level, whatever order they are in. Delete that line." >&2
  exit 1
fi

args=(
  --log-format="${LOG_FORMAT}"
  --date-format="${DATE_FORMAT}"
  --time-format="${TIME_FORMAT}"
  --ignore-crawlers
)

# Rotated logs are gzipped; `zcat -f` passes plain files through untouched, so
# one glob covers today and everything logrotate has kept.
if [ -n "${html_out}" ]; then
  case "${html_out}" in
    /home/forge/"${SITE}"/public/*|*/public/*)
      echo "Refusing to write inside the web root — the report would be public." >&2
      exit 1 ;;
  esac
  sudo sh -c "zcat -f ${LOG_DIR}/${SITE}-access.log*" \
    | goaccess - "${args[@]}" -o "${html_out}"
  echo "Wrote ${html_out}"
  echo "Fetch it with:  scp forge@<server>:${html_out} ."
else
  sudo sh -c "zcat -f ${LOG_DIR}/${SITE}-access.log*" \
    | goaccess - "${args[@]}"
fi
