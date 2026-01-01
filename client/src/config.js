// In production (when built), use relative paths. In development, use localhost.
const RAW = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

// 末尾の / を消して統一。API_BASE_URL は他で単純な文字列として使いたい場合に備えて export
export const API_BASE_URL = RAW.replace(/\/+$/, '');

/**
 * パスを受け取り、安全なフルURLを返します。
 * pathが / で始まっていてもいなくても正しく結合します。
 */
export const apiUrl = (path) =>
    `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

export default API_BASE_URL;
