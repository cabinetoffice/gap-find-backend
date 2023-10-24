ARG NODE_VERSION=16.14.0
# Install dependencies only when needed
FROM --platform=linux/amd64 node:${NODE_VERSION}-alpine as deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app


RUN echo -e "\nnodeLinker: node-modules" >> .yarnrc.yml 

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN yarn --immutable;

#temp debug
RUN yarn -v
RUN ls -a
RUN ls -a /app/
RUN cat .yarnrc.yml

# Rebuild the source code only when needed
FROM node:16-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build


FROM node:16-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN yarn --immutable;

# Copy production build
COPY --from=builder /app/dist/ ./dist/

# Expose application port
EXPOSE 3000