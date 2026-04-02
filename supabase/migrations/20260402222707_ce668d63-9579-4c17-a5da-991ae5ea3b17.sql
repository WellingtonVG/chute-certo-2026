
-- Add invite_created_at column to boloes
ALTER TABLE public.boloes ADD COLUMN invite_created_at timestamptz NOT NULL DEFAULT now();

-- Update existing rows to use created_at as invite_created_at
UPDATE public.boloes SET invite_created_at = created_at;

-- Create a security definer function for public invite lookup (bypasses RLS)
CREATE OR REPLACE FUNCTION public.lookup_bolao_by_invite(invite_code_input text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'id', b.id,
    'name', b.name,
    'invite_created_at', b.invite_created_at,
    'expired', (b.invite_created_at + interval '7 days') < now()
  ) INTO result
  FROM public.boloes b
  WHERE b.invite_code = invite_code_input;

  RETURN result;
END;
$$;

-- Create function to regenerate invite code
CREATE OR REPLACE FUNCTION public.regenerate_invite_code(bolao_id_input uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  result json;
BEGIN
  -- Only admins can regenerate
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  new_code := encode(extensions.gen_random_bytes(6), 'hex');

  UPDATE public.boloes
  SET invite_code = new_code, invite_created_at = now()
  WHERE id = bolao_id_input;

  SELECT json_build_object('invite_code', new_code, 'invite_created_at', now()) INTO result;
  RETURN result;
END;
$$;
