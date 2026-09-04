# Digest inherited from eid-gerege-mn's reproducible web build.  The tag keeps
# the human-readable runtime while the digest prevents an upstream tag move
# from changing a PetroNet image without a repository change.
FROM node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2 AS builder
WORKDIR /app

# Playwright's postinstall would otherwise fetch three browsers into a layer
# that only ever runs `next build`. The end-to-end suite is CI's and the
# developer's; the image does not run it.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    NEXT_TELEMETRY_DISABLED=1

# package-lock.json must be copied too, otherwise `npm ci` is impossible and
# `npm install` silently resolves different dependency versions per build.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# NEXT_PUBLIC_* values are baked into the client bundle at build time.
# Empty by default, and production leaves it empty: the browser then asks the
# host that served the page, which is what keeps one image usable by every
# deployment. Set it only where the API is genuinely on another origin.
ARG NEXT_PUBLIC_API_URL=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CONTROL_PLANE_API_URL=
ENV NEXT_PUBLIC_CONTROL_PLANE_API_URL=$NEXT_PUBLIC_CONTROL_PLANE_API_URL

# Browser error reporting. It has to be a build argument rather than a runtime
# variable because NEXT_PUBLIC_* is substituted into the bundle here — an image
# built without it cannot be given one later by editing compose. Empty is off,
# which is what every build that does not pass it gets.
#
# The DSN is not a secret: it names the project to write to and grants nothing
# else. The release is what ties an error to the build that caused it.
ARG NEXT_PUBLIC_SENTRY_DSN=
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_RELEASE_VERSION=
ENV NEXT_PUBLIC_RELEASE_VERSION=$NEXT_PUBLIC_RELEASE_VERSION
ARG NEXT_PUBLIC_ENVIRONMENT=production
ENV NEXT_PUBLIC_ENVIRONMENT=$NEXT_PUBLIC_ENVIRONMENT

RUN npm run build

FROM node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2 AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN addgroup -g 10001 -S nextjs && adduser -u 10001 -S nextjs -G nextjs
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/public ./public

USER 10001:10001
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "server.js"]
