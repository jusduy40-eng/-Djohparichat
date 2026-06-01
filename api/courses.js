import { supabase } from '../lib/db.js'

export default async function handler(req, res) {
  
  // อ่านข้อมูลคอร์สทั้งหมด (GET)
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
    
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  // เพิ่มคอร์สใหม่ (POST) - สำหรับ Admin
  if (req.method === 'POST') {
    const body = JSON.parse(req.body)
    const { error } = await supabase
      .from('courses')
      .insert([body])
    
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  // อัปเดตคอร์ส (PUT)
  if (req.method === 'PUT') {
    const body = JSON.parse(req.body)
    const { error } = await supabase
      .from('courses')
      .update(body)
      .eq('id', body.id)
    
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  // ลบคอร์ส (DELETE)
  if (req.method === 'DELETE') {
    const body = JSON.parse(req.body)
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', body.id)
    
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}