import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    const octokit = new Octokit({ auth: process.env.GH_TOKEN });
    const [owner, repo] = process.env.GH_REPO.split('/');
    const path = 'attendance_history.json';

    try {
        // 1. جلب الـ SHA للملف الحالي ليتمكن من استبداله
        let sha = null;
        try {
            const { data } = await octokit.repos.getContent({ owner, repo, path });
            sha = data.sha;
        } catch (e) {
            console.log("File not found, creating new one.");
        }

        // 2. استقبال المصفوفة الجديدة بالكامل (history المفلترة)
        const updatedHistory = req.body;

        // 3. تحديث الملف في GitHub بالكامل (Overwrite)
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: 'تحديث شامل للسجل (تطهير بيانات طالب محذوف) - نظام الأستاذ فيصل',
            content: Buffer.from(JSON.stringify(updatedHistory, null, 2)).toString('base64'),
            sha: sha
        });

        return res.status(200).json({ success: true, message: 'تم تحديث السجل في GitHub بنجاح' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
