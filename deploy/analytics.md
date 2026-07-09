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

## First: make sure nginx is writing them

Forge's default site config contains `access_log off;`. **Delete that line.**
It does not get overridden by the `access_log … privacy;` directive in
`nginx.conf` — nginx's `off` cancels *every* `access_log` directive at the same
level, whichever order they appear in. Left in place, it logs nothing, silently,
and the log file is never even created.

## Reading the logs

Install [GoAccess](https://goaccess.io) once, on the server:

```sh
sudo apt install goaccess
```

Then, over SSH:

```sh
ssh forge@<your-server>
cd paperpillbox.com
./deploy/stats.sh                      # interactive dashboard in the terminal
./deploy/stats.sh --html ~/report.html # a report to take home
```

`q` quits the dashboard. Arrow keys and `TAB` move between panels: unique
visitors per day, top pages, referring sites, countries, browsers, and
404s — the last of which is the most useful of the lot when someone links to
the site incorrectly.

To read the HTML report on your own machine:

```sh
scp forge@<your-server>:~/report.html . && open report.html
```

Write it to your home directory, never inside `~/paperpillbox.com/` — anything
in the web root is served to the public. `stats.sh` refuses to do that.

## Retention

`stats.sh` reads today's log plus every rotated one that logrotate still has,
so history runs back as far as Ubuntu's default nginx policy keeps — about two
weeks. If you want longer, raise `rotate` in `/etc/logrotate.d/nginx`.

Nothing else stores this data. It expires on its own, which is the point.

## If the numbers look wrong

GoAccess reports a **failed parse** count rather than guessing at a line it
cannot read. If that number is not zero, `LOG_FORMAT` in `stats.sh` has drifted
from `log_format privacy` in `nginx.conf`. They must match exactly.

## What this cannot tell you

Client-side events. You will know how many people opened the site, where they
came from, and what browsers they used. You will not know how many clicked
**Print**, because measuring that would require the page to send a request,
which is exactly the thing `connect-src 'none'` forbids.

That number would be nice to have. It is not worth what it costs.
