-- Short referral codes table
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX idx_referral_codes_profile ON public.referral_codes(profile_id);

-- Referral tracking table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referred_wallet TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(referred_id)
);

-- RLS policies
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own referral code" ON public.referral_codes FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "Users can insert own referral code" ON public.referral_codes FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Anyone can read referral codes" ON public.referral_codes FOR SELECT TO anon USING (true);

CREATE POLICY "Users can read own referrals" ON public.referrals FOR SELECT TO authenticated USING (referrer_id = auth.uid());
CREATE POLICY "System can insert referrals" ON public.referrals FOR INSERT TO authenticated WITH CHECK (referred_id = auth.uid());

-- Function to generate unique short code
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code(p_profile_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
BEGIN
  SELECT code INTO v_code FROM referral_codes WHERE profile_id = p_profile_id;
  IF v_code IS NOT NULL THEN RETURN v_code; END IF;
  
  LOOP
    v_code := substr(md5(random()::text), 1, 6);
    BEGIN
      INSERT INTO referral_codes (profile_id, code) VALUES (p_profile_id, v_code);
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;
  END LOOP;
END;
$$;