-- Check for check constraints on profiles table
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
