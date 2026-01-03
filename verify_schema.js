const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function check() {
    console.log('Checking profiles...');
    const { data: p, error: pe } = await supabase.from('profiles').select('*').limit(1);
    if (pe) console.error('Profiles error:', pe);
    else console.log('Profiles columns:', Object.keys(p[0] || {}));

    console.log('Checking posts...');
    const { data: po, error: poe } = await supabase.from('posts').select('*').limit(1);
    if (poe) console.error('Posts error:', poe);
    else console.log('Posts columns:', Object.keys(po[0] || {}));
}

check();
