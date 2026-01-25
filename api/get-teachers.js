import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
    // 1. قفل الأمان: التحقق من "مفتاح السر" المرسل من صفحة تسجيل الدخول
    const clientSecret = req.headers['x-app-secret'];
    if (!clientSecret || clientSecret !== process.env.APP_SECRET_KEY) {
        return res.status(401).json({ error: "Unauthorized: مفتاح الأمان غير صحيح" });
    }

    // 2. إعدادات GitHub من متغيرات البيئة في Vercel
    const octokit = new Octokit({ auth: process.env.GH_TOKEN });
    const [owner, repo] = process.env.GH_REPO.split('/');
    const path = 'teachers.json'; // تأكد أن هذا هو اسم ملف المعلمين في مستودعك

    try {
        // 3. جلب محتوى الملف من GitHub
        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path
        });

        // 4. فك تشفير البيانات من Base64
        const content = Buffer.from(data.content, 'base64').toString('utf8');
        const teachersData = JSON.parse(content);

        // 5. إرسال البيانات للمتصفح
        return res.status(200).json(teachersData);

    } catch (error) {
        console.error("GitHub Fetch Error:", error);
        return res.status(500).json({ error: "فشل في جلب قائمة المعلمين من الخادم" });
    }
}
