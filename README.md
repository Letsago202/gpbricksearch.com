# GPBrickSearch — Full-stack starter

This is a runnable Node.js application with:
- Responsive search UI
- Live server-side Rebrickable catalog search for sets, minifigures and parts
- API key stored only in a server-side `.env` file
- Basic security headers and API rate limiting
- Clear status/error messages

## Requirements
- Node.js 20+
- A newly rotated Rebrickable API key

## Run locally
1. Extract this ZIP.
2. Open a terminal in the `GPBrickSearch_App` folder.
3. Run `npm install`.
4. Copy `.env.example` to `.env`.
5. Put your newly rotated key in `.env`:
   `REBRICKABLE_API_KEY=your_new_key`
6. Run `npm start`.
7. Open http://localhost:3000

Do not paste the key into browser code, screenshots, public repositories or chat.
Do not commit `.env`; it is excluded by `.gitignore`.

## API behavior
The browser calls `/api/search`. The server calls Rebrickable using its Authorization header.
The API key is never sent to the browser. Search types supported: `sets`, `minifigs`, `parts`.
The proxy limits calls to 30 per minute per client and requests up to 50 results per search.
Rebrickable's API rate limits and terms apply.

## Important product limitations
- Rebrickable supplies catalog information, not marketplace prices.
- Price comparison and historical charts need separately licensed/approved marketplace data.
- Accounts, saved collections and database-backed price history are not implemented in this starter yet.
- No API key is included in this project.
- Before public launch, add persistent storage, authentication, CSRF/session protections as appropriate,
  monitoring, deployment secrets, privacy/terms pages, accessibility testing and backups.

## Deploy
Deploy to a Node-compatible host (for example Render, Railway, Fly.io or a VPS), set
`REBRICKABLE_API_KEY` as a private environment variable, then point your domain's DNS
to the host according to that provider's instructions. Do not expose `.env`.
