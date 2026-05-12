# syntax=docker/dockerfile:1.6
FROM node:22-alpine3.20
RUN apk add --no-cache ffmpeg
WORKDIR /app
COPY package*.json ./
ENV NODE_ENV=development
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
ARG PORT=4000
ENV PORT=$PORT
EXPOSE $PORT
CMD ["npm", "run", "start"]
