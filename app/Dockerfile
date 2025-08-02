FROM node:22-alpine

# set working dir in container
# "./" now refers to "/app" in the container
WORKDIR /app

# copy package files for installing dependencies
COPY package*.json ./
COPY app/tsconfig.json ./

# install all dependencies
RUN npm ci

COPY app/src/ ./src/
COPY app/ui/ ./ui/

# compile ts to js
RUN npm run build

# remove dev dependencies to reduce image size
RUN npm ci --only=production && npm cache clean --force

# documenting which port should be exposed
EXPOSE 3000

ENV NODE_ENV=production

RUN wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -O /tmp/global-bundle.pem

CMD ["node", "./dist/src/server.js"]
