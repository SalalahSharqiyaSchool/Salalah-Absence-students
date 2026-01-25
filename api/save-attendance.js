import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
    // 1. السماح فقط بطلبات POST لضمان أمن البيانات
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // 2. قفل الأمان: التحقق من "مفتاح السر" المرسل في الـ Headers
    const clientSecret = req.headers['x-app-secret'];
    if (!clientSecret || clientSecret !== process.env.APP_SECRET_KEY) {
        return res.status(401).json({ error: "Unauthorized: Invalid Security Key" });
    }

    // 3. إعدادات GitHub من متغيرات البيئة في Vercel
    const octokit = new Octokit({ auth: process.env.GH_TOKEN });
    const [owner, repo] = process.env.GH_REPO.split('/');
    const path = 'api/data/attendance_history.json';

    try {
        let currentContent = [];
        let sha = null;

        // 4. جلب المحتوى الحالي للملف و الـ SHA (ضروري للتحديث في GitHub)
        try {
            const { data } = await octokit.repos.getContent({ owner, repo, path });
            sha = data.sha;
            // فك تشفير محتوى الملف من Base64 إلى JSON
            currentContent = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
        } catch (e) {
            // إذا لم يكن الملف موجوداً، سنبدأ بمصفوفة فارغة
            console.log("File not found, starting a new history record.");
        }

        // 5. منطق التحديث الذكي
        let updatedContent;

        if (req.body.isFullUpdate === true) {
            // حالة الحذف أو التعديل الكلي (يتطلب صلاحية إدارية غالباً)
            // نتحقق أن البيانات المرسلة هي مصفوفة فعلاً
            updatedContent = Array.isArray(req.body.data) ? req.body.data : [];
        } else {
            // حالة رصد غياب يومي (إضافة للسجل الحالي)
            const newEntries = Array.isArray(req.body) ? req.body : [];
            // دمج السجل القديم مع المدخلات الجديدة
            updatedContent = [...currentContent, ...newEntries];
        }

        // 6. رفع البيانات الجديدة إلى GitHub بعد تحويلها لـ Base64
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: req.body.isFullUpdate ? '🔄 تطهير/تعديل كلي لسجل الغياب' : '📝 رصد غياب يومي جديد',
            content: Buffer.from(JSON.stringify(updatedContent, null, 2)).toString('base64'),
            sha: sha // إرسال الـ SHA القديم لتأكيد التحديث
        });

        // 7. رد النجاح
        return res.status(200).json({ 
            success: true, 
            message: "تم تحديث سجل الغياب بنجاح في المستودع المؤمن" 
        });

    } catch (error) {
        console.error("Critical API Error:", error);
        return res.status(500).json({ 
            error: "حدث خطأ أثناء الاتصال بخادم التخزين",
            details: error.message 
        });
    }
}
