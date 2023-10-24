FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json yarn.lock ./

RUN yarn install --immutable

COPY . .

RUN yarn build

FROM node:18-alpine
RUN apk add --no-cache libc6-compat

ENV NODE_ENV production

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json yarn.lock ./

RUN yarn install --immutable

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD [ "yarn" , "start" ]