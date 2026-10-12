# Deploying bookademy-web

Vercel, from the GitHub repository.

1. **vercel.com → Add New → Project**, import `JahazielGuz/bookademy-web`
2. Framework preset: **Next.js** (detected automatically)
3. Environment variables:

   | Name | Value |
   | --- | --- |
   | `DJANGO_API_URL` | `https://bookademy-core.fly.dev` |

4. **Deploy**

After the first deploy, take the Vercel URL and set it on the Django side so CORS
allows it:

```
fly secrets set WEB_ORIGIN=https://<your-vercel-url> -a bookademy-core
```

Django only needs this because `CORS_ALLOWED_ORIGINS` is built from it. The browser
never calls Django directly — Next.js proxies every request server-side so the JWT
can stay in an httpOnly cookie — but the header costs nothing and keeps the door
shut if that ever changes.
