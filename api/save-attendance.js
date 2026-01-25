import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    // --- إضافة قفل الأمان ---
    const clientSecret = req.headers['x-app-secret'];
    if (clientSecret !== process.env.APP_SECRET_KEY) {
        return res.status(401).json({ error: "غير مصرح لك بالوصول" });
    }
    // ----------------------

    const octokit = new Octokit({ auth: process.env.GH_TOKEN });
    const [owner, repo] = process.env.GH_REPO.split('/');
    const path = 'attendance_history.json';

    try {
        let currentContent = [];
        let sha = null;

        try {
            const { data } = await octokit.repos.getContent({ owner, repo, path });
            sha = data.sha;
            currentContent = JSON.parse(Buffer.from(data.content, 'base64').toString());
        } catch (e) {
            console.log("File not found, creating new one.");
        }

        let updatedContent;
        if (req.body.isFullUpdate === true) {
            // التحقق من أن البيانات المرسلة للتحديث الكلي ليست فارغة بالخطأ
            updatedContent = req.body.data || [];
        } else {
            const newEntries = Array.isArray(req.body) ? req.body : [];
            updatedContent = [...currentContent, ...newEntries];
        }

        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: req.body.isFullUpdate ? 'تطهير سجل الغياب (حذف طالب)' : 'تحديث سجل الغياب اليومي',
            content: Buffer.from(JSON.stringify(updatedContent, null, 2)).toString('base64'),
            sha: sha
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "فشل في حفظ سجل الغياب" });
    }
}
