# Measuring usage without tracking anyone

Paper Pillbox has no analytics script, no cookies, no consent banner, and no
third-party requests. The site is served with `connect-src 'none'`, so the
page *cannot* phone home even if someone added code that tried to.

Usage is measured from the web server's own access logs instead — the ones
nginx writes anyway, whether or not anyone reads them. Nothing is added to the
page, so nothing about the browser changes.

## Why not Google Analytics

Two reasons, one practical and one about what this tool is.

The practical one: GA requires `script-src` to allow `googletagmanager.com`
and `connect-src` to allow `google-analytics.com`. That deletes the
`connect-src 'none'` guarantee, which is the only reason a visitor has to
believe the privacy claim rather than take it on faith. GA also sets `_ga`
cookies, which are non-essential under the ePrivacy Directive, so the tag
cannot fire until the visitor accepts a consent banner. A tool that a worried
caregiver opens to type her mother's prescriptions should not greet her with a
cookie dialog from an advertising company.

The other reason: GA would not transmit the medication list — that never
leaves `localStorage` and never touches the URL — but it *would* tell Google
that a particular person visited a medication-charting tool, with a cross-site
identifier attached. That is a health inference about a real human being, and
it contradicts the promise in the footer of the page.

## What the logs keep

Not visitor IP addresses. `nginx.conf` defines a `privacy` log format that
truncates the final octet of every IPv4 address and everything after the
second group of an IPv6 address, before the line is ever written to disk:

```
203.0.113.47                            ->  203.0.113.0
2001:db8:85a3:8d3:1319:8a2e:370:7348    ->  2001:db8::
```

Country, referrer, page, browser, and status code survive. The identity of the
household does not. The honest cost is that unique-visitor counts get slightly
fuzzy, since everyone behind the same `/24` collapses into one address — which
is the correct trade for this project.

## Reading the logs

Install [GoAccess](https://goaccess.io) once:

```sh
sudo apt install goaccess
```

Then, over SSH, for an interactive dashboard in the terminal:

```sh
goaccess /var/log/nginx/paperpillbox.com-access.log \
  --log-format='%h - [%d:%t %^] "%r" %s %b "%R" "%u"' \
  --date-format='%d/%b/%Y' \
  --time-format='%H:%M:%S' \
  --ignore-crawlers
```

The `--log-format` must match the `privacy` format in `nginx.conf`. If you
change one, change the other; GoAccess reports mismatches as failed parses
rather than guessing.

For an HTML report you can download and read locally, add `-o report.html` and
`scp` it off the server. Write it somewhere **outside the web root** —
`~/reports/` rather than `~/paperpillbox.com/` — so it is never served.

Log rotation is Forge's default logrotate policy. Rotated logs are the only
place this data lives, and it expires on its own.

## What this cannot tell you

Client-side events. You will know how many people opened the site, where they
came from, and what browsers they used. You will not know how many clicked
**Print**, because measuring that would require the page to send a request,
which is exactly the thing `connect-src 'none'` forbids.

That number would be nice to have. It is not worth what it costs.
