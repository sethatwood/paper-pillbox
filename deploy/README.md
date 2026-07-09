# Deploying Paper Pillbox

The site is static: HTML, CSS, one JavaScript file, three fonts. There is no
build step, no runtime, and no database. Deploying is copying files to a web
root — anything that serves static files will do.

These notes cover the setup this project actually uses: **Laravel Forge** for
the server and **NameCheap** for DNS.

## 1. DNS (NameCheap)

Under *Domain List → Manage → Advanced DNS*, with the nameservers left on
NameCheap BasicDNS:

| Type  | Host  | Value                | TTL       |
| ----- | ----- | -------------------- | --------- |
| A     | `@`   | *your Forge server IP* | Automatic |
| CNAME | `www` | `paperpillbox.com.`  | Automatic |

Delete NameCheap's default parking records first — the `CNAME @ →
parkingpage.namecheap.com` and the URL-redirect record — or they will shadow
the A record.

Wait for propagation before requesting a certificate. `dig +short
paperpillbox.com` returning your server IP is the green light; Let's Encrypt's
HTTP-01 challenge fails otherwise, and a failed attempt costs you a retry
against their rate limit.

## 2. The site (Forge)

Create the site with:

- **Root domain:** `paperpillbox.com`
- **Aliases:** `www.paperpillbox.com`
- **Project type:** Static HTML / Nuxt.js
- **Web directory:** `/public` — Forge's default. Leave it alone.

Everything a browser should fetch lives in `public/`. The repository's `.git`
directory, these notes, and the README sit *above* the web root, so nginx has
no way to serve them even if a rule is later lost. That is structure doing the
work a `deny` rule would otherwise have to remember to do.

Install the repository from `sethatwood/paper-pillbox`, branch `main`, and
leave *Install Composer dependencies* unchecked. Then replace the deploy
script with, in its entirety:

```sh
cd /home/forge/paperpillbox.com
git pull origin $FORGE_SITE_BRANCH
```

Enable **Quick Deploy** so a push to `main` publishes.

Finally, *SSL → Let's Encrypt*, selecting both `paperpillbox.com` and
`www.paperpillbox.com`.

## 3. Nginx

Paste the marked block from [`nginx.conf`](nginx.conf) into *Site → Edit Files
→ Edit Nginx Configuration*, and add the `www` redirect as a separate server
block so `www` lands on the canonical apex the page already declares in
`<link rel="canonical">`.

The one header that matters is:

```
Content-Security-Policy: … connect-src 'none'; …
```

Every other privacy tool asks you to trust a policy document. `connect-src
'none'` means the page **cannot** open a fetch, XHR, WebSocket, or beacon to
anywhere — including back to this server. Someone's medication list physically
cannot leave their browser, and anyone can confirm it from devtools in about
ten seconds. `script-src 'self'` earns its place too: it blocks inline event
handlers, which is the exact shape of the stored-XSS payload this app was
hardened against.

That policy constrains the code, so keep it honest: **no inline styles, no
inline scripts, no CDN.** The `@page` orientation rule is written through
CSSOM rather than a `<style>` element precisely so `style-src 'self'` can hold
without an `'unsafe-inline'` escape hatch.

## 4. Verify

```sh
curl -sI https://paperpillbox.com | grep -i content-security-policy
curl -s -o /dev/null -w '%{http_code}\n' https://paperpillbox.com/.git/config   # expect 403 or 404
curl -s -o /dev/null -w '%{http_code}\n' https://paperpillbox.com/deploy/stats.sh  # expect 404
curl -s -o /dev/null -w '%{redirect_url}\n' https://www.paperpillbox.com        # expect the apex
```

Then open the site, add a medication, and print to PDF. The preview is the
artifact; if it looks right on screen, it is right on paper.

## 5. Analytics

There is no analytics script, and there should never be one — see
[`analytics.md`](analytics.md). Usage is read from nginx's own access logs,
which `nginx.conf` configures to truncate visitor IP addresses before writing
them to disk. GoAccess turns them into a dashboard over SSH.

## Hosting it somewhere else

Any static host works — the repository has no server-side anything. If you use
one, port the headers from `nginx.conf`; they are the only part of this
deployment carrying real weight.
