# use the official Bun image
FROM oven/bun:latest

WORKDIR /app

# build web frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/bun.lock* ./
RUN bun install
COPY frontend/ ./

ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG MONGODB_URI
ENV MONGODB_URI=$MONGODB_URI
ARG CLERK_SECRET_KEY
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY
RUN bun run build

# install backend dependencies
WORKDIR /app/backend
COPY backend/package.json backend/bun.lock* ./
RUN bun install
COPY backend/ ./

# expose port
EXPOSE 3000
# set non-sensitive defaults 
ENV PORT=3000
ENV NODE_ENV=production

# start the application
CMD ["bun", "index.ts"]
