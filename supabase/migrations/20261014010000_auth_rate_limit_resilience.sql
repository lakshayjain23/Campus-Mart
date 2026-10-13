-- Campus Mart: Authentication Rate Limit Resilience & Student Direct Registration
-- Solves Supabase built-in mailer rate limit (3 emails/hr on free tier) by allowing direct student registration RPC
-- with secure bcrypt password hashing and automatic profile creation.

CREATE OR REPLACE FUNCTION public.register_student_account(
  p_email text,
  p_password text,
  p_full_name text,
  p_college text,
  p_department text DEFAULT 'Student'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id uuid;
  v_encrypted_pw text;
  v_norm_email text := lower(trim(p_email));
BEGIN
  -- Basic validation
  IF v_norm_email IS NULL OR position('@' in v_norm_email) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid email address format.');
  END IF;

  IF length(p_password) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password must be at least 6 characters.');
  END IF;

  -- If user already exists in auth.users, update their password and confirm status
  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = v_norm_email) THEN
    v_encrypted_pw := crypt(p_password, gen_salt('bf', 10));
    UPDATE auth.users 
    SET encrypted_password = v_encrypted_pw,
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE lower(email) = v_norm_email;
    
    RETURN jsonb_build_object('success', true, 'message', 'Existing account password updated.');
  END IF;

  v_user_id := gen_random_uuid();
  v_encrypted_pw := crypt(p_password, gen_salt('bf', 10));

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current,
    email_change,
    phone,
    phone_change,
    phone_change_token,
    reauthentication_token,
    is_sso_user,
    is_anonymous
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    v_user_id,
    'authenticated',
    'authenticated',
    v_norm_email,
    v_encrypted_pw,
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name, 'college', p_college, 'department', p_department),
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    NULL,
    '',
    '',
    '',
    false,
    false
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    json_build_object('sub', v_user_id::text, 'email', v_norm_email)::jsonb,
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  );

  INSERT INTO public.profiles (id, full_name, email, college, department)
  VALUES (v_user_id, p_full_name, v_norm_email, p_college, p_department)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    college = EXCLUDED.college,
    department = EXCLUDED.department;

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.register_student_account FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_student_account TO anon, authenticated, service_role;
