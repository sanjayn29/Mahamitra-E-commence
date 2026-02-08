-- Add user_email and user_name columns to product_comments table
ALTER TABLE product_comments 
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Add index for better performance when querying by user_email
CREATE INDEX IF NOT EXISTS idx_product_comments_user_email ON product_comments(user_email);

-- Update existing comments to add user info (optional - requires service role)
-- This would need to be done via a server-side script with proper permissions
