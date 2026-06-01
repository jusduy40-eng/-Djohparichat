import { createClient } from '@supabase/supabase-js'

// เชื่อมต่อ Supabase
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ใช้ Key นี้เพื่อมีสิทธิ์เขียน/ลบข้อมูลได้หมด
)