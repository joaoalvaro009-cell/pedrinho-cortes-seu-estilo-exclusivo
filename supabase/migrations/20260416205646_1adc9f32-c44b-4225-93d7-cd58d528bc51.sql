-- Enum de papéis
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Enum de status de agendamento
CREATE TYPE public.appointment_status AS ENUM (
  'aguardando_confirmacao',
  'confirmado',
  'valor_enviado',
  'remarcado',
  'cancelado',
  'concluido'
);

-- Tabela de papéis
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Appointments
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_phone TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  cut_type TEXT NOT NULL,
  barber_choice BOOLEAN NOT NULL DEFAULT false,
  status appointment_status NOT NULL DEFAULT 'aguardando_confirmacao',
  agreed_price NUMERIC(10,2),
  notes TEXT,
  cancellation_reason TEXT,
  access_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_token ON public.appointments(access_token);
CREATE INDEX idx_appointments_status ON public.appointments(status);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Availability settings (registro único)
CREATE TABLE public.availability_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unavailable_weekdays INTEGER[] NOT NULL DEFAULT ARRAY[0,1],
  time_slots TEXT[] NOT NULL DEFAULT ARRAY['09:00','10:00','11:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.availability_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.availability_settings DEFAULT VALUES;

-- Blocked dates
CREATE TABLE public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_date DATE NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- ====================== POLÍTICAS ======================

-- user_roles: só admin gerencia, usuários veem o próprio
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage roles" ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- appointments
-- Qualquer um pode criar (cliente sem login)
CREATE POLICY "Anyone can create appointments" ON public.appointments
FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Admin vê tudo
CREATE POLICY "Admins view all appointments" ON public.appointments
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin atualiza tudo
CREATE POLICY "Admins update all appointments" ON public.appointments
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin deleta
CREATE POLICY "Admins delete appointments" ON public.appointments
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Acesso por token: leitura pública apenas linha-a-linha via filtro no código.
-- Como não dá pra filtrar por token na policy sem JWT custom, criamos função SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.get_appointment_by_token(_token UUID)
RETURNS SETOF public.appointments
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.appointments WHERE access_token = _token LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.update_appointment_by_token(
  _token UUID,
  _new_date DATE,
  _new_time TEXT
)
RETURNS public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.appointments;
BEGIN
  UPDATE public.appointments
  SET appointment_date = _new_date,
      appointment_time = _new_time,
      status = 'remarcado',
      updated_at = now()
  WHERE access_token = _token
    AND status NOT IN ('cancelado', 'concluido')
  RETURNING * INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_appointment_by_token(
  _token UUID,
  _reason TEXT DEFAULT NULL
)
RETURNS public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.appointments;
BEGIN
  UPDATE public.appointments
  SET status = 'cancelado',
      cancellation_reason = COALESCE(_reason, 'Cancelado pelo cliente'),
      updated_at = now()
  WHERE access_token = _token
    AND status NOT IN ('cancelado', 'concluido')
  RETURNING * INTO result;
  RETURN result;
END;
$$;

-- Função pública para listar horários ocupados em uma data (sem expor dados pessoais)
CREATE OR REPLACE FUNCTION public.get_booked_times(_date DATE)
RETURNS TABLE(appointment_time TEXT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT appointment_time FROM public.appointments
  WHERE appointment_date = _date
    AND status NOT IN ('cancelado');
$$;

-- availability_settings: leitura pública, escrita só admin
CREATE POLICY "Anyone can read availability" ON public.availability_settings
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins update availability" ON public.availability_settings
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert availability" ON public.availability_settings
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- blocked_dates: leitura pública, escrita só admin
CREATE POLICY "Anyone can read blocked dates" ON public.blocked_dates
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage blocked dates" ON public.blocked_dates
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));