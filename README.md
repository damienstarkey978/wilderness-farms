# Wilderness Farms

Organic eggs delivered in Ponte Vedra Beach, Florida. $10 a dozen.

Damien Starkey and Howard run the farm, with their sons Gavin and Hollis. Howard holds the health certificates, the refrigeration, the flock, and the license to sell eggs. The hens are not laying until March 2027.

## Run

Node.js 22 or newer. The app stores everything in SQLite (`node:sqlite`). No cloud database and no account keys are required to boot.

```bash
npm install
npm run dev
```

Open http://localhost:3000

- Home, delivery, and the list: `/`, `/delivery`, `/signup`
- Farm desk: http://localhost:3000/admin
- Staff desk: http://localhost:3000/staff
- Tests: `npm test`

The database file is `data/farm.sqlite`. Set `DATABASE_PATH` to put it somewhere else.

## Waitlist and greenlit

Until someone marks the farm greenlit on the farm desk, the public site is a waitlist. A signup is interest. It does not reserve a carton and it does not take payment.

When the farm is greenlit, the same form becomes an order: one-time or weekly, a Monday–Saturday delivery day, and a dozen count. Payment is Stripe Checkout. The return from Checkout confirms the payment with Stripe before any dozen are marked reserved.

Without `STRIPE_SECRET_KEY`, the order page says payments are not configured. Nothing is charged and no dozen are reserved.

## Capacity

The flock lays about 300 eggs a day (25 dozen), seven days a week. Delivery is Monday through Saturday. Never Sunday. Sunday's lay rolls to Monday.

| Day | Promise |
| --- | --- |
| Monday | 50 dozen |
| Tuesday–Saturday | 25 dozen each |

One-time orders and standing weekly orders both count against that weekday. A weekly order holds the weekday every week until it is canceled on the farm desk. A one-time order counts until it is marked delivered. A checkout that has not been paid holds its dozen for 30 minutes.

A request that would exceed the dozen left is refused. The site shows what is left. Waitlist rows do not count, but asking for more than the day's promise (26 dozen on a Tuesday, for example) is still refused.

Ponte Vedra Beach is the delivery area. Regular Ponte Vedra is undecided. Addresses that look outside Ponte Vedra Beach are saved and flagged. They are not rejected.

## Staff desk

Damien, Howard, Gavin, and Hollis open http://localhost:3000/staff and pick their name. The password is `ADMIN_PASSWORD`, the same one as the farm desk. When that variable is unset, local development uses `wilderness-local`. The public pages do not link here.

The desk is a shared ledger. Money out is feed, cartons, gas, or other, with a date, an amount in cents, and a note. Money in is egg sales, with the same fields. Weekly pay for Gavin and Hollis is entered by the person at the desk: amount in cents and the week. There is no built-in wage. Both can be paid in one week, and each pay shows on the ledger as money out.

Cartons on hand is a count they can set, or adjust up and down when they buy or pack cartons.

A delivery day lists paid orders for that weekday. Waitlist interest is not a stop. Staff can order the stops. Turn-by-turn directions open in Google Maps from those addresses, with no maps key. If there are no stops, the page says so. Marking a stop delivered shows Delivered on the staff route and on that customer's payment page. A one-time order leaves the capacity count when it is delivered. A weekly order stays on that weekday until it is canceled.

## Environment

| Variable | What it does |
| --- | --- |
| `ADMIN_PASSWORD` | Farm desk password. When it is unset, `npm run dev` uses `wilderness-local`. A production start will not use that default. |
| `STRIPE_SECRET_KEY` | Stripe secret key for Checkout. Unset means payments are not configured. |
| `STRIPE_WEBHOOK_SECRET` | Optional. The Checkout return confirms payment on its own. The webhook answers 503 until this is set, and it will not trust an unsigned body. |
| `DATABASE_PATH` | Optional SQLite file path. Default `data/farm.sqlite`. |

There is no Clerk account and no texting or calling automation.
