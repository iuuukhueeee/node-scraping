FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for vite-node)
RUN npm ci

# Copy source code
COPY . .
RUN chmod +x docker-entrypoint.sh

CMD ["./docker-entrypoint.sh"]


# # Generate Prisma client
# RUN npx prisma generate
# RUN npx prisma migrate deploy
# # RUN npm run migrate

# # Expose port
# EXPOSE 3001

# # Start server
# CMD ["npm", "run", "start"]