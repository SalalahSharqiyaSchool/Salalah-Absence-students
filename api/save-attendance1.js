import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    const octokit = new Octokit({ auth: process.env.GH_TOKEN });
    const [owner, repo] = process.env.GH_REPO.split('/');
    const path = 'attendance_history.json';

    try {
        // 1. جلب بيانات الملف الحالي من GitHub
        let currentContent = [];
        let sha = null;

        try {
            const { data } = await octokit.repos.getContent({ owner, repo, path });
            sha = data.sha;
            currentContent = JSON.parse(Buffer.from(data.content, 'base64').toString());
        } catch (e) {
            console.log("File not found, creating new one.");
        }

        // 2. منطق التحديث الذكي
        let updatedContent;

        // إذا أرسلنا كائن يحتوي على isFullUpdate، نقوم باستبدال الملف بالكامل
        if (req.body.isFullUpdate === true) {
            updatedContent = req.body.data; 
        } else {
            // إذا كان طلباً عادياً (رصد غياب يومي)، نقوم بالإضافة على الموجود كما كان سابقاً
            const newEntries = Array.isArray(req.body) ? req.body : [];
            updatedContent = [...currentContent, ...newEntries];
        }

        // 3. تحديث الملف على GitHub
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
        return res.status(500).json({ error: error.message });
    }
}
