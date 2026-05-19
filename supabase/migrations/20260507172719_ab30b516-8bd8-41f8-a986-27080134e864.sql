
-- 1) Leonardo => admin
DO $$
DECLARE uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'leonardo.jaramillo@unmsm.edu.pe';
  IF uid IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = uid;
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin');
  END IF;
END $$;

-- 2) Fabio => cajero
DO $$
DECLARE uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'fabio.santos@unmsm.edu.pe';
  IF uid IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = uid;
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'cajero');
  END IF;
END $$;

-- 3) Jesshua => crear cuenta con contraseña temporal y rol almacenero
DO $$
DECLARE
  uid uuid;
  existing uuid;
BEGIN
  SELECT id INTO existing FROM auth.users WHERE email = 'jesshua.ferre@unmsm.edu.pe';
  IF existing IS NULL THEN
    uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'jesshua.ferre@unmsm.edu.pe',
      crypt('Vitivinicolas2026!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('nombres','Jesshua','apellidos','Ferre','role','almacenero'),
      '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), uid, jsonb_build_object('sub', uid::text, 'email', 'jesshua.ferre@unmsm.edu.pe'), 'email', uid::text, now(), now(), now());
  ELSE
    uid := existing;
    DELETE FROM public.user_roles WHERE user_id = uid;
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'almacenero');
  END IF;
END $$;
