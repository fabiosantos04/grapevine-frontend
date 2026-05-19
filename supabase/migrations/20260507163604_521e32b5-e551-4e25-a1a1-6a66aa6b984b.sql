
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role app_role;
  v_has_admin boolean;
BEGIN
  INSERT INTO public.profiles (id, nombres, apellidos, cargo, telefono)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombres',''),
    COALESCE(NEW.raw_user_meta_data->>'apellidos',''),
    NULLIF(NEW.raw_user_meta_data->>'cargo',''),
    NULLIF(NEW.raw_user_meta_data->>'telefono','')
  );

  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO v_has_admin;

  IF NOT v_has_admin THEN
    v_role := 'admin';
  ELSE
    BEGIN
      v_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'vendedor');
    EXCEPTION WHEN others THEN
      v_role := 'vendedor';
    END;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role);
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
