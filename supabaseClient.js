const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://iumgkvpsjffiwurisjvb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ns2GZzQ8xDWrmFzhH2gfCA_4ugfH_iE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = { supabase };