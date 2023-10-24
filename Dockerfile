
# Building layer
FROM node:16-alpine AS development

WORKDIR /app

# Copy configuration files
COPY tsconfig*.json ./
COPY package*.json ./

# Install dependencies
RUN yarn install --immutable

# Copy application sources (.ts, .tsx, js)
COPY src/ src/

# Build application (produces dist/ folder)
RUN yarn build

# Runtime (production) layer
FROM node:16-alpine AS production

WORKDIR /app

# Copy dependencies files
COPY package*.json ./

# Install runtime dependecies
RUN yarn install --immutable

# Copy production build
COPY --from=development /app/dist/ ./dist/

# Expose application port
EXPOSE 3000

# Start application
CMD [ "node", "dist/main.js" ]