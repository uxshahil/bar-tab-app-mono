DROP TABLE IF EXISTS public.profile;

-- DROP TYPE IF EXISTS user_role;
-- [
--   'admin',
--   'bar-manager',
--   'bar-staff'
-- ]
CREATE TABLE profile(
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  bio text DEFAULT NULL,
  user_role text DEFAULT 'bar-staff' NOT NULL,
  pin text UNIQUE NOT NULL,
  avatar_url text DEFAULT NULL,
  mode text DEFAULT 'dark' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  active boolean NOT NULL DEFAULT TRUE,
  CONSTRAINT profile_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_user_name ON public.profile(username);

CREATE INDEX idx_user_active ON public.profile(active);

