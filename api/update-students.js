import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    const octokit = new Octokit({ auth: process.env.GH_TOKEN });
    const [owner, repo] = process.env.GH_REPO.split('/');
    const path = 'student_fone.json';

    try {
        // 1. جلب الـ SHA الخاص بالملف الحالي ليتمكن من التعديل عليه
        const { data } = await octokit.repos.getContent({ owner, repo, path });
        
        // 2. تحديث المحتوى بالبيانات الجديدة (الطلاب)
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: 'تحديث قائمة الطلاب - نظام الأستاذ فيصل',
            content: Buffer.from(JSON.stringify(req.body, null, 2)).toString('base64'),
            sha: data.sha
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
