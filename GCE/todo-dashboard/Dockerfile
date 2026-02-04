FROM node:22 AS builder

WORKDIR /app

COPY package*.json  ./

RUN npm ci

COPY . .

RUN npm run build


FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN addgroup -S nonroot && adduser -S nonroot -G nonroot

RUN mkdir -p /var/cache/nginx /var/run && \
    chown -R nonroot:nonroot /var/cache/nginx /var/run /usr/share/nginx/html /run

USER nonroot

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]