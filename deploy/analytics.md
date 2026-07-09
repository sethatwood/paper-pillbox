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

Forge's default site config contains `access_log off;`. **Replace that line**
with the `access_log … privacy;` directive from `nginx.conf` — do not add ours
beneath it. nginx's `off` cancels *every* `access_log` directive at the same
level, whichever order they appear in. Left in place, it logs nothing,
silently, and the log file is never even created.

## Reading the logs

Install [GoAccess](https://goaccess.io) once, on the server:

```sh
sudo apt install goaccess
```

Then, over SSH. Forge deploys atomically, so the checkout lives behind the
`current` symlink:

```sh
ssh forge@<your-server>
cd paperpillbox.com/current
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
so history runs back as far as Ubuntu's default nginx policy keeps — 14 days,
per `rotate 14` in `/etc/logrotate.d/nginx`. Raise it there if you want longer.

Nothing else stores this data. It expires on its own, which is the point.

## Reading logs without sudo

nginx creates the log as `root:root`. After the first nightly rotation,
logrotate recreates it as `www-data:adm 0640` — and `forge` is not in the `adm`
group, so `stats.sh` will start asking for a sudo password. The standard fix,
once:

```sh
sudo usermod -aG adm forge     # log out and back in for it to take effect
```

`stats.sh` falls back to `sudo` on its own if you skip this, so nothing breaks
either way.

## One leak Forge leaves behind

The `www` → apex and http → https redirect server blocks that Forge generates
declare no `access_log` of their own, so they inherit nginx's http-level
default — a log shared with every other site on the box, holding **full,
untruncated IPs**. Anyone who types the bare domain, or follows an old `www`
link, is recorded there before being redirected.

Add `access_log off;` inside each of these two server blocks:

```
/etc/nginx/forge-conf/<id>/<domain>/before/ssl_redirect.conf
/etc/nginx/forge-conf/<id>/<domain>/before/redirect.conf
```

Forge may rewrite them when a certificate is reissued, so check again after any
SSL operation.

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
