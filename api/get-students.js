import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    // 1. تحديد مسار الملف في السيرفر
    const filePath = path.join(process.cwd(), 'api', 'data', 'student_fone.json');
    
    try {
        const fileData = fs.readFileSync(filePath, 'utf8');
        let students = JSON.parse(fileData);

        // 2. جلب المعلومات المرسلة من المتصفح (المعلم)
        const { grade, section, role } = req.query;

        // 3. منطق الحماية: الفلترة في السيرفر
        // إذا لم يكن مديراً، نرسل له فقط طلاب فصله
        if (role !== 'admin' && grade && section) {
            students = students.filter(s => 
                String(s.grade) === grade && String(s.section) === section
            );
        }

        // 4. إرسال البيانات المفلترة فقط للمتصفح
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ error: "فشل في قراءة البيانات" });
    }
}
