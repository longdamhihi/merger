# ------------ Client build ------------ #
FROM node:lts-alpine AS client-build
WORKDIR /app/client

# Install client packages
COPY client/package*.json ./
RUN npm install --production --ignore-scripts
RUN npm install typescript

# Build client
COPY client ./
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# ------------ Server build ------------ #
FROM node:lts-alpine AS server-build
WORKDIR /app/server

# Install server packages
COPY server/package*.json ./

# Build server
COPY server ./
RUN npm run build

# ------------ Client+Server ------------ #
FROM node:lts-slim
WORKDIR /app

# Install dependencies
RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get install -y python3-pip
RUN pip3 install --upgrade yt-dlp

# Copy builds
COPY --from=server-build /app/server/node_modules node_modules
COPY --from=server-build /app/server/dist ./

COPY --from=client-build /app/client/build client

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000

# Run the application
CMD ["node", "index"]
