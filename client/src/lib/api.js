import { apiUrl } from '../config';

/**
 * 共通APIフェッチ関数
 * @param {string} path - APIのエンドポイント (例: '/api/auth/login')
 * @param {object} options - fetchのオプション (method, bodyなど)
 */
export async function apiFetch(path, { method = 'GET', body, headers, ...opts } = {}) {
    const isForm = body instanceof FormData;

    // headersの準備: FormDataの場合はContent-Typeを自動設定させるため空にする
    const reqHeaders = {
        ...(isForm ? {} : { 'Content-Type': 'application/json' }),
        ...(headers || {}),
    };

    // bodyの準備: FormDataならそのまま、オブジェクトならJSON文字列化
    const reqBody = body == null ? undefined : (isForm ? body : JSON.stringify(body));

    try {
        const res = await fetch(apiUrl(path), {
            method,
            headers: reqHeaders,
            body: reqBody,
            ...opts,
        });

        // レスポンスがJSONかどうか判定
        const ct = res.headers.get('content-type') || '';
        const data = ct.includes('application/json')
            ? await res.json().catch(() => null)
            : await res.text().catch(() => '');

        if (!res.ok) {
            // エラーメッセージの優先順位: サーバーからのerrorプロパティ > messageプロパティ > 生データ > ステータスコード
            const errorMessage = data?.error || data?.message || (typeof data === 'string' ? data : `HTTP ${res.status}`);
            throw new Error(errorMessage);
        }

        return data;
    } catch (err) {
        throw err; // 呼び出し元でキャッチさせる
    }
}
