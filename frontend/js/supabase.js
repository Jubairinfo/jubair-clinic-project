import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

export const supabase = createClient(
  'https://mohsekmwtvwfbfhcsrdh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaHNla213dHZ3ZmJmaGNzcmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MTM0MzgsImV4cCI6MjA5MzM4OTQzOH0.iAg-Wd9dRcHXkSi4_hLfezrcvhzqyNVw6OIQrU5Vo2I'
);