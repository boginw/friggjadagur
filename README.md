# fríggjadagur.fo

Er tað fríggjadagur? A tiny single-page site that answers one question, in Faroese, using Faroese time (`Atlantic/Faroe`).

Hosted on GitHub Pages, served at [fríggjadagur.fo](https://fríggjadagur.fo) (`xn--frggjadagur-pcb.fo` in punycode, which is what `CNAME` holds).

The misspelled [fríggjardagur.fo](https://fríggjardagur.fo) is redirected here by a Cloudflare Redirect Rule.

## Email

Mail anything to `…@fríggjadagur.fo` and a Cloudflare Email Worker (`worker/`) answers. It shares its logic with the site through `friday.js`. Pushes to `main` that touch the worker deploy it via GitHub Actions, which needs the `CLOUDFLARE_API_TOKEN` repo secret.

## Easter eggs

Not listed here. Go find them. 🐑
