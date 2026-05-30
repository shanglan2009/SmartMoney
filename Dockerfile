# ===== Frontend: Next.js =====
FROM node:20-alpine AS frontend

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# ===== Runtime =====
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=frontend /app/.next ./.next
COPY --from=frontend /app/public ./public
COPY --from=frontend /app/package.json ./package.json
COPY --from=frontend /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "run", "start"]
