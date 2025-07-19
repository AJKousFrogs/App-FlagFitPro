# Use Alpine Linux for smaller image size
FROM alpine:latest

# Install necessary packages
RUN apk add --no-cache \
    ca-certificates \
    unzip \
    wget

# Create app directory
WORKDIR /pb

# Copy PocketBase binary (assuming it's already in the project)
COPY pocketbase ./pocketbase

# Copy migrations and hooks
COPY pb_migrations ./pb_migrations
COPY pb_hooks ./pb_hooks

# Make PocketBase executable
RUN chmod +x ./pocketbase

# Expose port
EXPOSE 8080

# Create data directory
RUN mkdir -p ./pb_data

# Start PocketBase
CMD ["./pocketbase", "serve", "--http=0.0.0.0:8080", "--dir=./pb_data"]