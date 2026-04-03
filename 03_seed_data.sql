-- Patch the legacy column if it hasn't been renamed yet
ALTER TABLE IF EXISTS public.journal_entries RENAME COLUMN glow TO satisfaction;

DO $$ 
DECLARE 
  target_user_id uuid;
  -- Calculate exactly when this current week started (Monday)
  current_week date := current_date - (extract(isodow from current_date)::integer - 1);
BEGIN 
  -- Automatically grab the primary user account securely within the instance
  SELECT id INTO target_user_id FROM auth.users LIMIT 1;

  IF target_user_id IS NULL THEN
     RAISE EXCEPTION 'No user found in auth.users.';
  END IF;

  -- 1) CLEAR existing demo data just in case this is run multiple times
  DELETE FROM public.journal_entries WHERE user_id = target_user_id;
  DELETE FROM public.projections WHERE user_id = target_user_id;

  -- 2) SEED 4 Weeks of Historical Journal Truth (Showing steady improvement)
  INSERT INTO public.journal_entries (user_id, week_start, oiliness, dryness, irritation, breakouts, satisfaction)
  VALUES 
    (target_user_id, current_week - 28, 4, 3, 4, 5, 1),
    (target_user_id, current_week - 21, 4, 3, 3, 4, 2),
    (target_user_id, current_week - 14, 3, 2, 2, 3, 3),
    (target_user_id, current_week - 7,  2, 2, 1, 2, 4);

  -- 3) SEED 4 Weeks of AI Future Projections (Showing it fully resolving)
  INSERT INTO public.projections (user_id, week_start, projected_oiliness, projected_dryness, projected_irritation, projected_breakouts, projected_satisfaction, narrative)
  VALUES 
    (target_user_id, current_week,      2.0, 2.0, 1.0, 1.5, 4.5, 'Skin Barrier is recovering.'),
    (target_user_id, current_week + 7,  1.5, 1.5, 1.0, 1.0, 4.8, 'Acne mostly cleared.'),
    (target_user_id, current_week + 14, 1.5, 1.5, 1.0, 1.0, 4.9, 'Radiance improving.'),
    (target_user_id, current_week + 21, 1.0, 1.0, 1.0, 1.0, 5.0, 'Maintenance Mode active.');

END $$;
