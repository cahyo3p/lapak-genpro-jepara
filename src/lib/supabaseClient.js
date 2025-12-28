import { createClient } from '@supabase/supabase-js'

// GANTI DENGAN DATA ANDA DARI DASHBOARD SUPABASE
// (Menu: Settings -> API)
const supabaseUrl = 'https://fuvupbaafhgjehqxwloy.supabase.co' 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1dnVwYmFhZmhnamVocXh3bG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MTgxNzQsImV4cCI6MjA4MjQ5NDE3NH0.QUf0wEoCOeO0MpKlnfYfSdN-Roo1pHB43vcvUzMES6k' 

export const supabase = createClient(supabaseUrl, supabaseKey)