---
name: manametamaori.com deployed to Beast
description: ManaMetaMaori website deployed as Docker container on Beast (148.230.100.223) on port 3080, needs DNS pointing and JWT secret rotation
type: project
---

manametamaori.com deployed to Beast (148.230.100.223) on 2026-04-07.

- Repo: `/docker/manametamaori/` on Beast, cloned from `github.com/ivonharris-cyber/manametamaori`
- Container: `manametamaori`, port 3080->3000, Node 22 Alpine, SQLite
- APIs working: `/api/blog`, `/api/suno-tracks`, frontend at `/`
- Traefik labels set for `manametamaori.com` + `www.manametamaori.com` with Let's Encrypt
- Volumes: `manametamaori-data` (DB), `manametamaori-uploads` (media)

**Why:** Moving from Replit hosted app to self-hosted on Beast for full control and domain ownership.

**How to apply:**
- DNS A records still need pointing to 148.230.100.223
- JWT_SECRET should be rotated from default before real production traffic
- Traefik must be running on Beast to handle TLS termination
- To update: `cd /docker/manametamaori && git pull && docker compose up -d --build`
