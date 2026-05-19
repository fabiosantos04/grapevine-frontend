
-- ============== ROLES ==============
CREATE TYPE public.app_role AS ENUM ('admin', 'cajero', 'almacenero', 'vendedor', 'contador');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombres TEXT NOT NULL DEFAULT '',
  apellidos TEXT NOT NULL DEFAULT '',
  cargo TEXT,
  telefono TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nombres, apellidos)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombres',''), COALESCE(NEW.raw_user_meta_data->>'apellidos',''));
  -- Default role: vendedor (least-privileged operational role)
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'vendedor');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============== FINANZAS ==============
CREATE TABLE public.cuentas_bancarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banco TEXT NOT NULL,
  numero_cuenta TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ahorro','corriente')),
  moneda TEXT NOT NULL DEFAULT 'PEN',
  saldo NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cuentas_bancarias ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.cajas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  ubicacion TEXT,
  saldo_inicial NUMERIC(14,2) NOT NULL DEFAULT 0,
  saldo_actual NUMERIC(14,2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta','cerrada')),
  fecha_apertura TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_cierre TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.cajas ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.movimientos_caja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id UUID NOT NULL REFERENCES public.cajas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso','egreso')),
  monto NUMERIC(14,2) NOT NULL,
  descripcion TEXT,
  comprobante_url TEXT,
  rendido BOOLEAN NOT NULL DEFAULT false,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.movimientos_caja ENABLE ROW LEVEL SECURITY;

-- ============== COMPRAS ==============
CREATE TABLE public.proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razon_social TEXT NOT NULL,
  ruc TEXT NOT NULL UNIQUE,
  contacto TEXT,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.solicitudes_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto TEXT NOT NULL,
  cantidad NUMERIC(12,2) NOT NULL,
  justificacion TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobada','rechazada','comprada')),
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.solicitudes_compra ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_id UUID NOT NULL REFERENCES public.proveedores(id),
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  estado_pago TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente','parcial','pagado')),
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;

-- ============== ALMACÉN ==============
CREATE TABLE public.almacenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  departamento TEXT NOT NULL,
  provincia TEXT NOT NULL,
  distrito TEXT NOT NULL,
  responsable TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.almacenes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('vino','pisco','insumo','otro')),
  unidad TEXT NOT NULL DEFAULT 'unidad',
  precio NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  almacen_id UUID NOT NULL REFERENCES public.almacenes(id) ON DELETE CASCADE,
  stock NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(producto_id, almacen_id)
);
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER inv_updated BEFORE UPDATE ON public.inventario
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.guias_movimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('compra','venta','traslado','importacion')),
  origen_almacen_id UUID REFERENCES public.almacenes(id),
  destino_almacen_id UUID REFERENCES public.almacenes(id),
  descripcion TEXT,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.guias_movimiento ENABLE ROW LEVEL SECURITY;

-- ============== VENTAS ==============
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razon_social TEXT NOT NULL,
  documento TEXT NOT NULL,
  tipo_documento TEXT NOT NULL DEFAULT 'DNI' CHECK (tipo_documento IN ('DNI','RUC','CE')),
  contacto TEXT,
  telefono TEXT,
  email TEXT,
  segmento TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id),
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  tipo_comprobante TEXT NOT NULL CHECK (tipo_comprobante IN ('boleta','factura')),
  serie TEXT,
  numero TEXT,
  estado TEXT NOT NULL DEFAULT 'emitida' CHECK (estado IN ('emitida','anulada')),
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.venta_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id UUID NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES public.productos(id),
  cantidad NUMERIC(12,2) NOT NULL,
  precio NUMERIC(12,2) NOT NULL,
  subtotal NUMERIC(14,2) NOT NULL
);
ALTER TABLE public.venta_items ENABLE ROW LEVEL SECURITY;

-- ============== AUDITORÍA ==============
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  accion TEXT NOT NULL,
  tabla TEXT,
  detalle JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============== POLÍTICAS RLS ==============
-- profiles
CREATE POLICY "view own or admin" ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "update own" ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);
CREATE POLICY "admin manage profiles" ON public.profiles FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- user_roles: only admins manage; users see own
CREATE POLICY "view own roles" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Generic helper: authenticated read; insert/update authenticated; delete admin
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['cuentas_bancarias','cajas','movimientos_caja','proveedores','solicitudes_compra','compras','almacenes','productos','inventario','guias_movimiento','clientes','ventas','venta_items']
  LOOP
    EXECUTE format('CREATE POLICY "auth read" ON public.%I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "auth insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "auth update" ON public.%I FOR UPDATE TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "admin delete" ON public.%I FOR DELETE TO authenticated USING (public.has_role(auth.uid(),''admin''))', t);
  END LOOP;
END $$;

-- audit logs: admin read; any auth insert
CREATE POLICY "admin read logs" ON public.audit_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "auth insert logs" ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
