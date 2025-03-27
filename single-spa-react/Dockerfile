FROM node:latest

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Expose port 8080
EXPOSE 8080

# Start the application
CMD ["pnpm", "dev"]