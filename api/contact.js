import { supabase } from '../lib/db.js'

export default async function handler(req, res) {
  // อนุญาตแค่ POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // อ่านข้อมูลจาก Body
    const body = JSON.parse(req.body)

    // บันทึกลงตาราง 'contact_messages' ใน Supabase
    const { error } = await supabase
      .from('contact_messages')
      .insert([
        {
          name: body.name,
          email: body.email,
          phone: body.phone,
          subject: body.subject,
          message: body.message,
          created_at: new Date().toISOString()
        }
      ])

    if (error) throw error

    return res.status(200).json({ success: true, message: 'ส่งข้อความสำเร็จครับ' })

  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' })
  }
}