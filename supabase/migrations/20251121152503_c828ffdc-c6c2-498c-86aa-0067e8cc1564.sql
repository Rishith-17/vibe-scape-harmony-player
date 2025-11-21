-- Add strict RLS policies to secrets table
-- Ensure only service role (edge functions) can access secrets

-- Policy 1: Deny all client SELECT access
CREATE POLICY "Clients cannot read secrets"
ON public.secrets
FOR SELECT
TO authenticated, anon
USING (false);

-- Policy 2: Deny all client INSERT access
CREATE POLICY "Clients cannot insert secrets"
ON public.secrets
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

-- Policy 3: Deny all client UPDATE access
CREATE POLICY "Clients cannot update secrets"
ON public.secrets
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- Policy 4: Deny all client DELETE access
CREATE POLICY "Clients cannot delete secrets"
ON public.secrets
FOR DELETE
TO authenticated, anon
USING (false);

-- Note: Service role bypasses RLS, so edge functions with SERVICE_ROLE_KEY can still access