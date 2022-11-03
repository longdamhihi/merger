# ------------ Server build ------------ #
FROM node:lts-alpine AS server-build
WORKDIR /app/server

# Install server packages
COPY server/package*.json ./

RUN sudo apt update
RUN sudo apt install ffmpeg
RUN npm install

# Build server
COPY server ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000

# Run the application
CMD ["node", "index"]
