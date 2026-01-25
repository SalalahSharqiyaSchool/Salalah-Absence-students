import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
    const octokit = new Octokit({ auth: process.env.GH_TOKEN });
    const [owner, repo] = process.env.GH_REPO.split('/');
    const path = 'data/attendance_history.json'; // اسم ملف السجل

    try {
        const { data } = await octokit.repos.getContent({ owner, repo, path });
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        const history = JSON.parse(content);
        
        return res.status(200).json(history);

    } catch (error) {
        // إذا لم يوجد سجل سابق، نرجع مصفوفة فارغة
        if (error.status === 404) {
            return res.status(200).json([]);
        }
        return res.status(500).json({ error: "فشل جلب سجل الغياب" });
    }
}
