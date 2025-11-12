-- Migration: add UserStatus column and unique index on LineId
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "UserStatus" TEXT DEFAULT 'PENDING';

-- Ensure LineId has a unique index if desired (safe check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'User_LineId_unique'
  ) THEN
    -- Create a unique index on LineId; this will fail if duplicates exist
    BEGIN
      CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "User_LineId_unique" ON "User"("LineId");
    EXCEPTION WHEN others THEN
      -- ignore index creation errors (e.g., duplicates)
      RAISE NOTICE 'Could not create unique index on User(LineId): %', SQLERRM;
    END;
  END IF;
END$$;
