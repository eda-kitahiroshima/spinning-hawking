import React from 'react';
import AppGrid from '../components/AppGrid';
import { apiFetch } from '../lib/api';
import { Link } from 'react-router-dom';

const Home = () => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchTerm, setSearchTerm] = React.useState(''); // Actual term used for searching on submit/debounce
    const [tags, setTags] = React.useState([]);
    const [selectedTag, setSelectedTag] = React.useState('');

    React.useEffect(() => {
        // Fetch top tags using apiFetch
        const fetchTags = async () => {
            try {
                const data = await apiFetch('/api/tags/top');
                if (Array.isArray(data)) {
                    setTags(data);
                } else {
                    console.error("Tags data is not an array:", data);
                    setTags([]);
                }
            } catch (err) {
                console.error("Failed to fetch tags:", err);
                setTags([]);
            }
        };

        fetchTags();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchTerm(searchQuery);
        setSelectedTag(''); // Clear tag when searching by text
    };

    const handleTagClick = (tag) => {
        if (selectedTag === tag) {
            setSelectedTag('');
        } else {
            setSelectedTag(tag);
            setSearchQuery(''); // Clear text search when selecting tag
            setSearchTerm('');
        }
    };

    // Construct fetch URL based on filters (path only, not full URL)
    let fetchUrl = `/api/apps`;
    const params = new URLSearchParams();
    if (searchTerm) params.append('q', searchTerm);
    if (selectedTag) params.append('tag', selectedTag);

    if (params.toString()) {
        fetchUrl += `?${params.toString()}`;
    }

    return (
        <div className="container">
            <section style={{ padding: '4rem 0 2rem 0', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800' }}>
                    <span className="gradient-text">APP Studio</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2rem auto', fontSize: '1.1rem' }}>
                    初心者でもアプリケーションを作ってみよう！！
                </p>

                <Link to="/submit" style={styles.button}>
                    新規投稿
                </Link>
                <div style={{ width: '1rem', display: 'inline-block' }}></div>
                <Link to="/create-app" style={styles.aiButton}>
                    ✨ AIでアプリ作成を開始
                </Link>
            </section>

            {/* Search Section */}
            <section style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <form onSubmit={handleSearch} style={{ width: '100%', maxWidth: '500px', display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        placeholder="AIでアプリを探す (キーワードを入力)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={styles.searchInput}
                    />
                    <button type="submit" style={styles.searchButton}>検索</button>
                </form>

                {/* Tag Cloud */}
                <div style={styles.tagCloud}>
                    <p style={{ width: '100%', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        人気のタグ (クリックで検索)
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem' }}>
                        {Array.isArray(tags) && tags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => handleTagClick(tag)}
                                style={{
                                    ...styles.tagChip,
                                    backgroundColor: selectedTag === tag ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                                    color: selectedTag === tag ? '#fff' : 'var(--text-secondary)',
                                }}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <AppGrid fetchUrl={fetchUrl} />
        </div>
    );
};

const styles = {
    button: {
        display: 'inline-block',
        padding: '0.75rem 2rem',
        background: 'var(--primary-gradient)',
        color: '#fff',
        borderRadius: '2rem',
        fontWeight: '600',
        fontSize: '1rem',
        transition: 'transform 0.2s',
        boxShadow: '0 4px 15px rgba(108, 92, 231, 0.4)',
        marginBottom: '2rem',
    },
    aiButton: {
        display: 'inline-block',
        padding: '0.75rem 2rem',
        background: 'linear-gradient(135deg, #00b894 0%, #0984e3 100%)', // Distinct gradient
        color: '#fff',
        borderRadius: '2rem',
        fontWeight: '600',
        fontSize: '1rem',
        transition: 'transform 0.2s',
        boxShadow: '0 4px 15px rgba(0, 184, 148, 0.4)',
        marginBottom: '2rem',
    },
    searchInput: {
        flex: 1,
        padding: '0.8rem 1rem',
        borderRadius: '2rem',
        border: '1px solid var(--border-color)',
        backgroundColor: 'rgba(0,0,0,0.2)',
        color: 'var(--text-primary)',
        fontSize: '1rem',
        outline: 'none',
    },
    searchButton: {
        padding: '0 1.5rem',
        borderRadius: '2rem',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--surface-color)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'background 0.2s',
    },
    tagCloud: {
        marginTop: '1.5rem',
        width: '100%',
        maxWidth: '800px',
    },
    tagChip: {
        border: '1px solid var(--border-color)',
        padding: '0.3rem 0.8rem',
        borderRadius: '20px',
        fontSize: '0.85rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
    }
};

export default Home;
