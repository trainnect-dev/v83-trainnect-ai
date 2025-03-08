#!/bin/bash

# Load environment variables from .env.local
set -a
source .env.local
set +a

# Run the test script
echo "Running model tests..."
npx tsx scripts/test-models.ts
