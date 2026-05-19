FROM node:20-alpine

WORKDIR /app

# Baked into Next.js rewrites at build time (browser still uses same-origin /api).
ARG API_PROXY_TARGET=http://backend:8000
ENV API_PROXY_TARGET=${API_PROXY_TARGET}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

CMD ["npm", "start"]
