import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'REMPLACE_PAR_TON_URL'
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'REMPLACE_PAR_TA_CLE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
