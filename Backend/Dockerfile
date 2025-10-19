# # Use Node.js 18 LTS
# FROM node:18-slim

# # Create app directory
# WORKDIR /usr/src/app

# # Copy package files
# COPY package*.json ./

# # Install dependencies
# RUN npm ci --only=production

# # Copy app source
# COPY . .

# # Expose port
# EXPOSE 8080

# # Set environment to production
# ENV NODE_ENV=production

# # Run the application
# CMD [ "node", "src/index.js" ]

FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "src/index.js"]

# Note: the .dockerignore file should live next to this Dockerfile (e.g. Backend/.dockerignore).
# Create Backend/.dockerignore with the following contents to avoid copying unnecessary files into the image:
# node_modules
# npm-debug.log
# .env
# .git
# .gitignore
# README.md
# *.md
# .vscode
# ```

# ### Create `backend/.dockerignore`:
# ```
# node_modules
# npm-debug.log
# .env
# .git
# .gitignore
# README.md
# *.md
# .vscode