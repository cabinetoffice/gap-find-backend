# Building layer
FROM node:18-alpine AS development

WORKDIR /app

# Copy configuration files
COPY tsconfig*.json ./
# Lockfile and yarn config so the build uses the locked versions and node-modules linker
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases/ .yarn/releases/

# Install dependencies
RUN corepack enable
RUN corepack prepare yarn@3.6.0 --activate
RUN yarn --version
RUN yarn install --immutable


# Copy application sources (.ts, .tsx, js)
COPY src/ src/

# Build application (produces dist/ folder)
RUN yarn build

# Runtime (production) layer
FROM node:18-alpine AS production

WORKDIR /app

# Copy dependencies files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases/ .yarn/releases/

# Install runtime dependecies
RUN corepack enable
RUN corepack prepare yarn@3.6.0 --activate
RUN yarn --version
RUN yarn install --immutable


# Copy production build
COPY --from=development /app/dist/ ./dist/

# Expose application port
EXPOSE 3000

# Start application
CMD [ "node", "dist/main.js" ]
