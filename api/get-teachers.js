import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
    // 1. قفل الأمان
    const clientSecret = req.headers['x-app-secret'];
    if (!clientSecret || clientSecret !== process.env.APP_SECRET_KEY) {
        return res.status(401).json({ error: "Unauthorized: مفتاح الأمان غير صحيح" });
    }

    const octokit = new Octokit({ auth: process.env.GH_TOKEN });
    const [owner, repo] = process.env.GH_REPO.split('/');
    
    // ⭐ التعديل هنا: يجب أن يتطابق المسار مع مكانه في GitHub
    // بما أنك وضعته في مجلد data، فيجب كتابة المسار هكذا:
    const path = 'api/data/teachers.json'; 

    try {
        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path
        });

        const content = Buffer.from(data.content, 'base64').toString('utf8');
        const teachersData = JSON.parse(content);

        return res.status(200).json(teachersData);

    } catch (error) {
        console.error("GitHub Fetch Error:", error);
        // إرجاع رسالة واضحة في حال لم يجد الملف في المسار المحدد
        if (error.status === 404) {
            return res.status(404).json({ error: "الملف غير موجود في المسار المحدد: " + path });
        }
        return res.status(500).json({ error: "فشل في جلب قائمة المعلمين من الخادم" });
    }
}
