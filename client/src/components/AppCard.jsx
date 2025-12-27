import React from 'react';
import API_BASE_URL from '../config';

const AppCard = ({ app, onDelete, showControls, onEdit }) => {
    const [likeCount, setLikeCount] = React.useState(app.likeCount || 0);
    const [commentCount, setCommentCount] = React.useState(app.commentCount || 0);
    const [showComments, setShowComments] = React.useState(false);
    const [comments, setComments] = React.useState([]);
    const [commentText, setCommentText] = React.useState("");
    const [commentsLoading, setCommentsLoading] = React.useState(false);

    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    const handleDelete = async () => {
        if (!window.confirm('本当にこのアプリケーションを削除しますか？')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/apps/${app.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                onDelete(app.id);
            } else {
                const data = await response.json();
                alert(`削除に失敗しました: ${data.error || '不明なエラー'}`);
            }
        } catch (error) {
            console.error('Error deleting app:', error);
            alert('削除中にエラーが発生しました。');
        }
    };

    const handleLike = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/apps/${app.id}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            if (response.ok) {
                const data = await response.json();
                setLikeCount(data.likeCount);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleComments = async () => {
        if (!showComments && comments.length === 0) {
            setCommentsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/apps/${app.id}/comments`);
                if (response.ok) {
                    const data = await response.json();
                    setComments(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setCommentsLoading(false);
            }
        }
        setShowComments(!showComments);
    };

    const submitComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/apps/${app.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, text: commentText })
            });

            if (response.ok) {
                const newComment = await response.json();
                setComments([newComment, ...comments]);
                setCommentCount(prev => prev + 1);
                setCommentText("");
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Helper to resolve image URL
    const getImageUrl = (url) => {
        if (!url) return "https://placehold.co/600x400/000000/FFF?text=No+Image";
        // If it starts with http, it's an external URL
        if (url.startsWith('http') || url.startsWith('//')) return url;
        // Otherwise, it's a relative path on our server
        return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    return (
        <div style={styles.card} className="app-card">
            <div style={styles.imageContainer}>
                <img src={getImageUrl(app.screenshotUrl)} alt={app.name} style={styles.image} />
                <div style={styles.overlay} className="overlay">
                    <a href={app.downloadUrl} style={styles.button}>Download</a>
                </div>
            </div>
            <div style={styles.content}>
                <div style={styles.headerRow}>
                    <div style={styles.tags}>
                        {Array.isArray(app.tags) && app.tags.map(tag => (
                            <span key={tag} style={styles.tag}>{tag}</span>
                        ))}
                    </div>
                    {showControls && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => onEdit && onEdit(app.id)}
                                style={styles.editButton}
                                className="edit-button"
                                title="編集"
                            >
                                ✏️
                            </button>
                            <button onClick={handleDelete} style={styles.deleteButton} className="delete-button" title="削除">
                                &times;
                            </button>
                        </div>
                    )}
                </div>
                <h3 style={styles.title}>{app.name}</h3>
                <p style={styles.description}>{app.description}</p>

                <div style={styles.actions}>
                    <button onClick={handleLike} style={styles.actionButton}>
                        ❤️ {likeCount}
                    </button>
                    <button onClick={toggleComments} style={styles.actionButton}>
                        💬 {commentCount}
                    </button>
                </div>

                {showComments && (
                    <div style={styles.commentSection}>
                        <form onSubmit={submitComment} style={styles.commentForm}>
                            <input
                                type="text"
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                placeholder="コメントを入力..."
                                style={styles.commentInput}
                            />
                            <button type="submit" style={styles.commentSubmit}>送信</button>
                        </form>
                        {commentsLoading ? (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Loading...</div>
                        ) : (
                            <div style={styles.commentsList}>
                                {comments.map(c => (
                                    <div key={c.id} style={styles.commentItem}>
                                        <div style={styles.commentText}>{c.text}</div>
                                        <div style={styles.commentDate}>{new Date(c.created_at).toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    card: {
        backgroundColor: 'var(--surface-color)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
    },
    imageContainer: {
        position: 'relative',
        paddingTop: '66%', // 3:2 Aspect Ratio
        overflow: 'hidden',
    },
    image: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transition: 'transform 0.5s ease',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: undefined, // Moved to CSS
        transition: undefined, // Moved to CSS
    },
    button: {
        padding: '0.75rem 1.5rem',
        background: 'var(--text-primary)',
        color: 'var(--bg-color)',
        borderRadius: '2rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        fontSize: '0.8rem',
        letterSpacing: '0.05em',
    },
    content: {
        padding: '1.5rem',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    tags: {
        display: 'flex',
        gap: '0.5rem',
    },
    tag: {
        fontSize: '0.75rem',
        color: '#a29bfe', // keeping it tailored
        background: 'rgba(108, 92, 231, 0.1)',
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
    },
    title: {
        fontSize: '1.25rem',
        marginBottom: '0.5rem',
        fontWeight: '600',
    },
    description: {
        color: 'var(--text-secondary)',
        fontSize: '0.925rem',
        lineHeight: '1.5',
    },
    headerRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '0.75rem',
    },
    deleteButton: {
        background: 'transparent',
        border: 'none',
        color: 'var(--text-secondary)',
        fontSize: '1.5rem',
        lineHeight: '1',
        cursor: 'pointer',
        padding: '0 0.5rem',
        marginTop: '-0.5rem',
        marginRight: '-0.5rem',
        transition: 'color 0.2s',
    },
    editButton: {
        background: 'transparent',
        border: 'none',
        color: 'var(--text-secondary)',
        fontSize: '1.2rem',
        cursor: 'pointer',
        padding: '0 0.5rem',
        marginTop: '-0.5rem',
        transition: 'color 0.2s',
    },
    actions: {
        display: 'flex',
        gap: '1rem',
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--border-color)',
    },
    actionButton: {
        background: 'transparent',
        border: '1px solid var(--border-color)',
        color: 'var(--text-secondary)',
        padding: '0.4rem 0.8rem',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        transition: 'all 0.2s',
    },
    commentSection: {
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px dashed var(--border-color)',
    },
    commentForm: {
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
    },
    commentInput: {
        flex: 1,
        padding: '0.5rem',
        borderRadius: '4px',
        border: '1px solid var(--border-color)',
        background: 'rgba(0,0,0,0.2)',
        color: 'var(--text-primary)',
        fontSize: '0.9rem',
    },
    commentSubmit: {
        padding: '0.5rem 1rem',
        background: 'var(--surface-hover)',
        color: 'var(--text-primary)',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.8rem',
    },
    commentsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem',
        maxHeight: '200px',
        overflowY: 'auto',
    },
    commentItem: {
        fontSize: '0.9rem',
        padding: '0.5rem',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '4px',
    },
    commentText: {
        color: 'var(--text-primary)',
        marginBottom: '0.2rem',
    },
    commentDate: {
        fontSize: '0.7rem',
        color: 'var(--text-secondary)',
    },
};



export default AppCard;
