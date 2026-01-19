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

        // 2. إضافة السجلات الجديدة (المصفوفة المرسلة من التطبيق)
        const updatedContent = [...currentContent, ...req.body];

        // 3. تحديث الملف على GitHub
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: 'تحديث سجل الغياب اليومي - نظام الأستاذ فيصل',
            content: Buffer.from(JSON.stringify(updatedContent, null, 2)).toString('base64'),
            sha: sha // ضروري جداً للتحديث
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
