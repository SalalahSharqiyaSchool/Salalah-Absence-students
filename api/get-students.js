import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
    // إعدادات GitHub
    const octokit = new Octokit({ auth: process.env.GH_TOKEN });
    const [owner, repo] = process.env.GH_REPO.split('/');
    const path = 'data/student_fone.json'; // اسم ملف الطلاب في المستودع

    try {
        // جلب محتوى الملف
        const { data } = await octokit.repos.getContent({ owner, repo, path });
        
        // فك التشفير من Base64
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        const students = JSON.parse(content);

        // إرجاع البيانات للصفحة
        return res.status(200).json(students);

    } catch (error) {
        console.error("Error fetching students:", error);
        // في حال كان الملف غير موجود (أول مرة)، نرجع مصفوفة فارغة بدلاً من الخطأ
        if (error.status === 404) {
            return res.status(200).json([]);
        }
        return res.status(500).json({ error: "فشل جلب قائمة الطلاب" });
    }
}
