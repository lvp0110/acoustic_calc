FROM node:20-alpine AS builder

WORKDIR /app

COPY acoustic_calc/package.json acoustic_calc/package-lock.json ./
RUN npm ci

COPY acoustic_calc/ .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY acoustic_calc/package.json acoustic_calc/package-lock.json ./
RUN npm ci --omit=dev

COPY acoustic_calc/server.js ./
COPY --from=builder /app/dist ./dist

# Create certs directory and copy certificates
RUN mkdir -p /app/certs
COPY certs/ /app/certs/

# Expose both HTTP and HTTPS ports
EXPOSE 3000 3443

CMD ["node", "server.js"]
