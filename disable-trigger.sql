-- Disable the problematic trigger that's causing auth errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Verify the trigger is removed
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
