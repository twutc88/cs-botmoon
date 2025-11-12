# CS Customer Report Dashboard

Dashboard สำหรับทีม CS ของ botmoon.com เพื่อใช้โทรหาลูกค้า

## Features

- 🔐 Login ด้วยรหัสผ่าน
- 📊 ตารางแสดงรายชื่อลูกค้า
- 🔍 ค้นหาลูกค้า
- 📄 Pagination
- 📝 บันทึก Action และ Note สำหรับแต่ละลูกค้า
- 📈 คำนวณ Lead Stage อัตโนมัติ
- 💾 เก็บข้อมูล Action ใน Supabase

## Setup

1. ติดตั้ง dependencies:
```bash
npm install
```

2. สร้างไฟล์ `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. รัน development server:
```bash
npm run dev
```

4. เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

## Login

รหัสผ่าน: `Tothemoon88#`

## Deploy on Vercel

1. Push code ไปยัง GitHub
2. Connect project ใน Vercel
3. เพิ่ม Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- shadcn-ui
- Supabase
- date-fns
