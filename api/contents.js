import { supabase } from '../lib/db.js'

export default async function handler(req, res) {
  
  // === อ่านข้อมูล (GET) ===
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('contents')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  // === เพิ่มข้อมูล (POST) ===
  if (req.method === 'POST') {
    const body = JSON.parse(req.body)
    const { error } = await supabase
      .from('contents')
      .insert([body])
    
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  // === ลบข้อมูล (DELETE) ===
  if (req.method === 'DELETE') {
    const body = JSON.parse(req.body)
    const { error } = await supabase
      .from('contents')
      .delete()
      .eq('id', body.id) // ลบตาม ID
    
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}