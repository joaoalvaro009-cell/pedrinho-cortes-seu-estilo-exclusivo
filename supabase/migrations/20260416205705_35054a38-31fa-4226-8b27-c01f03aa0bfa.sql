DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;

CREATE POLICY "Anyone can create appointments"
ON public.appointments
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(client_name)) BETWEEN 1 AND 100
  AND length(trim(cut_type)) BETWEEN 1 AND 500
  AND appointment_date >= CURRENT_DATE
);