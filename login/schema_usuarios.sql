-- ===== TABLA DE USUARIOS (Perfiles) =====
-- Esta tabla almacena información adicional de los usuarios autenticados
-- Se vincula con auth.users de Supabase Auth mediante UUID

-- Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  birth_date DATE,
  gender TEXT,
  preferences JSONB DEFAULT '{"newsletter": true, "notifications": true}',
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== INDICES PARA MEJOR RENDIMIENTO =====
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON public.user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at DESC);

-- ===== HABILITAR ROW LEVEL SECURITY (RLS) =====
-- RLS protege los datos a nivel de base de datos
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ===== POLÍTICAS DE SEGURIDAD =====

-- Política 1: Los usuarios autenticados pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

-- Política 2: Los usuarios autenticados pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política 3: Los nuevos usuarios pueden insertar su perfil
CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Política 4: Los usuarios autenticados pueden eliminar su perfil
CREATE POLICY "Users can delete own profile"
ON public.user_profiles
FOR DELETE
USING (auth.uid() = id);

-- ===== TABLA DE DIRECCIONES DE ENVÍO (OPCIONAL) =====
-- Para múltiples direcciones por usuario
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Casa', -- Casa, Oficina, Otro
  street_address TEXT NOT NULL,
  apartment_number TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  phone TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para direcciones
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_is_default ON public.user_addresses(is_default);

-- RLS para direcciones
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- Políticas para direcciones
CREATE POLICY "Users can view own addresses"
ON public.user_addresses
FOR SELECT
USING (auth.uid() = (SELECT id FROM public.user_profiles WHERE id = user_id));

CREATE POLICY "Users can manage own addresses"
ON public.user_addresses
FOR INSERT
WITH CHECK (auth.uid() = (SELECT id FROM public.user_profiles WHERE id = user_id));

CREATE POLICY "Users can update own addresses"
ON public.user_addresses
FOR UPDATE
USING (auth.uid() = (SELECT id FROM public.user_profiles WHERE id = user_id));

CREATE POLICY "Users can delete own addresses"
ON public.user_addresses
FOR DELETE
USING (auth.uid() = (SELECT id FROM public.user_profiles WHERE id = user_id));

-- ===== TABLA DE PREFERENCIAS DE USUARIO =====
-- Para guardar configuraciones personalizadas
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light', -- light, dark, auto
  language TEXT DEFAULT 'es', -- es, en, fr, pt
  currency TEXT DEFAULT 'COP',
  notifications_email BOOLEAN DEFAULT TRUE,
  notifications_sms BOOLEAN DEFAULT FALSE,
  notifications_push BOOLEAN DEFAULT TRUE,
  newsletter_subscribed BOOLEAN DEFAULT TRUE,
  newsletter_frequency TEXT DEFAULT 'weekly', -- daily, weekly, monthly
  privacy_profile BOOLEAN DEFAULT FALSE, -- Perfil privado
  show_online_status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
ON public.user_preferences
FOR ALL
USING (auth.uid() = user_id);

-- ===== TABLA DE VERIFICACIÓN DE EMAIL =====
-- Para controlar códigos de verificación
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  verification_code TEXT NOT NULL UNIQUE,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON public.email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_code ON public.email_verifications(verification_code);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON public.email_verifications(expires_at);

-- ===== TABLA DE AUDITORÍA (OPCIONAL) =====
-- Para registrar cambios importantes en perfiles de usuario
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- login, logout, profile_update, password_change, address_added, etc
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON public.user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_action ON public.user_activity_log(action);

-- ===== TRIGGER PARA ACTUALIZAR updated_at =====
-- Actualiza automáticamente el campo updated_at cuando se modifica un registro

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para user_profiles
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trigger para user_preferences
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trigger para user_addresses
CREATE TRIGGER update_user_addresses_updated_at
BEFORE UPDATE ON public.user_addresses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ===== VISTAS ÚTILES =====

-- Vista para estadísticas de usuarios
CREATE OR REPLACE VIEW public.user_statistics AS
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_verified = TRUE THEN 1 END) as verified_users,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_users_week,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_users_month
FROM public.user_profiles;

-- ===== COMENTARIOS PARA DOCUMENTACIÓN =====
COMMENT ON TABLE public.user_profiles IS 'Tabla principal de perfiles de usuario. Contiene información adicional del usuario autenticado.';
COMMENT ON COLUMN public.user_profiles.id IS 'UUID del usuario, referencia a auth.users';
COMMENT ON COLUMN public.user_profiles.full_name IS 'Nombre completo del usuario';
COMMENT ON COLUMN public.user_profiles.email IS 'Email del usuario';
COMMENT ON COLUMN public.user_profiles.phone IS 'Número de teléfono del usuario';
COMMENT ON COLUMN public.user_profiles.avatar_url IS 'URL de la foto de perfil';
COMMENT ON COLUMN public.user_profiles.is_verified IS 'Si el email ha sido verificado';
COMMENT ON COLUMN public.user_profiles.preferences IS 'Preferencias del usuario en formato JSON';

COMMENT ON TABLE public.user_addresses IS 'Tabla para múltiples direcciones de envío por usuario';
COMMENT ON TABLE public.user_preferences IS 'Configuraciones y preferencias del usuario';
COMMENT ON TABLE public.email_verifications IS 'Códigos de verificación de email';
COMMENT ON TABLE public.user_activity_log IS 'Registro de actividad del usuario para auditoría';
