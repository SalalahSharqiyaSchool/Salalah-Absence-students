import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    // 1. التحقق من مفتاح السر (نفس الذي وضعته في Vercel)
    const clientSecret = req.headers['x-app-secret'];
    if (clientSecret !== process.env.APP_SECRET_KEY) {
        return res.status(401).json({ error: "غير مصرح لك بالوصول" });
    }

    try {
        // 2. تحديد مسار ملف سجل الغياب المخفي
        const filePath = path.join(process.cwd(), 'api', 'data', 'attendance_history.json');
        
        // 3. قراءة البيانات
        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf8');
            const history = JSON.parse(fileData);
            res.status(200).json(history);
        } else {
            // إذا كان الملف غير موجود بعد (أول مرة تشغيل) نرسل مصفوفة فارغة
            res.status(200).json([]);
        }
    } catch (error) {
        console.error("Error reading history:", error);
        res.status(500).json({ error: "فشل في تحميل سجل الغياب" });
    }
}
