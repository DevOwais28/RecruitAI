# server

An Express.js API scaffolded with [create-6pp-app](https://www.npmjs.com/package/create-6pp-app).

## Requirements

- Node.js 22.13 or newer
- Redis, reachable at `REDIS_URL` (default `redis://localhost:6379`). While Redis is down the rate limiter counts requests in memory instead.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the server and restarts it when a source file changes |
| `npm start` | Runs the server |
| `npm run lint` | Checks the code with ESLint (`npm run lint:fix` also fixes what it can) |

The server listens on `PORT` (default 4000). It runs in development mode while `NODE_ENV` is unset or `development`, and in production mode for any other value. Set `NODE_ENV=production` wherever the app is deployed: development mode shows error details to clients.

## Environment variables

`npm run dev` and `npm start` read `.env` if it exists. The file is ignored by git, so keep `.env.example` up to date and copy it on a new machine:

```sh
cp .env.example .env
```

## Rate limiting

Each IP address gets 100 requests per minute. Behind a reverse proxy or load balancer, set `trust proxy` in the app file (see the comment there), or every visitor shares the proxy's address and one limit.

## Docker

```sh
docker build -t server .
docker run -p 4000:4000 server
```

Pass configuration to the container with `-e NAME=value` or `--env-file <file>`.

## Error handling

Express 5 forwards errors thrown in route handlers, including rejected promises from `async` handlers, to the error middleware, so handlers need no `try`/`catch` wrapper. Throw `new HttpError(404, "Not found")` to choose the status code and message; anything else becomes a 500 whose details stay in the server log.
