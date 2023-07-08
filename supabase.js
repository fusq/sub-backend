const createClient = require('@supabase/supabase-js').createClient;

const URL = "https://gzglxyjxosaimyjsefct.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Z2x4eWp4b3NhaW15anNlZmN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4NTk3OTQ2MCwiZXhwIjoyMDAxNTU1NDYwfQ.ueN23ajeiiLZWxR8DR-6y20ZSU_Ll1Ivw4JpXRxERfg";

const supabase = createClient(URL, ANON_KEY);

module.exports = supabase;