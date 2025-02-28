# Use the official Node.js image as a base
FROM node:18

# Set the working directory
WORKDIR /usr/src/app/backend


# Copy package.json and package-lock.json
COPY package*.json ./backend/

# Install dependencies including mysql2
RUN npm install --prefix ./backend --production

# Copy the rest of the application code
COPY ./backend/ ./backend/

# Expose the application port
EXPOSE 3001

# Command to run the application
CMD ["node", "./backend/index.js"]  # Change this to point to index.js
