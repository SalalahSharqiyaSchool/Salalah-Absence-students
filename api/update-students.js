import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    // التحقق من كلمة السر المرسلة من المتصفح
    const clientSecret = req.headers['x-app-secret'];
    if (clientSecret !== process.env.APP_SECRET_KEY) {
        return res.status(401).json({ error: "غير مصرح لك بالوصول" });
    }

    const octokit = new Octokit({ auth: process.env.GH_TOKEN });
    const [owner, repo] = process.env.GH_REPO.split('/');
    const path = 'student_fone.json';

    try {
        const { data } = await octokit.repos.getContent({ owner, repo, path });
        
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: 'تحديث آمن - نظام الأستاذ فيصل',
            content: Buffer.from(JSON.stringify(req.body, null, 2)).toString('base64'),
            sha: data.sha
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: "خطأ في السيرفر" });
    }
}
