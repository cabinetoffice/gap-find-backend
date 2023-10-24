ARG NODE_VERSION=16.14.0
# Install dependencies only when needed
FROM --platform=linux/amd64 node:${NODE_VERSION}-alpine
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json
COPY tsconfig.build.json .
COPY tsconfig.json .

RUN yarn --immutable;

COPY . .

RUN yarn build

ENV NODE_ENV production

CMD [ "node", "dist/main.js" ]
