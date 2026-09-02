-- Check for triggers on auth.users table
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
