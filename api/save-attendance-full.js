import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
    // 1. السماح فقط بطلبات POST
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    // 2. قفل الأمان: التحقق من مفتاح السر المرسل في الـ Headers
    const clientSecret = req.headers['x-app-secret'];
    if (!clientSecret || clientSecret !== process.env.APP_SECRET_KEY) {
        return res.status(401).json({ error: "Unauthorized: مفتاح الأمان غير صحيح" });
    }

    // 3. التحقق من أن البيانات المرسلة هي مصفوفة (Array)
    if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "Invalid Data: يجب إرسال مصفوفة كاملة" });
    }

    const octokit = new Octokit({ auth: process.env.GH_TOKEN });
    const [owner, repo] = process.env.GH_REPO.split('/');
    const path = 'api/data/attendance_history.json';

    try {
        // 4. جلب الـ SHA للملف الحالي (ضروري جداً لعمل Overwrite)
        let sha = null;
        try {
            const { data } = await octokit.repos.getContent({ owner, repo, path });
            sha = data.sha;
        } catch (e) {
            console.log("File not found, creating new one.");
        }

        // 5. تحديث الملف في GitHub بالكامل (الاستبدال بمحتوى المصفوفة الجديدة)
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: '🚨 تحديث شامل للسجل (حذف/تعديل إداري) - نظام الأستاذ فيصل',
            content: Buffer.from(JSON.stringify(req.body, null, 2)).toString('base64'),
            sha: sha
        });

        return res.status(200).json({ 
            success: true, 
            message: 'تم تحديث السجل الشامل بنجاح' 
        });

    } catch (error) {
        console.error("Full Update Error:", error);
        return res.status(500).json({ error: "فشل في تحديث السجل الكامل على GitHub" });
    }
}
