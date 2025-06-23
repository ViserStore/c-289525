
-- Create users table for storing signup information
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  withdraw_pin TEXT NOT NULL,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own data
CREATE POLICY "Users can view their own data" 
  ON public.users 
  FOR SELECT 
  USING (auth.uid()::text = id::text);

-- Create policy for inserting new users (public access for signup)
CREATE POLICY "Anyone can create user account" 
  ON public.users 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy for users to update their own data
CREATE POLICY "Users can update their own data" 
  ON public.users 
  FOR UPDATE 
  USING (auth.uid()::text = id::text);

-- Create index for faster lookups
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_phone_number ON public.users(phone_number);
