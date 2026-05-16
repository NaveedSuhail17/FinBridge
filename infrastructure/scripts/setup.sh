#!/usr/bin/env bash
set -e

echo "🚀 FinBridge – Setup"

# 1. Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# 2. Copy env file
if [ ! -f .env ]; then
  echo "⚙️  Copying .env.example → .env"
  cp .env.example .env
  echo "⚠️  Edit .env and add your ANTHROPIC_API_KEY before starting"
fi

# 3. Start infrastructure
echo "🐳 Starting PostgreSQL + Redis..."
docker compose up -d postgres redis

# 4. Wait for postgres
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker compose exec postgres pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done

# 5. Sync schema (uses TypeORM schema:sync — no migration files needed for fresh setup)
echo "🗄️  Syncing database schema..."
pnpm db:schema:sync

# 6. Seed database
echo "🌱 Seeding database..."
pnpm db:seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "   Run 'pnpm dev' to start the development servers"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   Swagger:  http://localhost:3001/api/docs"
