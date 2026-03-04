import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iphwewrwievfglzcvtwj.supabase.co'
const supabaseKey = 'sb_publishable_d-LxPsM7N_7vCB6jRwZ1yA_nH5gifRr'

export const supabase = createClient(supabaseUrl, supabaseKey)
