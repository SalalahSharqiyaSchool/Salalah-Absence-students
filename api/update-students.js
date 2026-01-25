import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
    // 1. قصر الدالة على POST فقط
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    // 2. التحقق الصارم من مفتاح السر
    const clientSecret = req.headers['x-app-secret'];
    if (!clientSecret || clientSecret !== process.env.APP_SECRET_KEY) {
        return res.status(401).json({ error: "غير مصرح لك بالوصول لهذا المورد" });
    }

    // 3. التحقق من أن البيانات المرسلة مصفوفة (Array) وليست فارغة
    if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "تنسيق البيانات غير صحيح" });
    }

    const octokit = new Octokit({ auth: process.env.GH_TOKEN });
    const [owner, repo] = process.env.GH_REPO.split('/');
    const path = 'api/data/student_fone.json';

    try {
        // 4. جلب الـ SHA الحالي (ضروري جداً لـ GitHub لتجنب تعارض البيانات)
        let sha;
        try {
            const { data } = await octokit.repos.getContent({ owner, repo, path });
            sha = data.sha;
        } catch (e) {
            console.log("File not found, creating a new one.");
        }

        // 5. التحديث الفعلي للملف
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: '📝 تحديث بيانات الطلاب - نظام الأستاذ فيصل الآمن',
            // تحويل البيانات لنص JSON جميل ومن ثم لـ Base64
            content: Buffer.from(JSON.stringify(req.body, null, 2)).toString('base64'),
            sha: sha
        });

        return res.status(200).json({ success: true, message: "تم تحديث البيانات بنجاح" });

    } catch (error) {
        console.error("Update Error:", error.message);
        return res.status(500).json({ error: "فشل في تحديث الملف على GitHub" });
    }
}
