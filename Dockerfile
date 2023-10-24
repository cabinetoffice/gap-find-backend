FROM node:lts as builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json yarn.lock ./
COPY tsconfig.build.json .
COPY tsconfig.json .

RUN yarn install --immutable

RUN yarn build

COPY . .

FROM node:lts-slim

ENV NODE_ENV production

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json yarn.lock ./

RUN yarn install --production --immutable

COPY --from=builder /usr/src/app/dist ./dist

CMD [ "node", "dist/main.js" ]