FROM node:25-alpine3.22
WORKDIR /app
COPY package*.json ./
ENV NODE_ENV development
RUN npm install
COPY . .
ARG PORT=4000
ENV PORT $PORT
EXPOSE $PORT
CMD ["npm", "run", "start"]