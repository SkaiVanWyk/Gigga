-- ================================================================
-- GIGGA – DEBUG AUTH ERROR SCRIPT
-- Run this in Supabase SQL Editor to diagnose "Database error saving new user"
-- ================================================================

-- 1. Check for triggers on auth.users table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND trigger_schema = 'auth'
ORDER BY trigger_name;

-- 2. Check for functions that might interfere with auth
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%user%' 
       OR routine_name LIKE '%auth%' 
       OR routine_name LIKE '%profile%')
ORDER BY routine_name;

-- 3. Check for any foreign key constraints that might block user creation
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'auth'
  AND tc.table_name = 'users'
ORDER BY tc.constraint_name;

-- 4. Check profiles table structure and constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check for check constraints on profiles table
SELECT
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints AS tc
LEFT JOIN information_schema.check_constraints AS cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'profiles'
  AND tc.table_schema = 'public'
  AND tc.constraint_type = 'CHECK';

-- 6. Check RLS policies on profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles'
  AND schemaname = 'public';

-- 7. Test if we can manually insert a user (this will help identify the exact error)
-- Note: This might fail, but the error message will be more detailed
-- Uncomment to test:
-- DO $$
-- BEGIN
--   INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
--   VALUES (
--     gen_random_uuid(),
--     'test@example.com',
--     crypt('testpassword', gen_salt('bf')),
--     NOW(),
--     NOW(),
--     NOW(),
--     '{"full_name":"Test User"}'::jsonb
--   );
--   RAISE NOTICE 'Manual user insert successful';
-- EXCEPTION WHEN OTHERS THEN
--   RAISE NOTICE 'Manual user insert failed: %', SQLERRM;
-- END $$;

-- 8. Check for any database extensions that might interfere
SELECT 
    extname,
    extversion,
    nspname
FROM pg_extension
JOIN pg_namespace ON pg_extension.extnamespace = pg_namespace.oid
ORDER BY extname;

-- 9. Check recent database errors (if available in pg_stat_statements)
-- This requires the pg_stat_statements extension
SELECT 
    query,
    calls,
    total_time,
    rows
FROM pg_stat_statements
WHERE query LIKE '%auth%' OR query LIKE '%user%'
ORDER BY total_time DESC
LIMIT 10;

-- 10. Check if there are any row-level security issues with auth schema
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'auth';
