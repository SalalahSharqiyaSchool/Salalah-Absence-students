const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
    if (req.method === 'POST') {
        // مسار ملف سجل الغياب
        const filePath = path.join(process.cwd(), 'attendance_history.json');
        
        try {
            // استقبال المصفوفة الجديدة بالكامل (بعد حذف السجل)
            const updatedHistory = req.body;

            // كتابة المصفوفة الجديدة في الملف ومسح القديمة
            fs.writeFileSync(filePath, JSON.stringify(updatedHistory, null, 2));

            res.status(200).json({ message: 'تم تحديث السجل بنجاح' });
        } catch (error) {
            res.status(500).json({ error: 'فشل في تحديث الملف' });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}
