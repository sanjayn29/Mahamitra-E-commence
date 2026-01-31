import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zikguihpxnvbjcunybkt.supabase.co'
const supabaseKey = 'sb_publishable_TMuMQtHWtrxQTdRU40xJHw_cnUBaoYj'

export const supabase = createClient(supabaseUrl, supabaseKey)
