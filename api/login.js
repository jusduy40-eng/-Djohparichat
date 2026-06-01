import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = JSON.parse(req.body)
  const password = body.password

  // ตรวจสอบรหัสผ่าน (ตรงกับใน .env.local)
  if (password === process.env.ADMIN_PASSWORD) {
    // สร้าง Token (เหมือน Session แต่เป็น JSON)
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' })
    
    // ส่ง Token กลับไปเก็บใน Cookie หรือ LocalStorage
    return res.status(200).json({ 
      success: true, 
      token: token 
    })
  }

  return res.status(401).json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง' })
}