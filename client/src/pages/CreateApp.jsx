import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API_BASE_URL from '../config';
import { apiFetch } from '../lib/api';

const CreateApp = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // State for wizard steps
    const [currentStep, setCurrentStep] = useState(0); // Start at 0 for mode selection
    const totalSteps = 4; // Total questions in wizard

    // Additional State needed for logic
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [logs, setLogs] = useState([]);
    const [issueDescription, setIssueDescription] = useState('');
    const [copyFeedback, setCopyFeedback] = useState('');
    const [fixCopyFeedback, setFixCopyFeedback] = useState('');

    // State for templates
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    useEffect(() => {
        // Fetch templates on mount
        const fetchTemplates = async () => {
            setLoadingTemplates(true);
            try {
                const data = await apiFetch('/api/templates');
                setTemplates(data);
            } catch (err) {
                console.error("Failed to fetch templates", err);
            } finally {
                setLoadingTemplates(false);
            }
        };
        fetchTemplates();
    }, []);

    const handleTemplateSelect = async (templateId) => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            alert('テンプレートを使用するにはログインが必要です。');
            navigate('/login');
            return;
        }

        try {
            const response = await apiFetch('/api/apps/fork', {
                method: 'POST',
                body: { templateId, userId }
            });
            // Redirect to EditApp (Studio) for the new app
            navigate(`/edit/${response.id}`);
        } catch (err) {
            alert(`作成に失敗しました: ${err.message}`);
        }
    };

    // State for answers
    const [answers, setAnswers] = useState({
        q1_type: '',
        q2_target: '',
        q3_features: '',
        q4_design: ''
    });

    // ... (rest of state)

    // ... (rest of handlers)

    const nextStep = () => {
        if (currentStep < totalSteps + 2) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleAnswerChange = (key, value) => {
        setAnswers(prev => ({ ...prev, [key]: value }));
    };

    const generatePrompt = () => {
        return `
以下のようなWebアプリを作成してください：
- 種類: ${answers.q1_type}
- ターゲット/利用シーン: ${answers.q2_target}
- 必須機能: ${answers.q3_features}
- デザイン: ${answers.q4_design}

要件:
- 単一のHTMLファイルで完結すること (HTML, CSS, JS込み)
- TailwindCSSを使用すること
- 日本語対応
- レスポンシブデザイン
        `.trim();
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        const prompt = generatePrompt();
        try {
            // Check if we are editing an existing app (studio mode) or creating new?
            // This is CreateApp, so we are creating new.
            const response = await apiFetch('/api/ai/generate', {
                method: 'POST',
                body: { prompt }
            });
            setGeneratedCode(response.code);
            setCurrentStep(6); // Go to preview
            setLogs([{ type: 'info', message: 'Generated code received.' }]);
        } catch (error) {
            console.error(error);
            alert('生成に失敗しました: ' + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatePrompt());
        setCopyFeedback('✅ コピー完了！');
        setTimeout(() => setCopyFeedback(''), 2000);
    };

    const handleCopyFixPrompt = () => {
        const fixPrompt = `
現在のコードで以下の不具合があります。修正してください。
状況: ${issueDescription}
        `.trim();
        navigator.clipboard.writeText(fixPrompt);
        setFixCopyFeedback('✅ コピー完了！');
        setTimeout(() => setFixCopyFeedback(''), 2000);
    };

    const handleSubmit = async (overwrite = false) => {
        // Logic to save the app
        const method = 'POST';
        const url = location.state?.originAppId && overwrite
            ? `/api/apps/${location.state.originAppId}` // Update exist
            : '/api/apps'; // Create new

        // If overwrite is false but originAppId exists, it's a fork, handled as create new but maybe linked?
        // For simplicity here, just create new.

        try {
            // Requires name etc, but we only have code. 
            // Ideally we should ask for name. For now auto-name.
            const body = {
                name: `${answers.q1_type} (${new Date().toLocaleTimeString()})`,
                description: `AI generated for ${answers.q2_target}`,
                code: generatedCode,
                userId: parseInt(localStorage.getItem('userId'), 10),
                is_template: false,
                public_status: 'private'
            };

            await apiFetch(url, { method, body });
            alert('アプリを保存しました！');
            navigate('/dashboard');
        } catch (e) {
            alert('保存失敗: ' + e.message);
        }
    };


    // ...

    return (
        <div className="container" style={{ padding: '2rem 0', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={styles.title}>AI <span className="gradient-text">Co-Pilot</span> Studio</h1>
                <p style={styles.subtitle}>4つの質問に答えるだけで、AIへの完璧な指示書が完成します。</p>
            </div>

            {/* Step 0: Mode Selection (Template or Wizard) */}
            {currentStep === 0 && (
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <h2 style={{ ...styles.question, textAlign: 'center' }}>どのようにアプリを作りますか？</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                        {/* Option A: From Scratch */}
                        <div
                            onClick={() => setCurrentStep(1)}
                            style={{
                                ...styles.card,
                                cursor: 'pointer',
                                border: '2px solid transparent',
                                transition: 'all 0.2s',
                                ':hover': { borderColor: 'var(--primary-color)', transform: 'translateY(-5px)' }
                            }}
                            className="mode-card"
                        >
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>ゼロからAIと作る</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>質問に答えて、オリジナルのアプリを生成します。</p>
                        </div>

                        {/* Option B: From Template (NOT IMPLEMENTED YET IN UI fully but logic is here) 
                            Actually let's just show templates below if they exist
                        */}
                        <div
                            style={{
                                ...styles.card,
                                opacity: 0.8
                            }}
                        >
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏗️</div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>テンプレートから始める</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>以下のリストから選んでスタート</p>
                        </div>
                    </div>

                    {/* Template List */}
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>公式テンプレート</h3>
                    {loadingTemplates ? (
                        <p style={{ textAlign: 'center' }}>読み込み中...</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            {templates.map(t => (
                                <div key={t.id} style={{ ...styles.card, padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => handleTemplateSelect(t.id)}>
                                    <div style={{ height: '120px', background: '#333', borderRadius: '8px', marginBottom: '1rem', overflow: 'hidden' }}>
                                        {/* Use prompt text as placeholder image if no screenshot? Database seeding uses placehold.co */}
                                        <img src={t.screenshotUrl} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{t.name}</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Config Phase (Steps 1-4) */}
            <div style={{ maxWidth: '600px', margin: '0 auto', display: currentStep >= 1 && currentStep <= 4 ? 'block' : 'none' }}>
                <QuestionStep
                    step={1}
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    question="Q1. 何を作りたいですか？"
                    placeholder="例：家計簿、ToDoリスト、占いゲーム、ポモドーロタイマー..."
                    value={answers.q1_type}
                    fieldKey="q1_type"
                    handleAnswerChange={handleAnswerChange}
                    onNext={nextStep}
                    onPrev={prevStep}
                    optionsPool={APP_TYPES}
                />
                <QuestionStep
                    step={2}
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    question="Q2. 誰が・どこで使いますか？"
                    placeholder="例：スマホで外で、PCでデスク作業中に、子どもが家のタブレットで..."
                    value={answers.q2_target}
                    fieldKey="q2_target"
                    handleAnswerChange={handleAnswerChange}
                    onNext={nextStep}
                    onPrev={prevStep}
                    optionsPool={TARGETS}
                />
                <QuestionStep
                    step={3}
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    question="Q3. 絶対に外せない機能は何ですか？"
                    placeholder="例：データのローカル保存、グラフ表示、ダークモード切り替え、効果音..."
                    value={answers.q3_features}
                    fieldKey="q3_features"
                    handleAnswerChange={handleAnswerChange}
                    onNext={nextStep}
                    onPrev={prevStep}
                    optionsPool={FEATURES}
                />
                <QuestionStep
                    step={4}
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    question="Q4. デザインのイメージは？"
                    placeholder="例：サイバーパンク風でかっこよく、パステルカラーで可愛く、業務用でシンプルに..."
                    value={answers.q4_design}
                    fieldKey="q4_design"
                    handleAnswerChange={handleAnswerChange}
                    onNext={nextStep}
                    onPrev={prevStep}
                    optionsPool={DESIGNS}
                />
            </div>

            {/* Step 5: AI Generation or Copy Prompt */}
            {currentStep === 5 && (
                <div style={{ ...styles.card, maxWidth: '800px', margin: '0 auto' }}>
                    <div style={styles.stepIndicator}>FINAL STEP</div>
                    <h2 style={styles.question}>プロンプトが完成しました！</h2>
                    <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                        AIで自動生成するか、プロンプトをコピーして手動で貼り付けるか選択してください。
                    </p>

                    <div style={styles.promptPreview}>
                        {generatePrompt()}
                    </div>

                    <div style={styles.navButtons}>
                        <button onClick={prevStep} style={styles.secondaryButton}>戻る</button>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                style={{ ...styles.primaryButton, opacity: isGenerating ? 0.6 : 1 }}
                            >
                                {isGenerating ? '🤖 生成中...' : '✨ AIで自動生成'}
                            </button>
                            <button onClick={handleCopy} style={styles.secondaryButton}>
                                {copyFeedback || '📋 コピー（手動）'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 6: Paste Code & Preview */}
            {currentStep === 6 && (
                <div style={styles.previewSection}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>アプリのプレビュー</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>AIが生成したコードを貼り付けて、動作を確認しましょう。</p>

                        {/* Submit Buttons */}
                        {generatedCode && (
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                {location.state?.originAppId && (
                                    <button
                                        onClick={() => handleSubmit(true)}
                                        style={{
                                            ...styles.submitButton,
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        🔄 アプリを更新する (上書き)
                                    </button>
                                )}
                                <button
                                    onClick={() => handleSubmit(false)}
                                    style={{
                                        ...styles.submitButton,
                                        background: location.state?.originAppId ? 'transparent' : 'var(--primary-gradient)',
                                        border: location.state?.originAppId ? '1px solid var(--primary-color)' : 'none',
                                        color: location.state?.originAppId ? 'var(--primary-color)' : '#fff',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {location.state?.originAppId ? '🆕 別アプリとして保存' : '🚀 このアプリを投稿する'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={styles.previewGrid}>
                        <div style={styles.editorPane}>
                            <h3 style={styles.paneTitle}>
                                コード貼り付け
                                {generatedCode && (
                                    <button
                                        onClick={() => setGeneratedCode('')}
                                        style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        🗑️ クリア
                                    </button>
                                )}
                            </h3>
                            <textarea
                                value={generatedCode}
                                onChange={(e) => setGeneratedCode(e.target.value)}
                                style={{ ...styles.textarea, fontFamily: 'monospace', fontSize: '0.85rem', height: '500px' }}
                                placeholder="<html>...</html>"
                            />
                        </div>
                        <div style={styles.previewPane}>
                            <h3 style={styles.paneTitle}>
                                プレビュー
                                {generatedCode && <span style={styles.activeBadge}>● Running</span>}
                            </h3>
                            <div style={styles.iframeWrapper}>
                                {generatedCode ? (
                                    <PreviewIframe code={generatedCode} onLog={(log) => setLogs(prev => [...prev, log])} />
                                ) : (
                                    <div style={styles.placeholder}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👈</div>
                                        <p>右にコードを貼り付けてください</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Troubleshooting Section */}
                    <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🛠️ うまく動きませんか？
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            不具合の内容を入力して、AIへの修正指示を作成しましょう。
                        </p>

                        <div style={styles.debugConsole}>
                            <div style={styles.debugHeader}>🤖 デバッグコンソール（エラーログ）</div>
                            <div style={styles.logContainer}>
                                {logs.length === 0 ? (
                                    <div style={{ padding: '0.5rem', opacity: 0.5 }}>ログはまだありません</div>
                                ) : (
                                    logs.map((log, i) => (
                                        <div key={i} style={{
                                            padding: '0.25rem 0.5rem',
                                            borderBottom: '1px solid #333',
                                            color: log.type === 'error' ? '#ff6b6b' : log.type === 'warn' ? '#feca57' : '#c8d6e5',
                                            display: 'flex',
                                            gap: '0.5rem',
                                            fontSize: '0.85rem'
                                        }}>
                                            <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', opacity: 0.7 }}>{log.type}</span>
                                            <span>{log.message}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            <textarea
                                style={{ ...styles.textarea, flex: 1, minHeight: '100px', marginBottom: 0, background: '#fff', color: '#000' }}
                                placeholder="不具合の詳細はここに追記できます（例：ボタンを押しても無反応、画面が崩れている...）"
                                value={issueDescription}
                                onChange={(e) => setIssueDescription(e.target.value)}
                            />
                            <button
                                onClick={handleCopyFixPrompt}
                                style={{ ...styles.primaryButton, padding: '1rem 1.5rem', height: 'auto', alignSelf: 'stretch' }}
                                disabled={!generatedCode || !issueDescription.trim()}
                            >
                                {fixCopyFeedback || '🚑 修正指示をコピー'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Iframe that captures console logs
const PreviewIframe = ({ code, onLog }) => {
    const [iframeRef, setIframeRef] = useState(null);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data && event.data.type === 'console') {
                onLog({ type: event.data.level, message: event.data.args.join(' ') });
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onLog]);

    const augmentedCode = `
        <script>
            (function() {
                const send = (level, args) => {
                    try {
                        window.parent.postMessage({
                            type: 'console',
                            level: level,
                            args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a))
                        }, '*');
                    } catch(e) {}
                };
                const originalLog = console.log;
                const originalError = console.error;
                const originalWarn = console.warn;
                
                console.log = (...args) => { originalLog(...args); send('log', args); };
                console.error = (...args) => { originalError(...args); send('error', args); };
                console.warn = (...args) => { originalWarn(...args); send('warn', args); };
                
                window.onerror = (msg, url, line) => {
                    send('error', [\`\${msg} at line \${line}\`]);
                };
            })();
        </script>
        ${code}
    `;

    return (
        <iframe
            title="Preview"
            srcDoc={augmentedCode}
            style={styles.iframe}
            sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
        />
    );
};

// Helper component for questions
const QuestionStep = ({ step, currentStep, totalSteps, question, placeholder, value, fieldKey, handleAnswerChange, onNext, onPrev, optionsPool }) => {
    const isActive = step === currentStep;
    const [suggestions, setSuggestions] = useState([]);

    // Initialize suggestions when step becomes active or pool changes
    useEffect(() => {
        if (isActive && optionsPool) {
            shuffleSuggestions();
        }
    }, [isActive, optionsPool]);

    const shuffleSuggestions = () => {
        if (!optionsPool) return;
        const shuffled = [...optionsPool].sort(() => 0.5 - Math.random());
        setSuggestions(shuffled.slice(0, 6)); // Show 6 random options
    };

    const handleChipClick = (text) => {
        // If empty, just set it. If not empty, append it.
        const newValue = value ? `${value}, ${text}` : text;
        handleAnswerChange(fieldKey, newValue);
    };

    if (!isActive) return null;

    return (
        <div style={styles.card}>
            <div style={styles.stepIndicator}>STEP {step} / {totalSteps}</div>
            <h2 style={styles.question}>{question}</h2>

            {/* Suggestions Area */}
            {optionsPool && (
                <div style={styles.suggestionsArea}>
                    <div style={styles.suggestionsHeader}>
                        <span style={styles.suggestionsLabel}>💡 アイデア（タップで追加）</span>
                        <button onClick={shuffleSuggestions} style={styles.rerollButton} title="入れ替える">
                            🎲 チェンジ
                        </button>
                    </div>
                    <div style={styles.chipsContainer}>
                        {suggestions.map((opt, i) => (
                            <button key={i} onClick={() => handleChipClick(opt)} style={styles.chip}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <textarea
                style={styles.textarea}
                placeholder={placeholder}
                value={value}
                onChange={(e) => handleAnswerChange(fieldKey, e.target.value)}
                rows="4"
                autoFocus
            />
            <div style={styles.navButtons}>
                {step > 1 && (
                    <button onClick={onPrev} style={styles.secondaryButton}>戻る</button>
                )}
                <button
                    onClick={onNext}
                    style={{ ...styles.primaryButton, ...((!value || !value.trim()) ? styles.disabledButton : {}) }}
                    disabled={!value || !value.trim()}
                >
                    {step === totalSteps ? 'プロンプトを作成' : '次へ'}
                </button>
            </div>
        </div>
    );
};

const styles = {
    title: {
        fontSize: '2.5rem',
        marginBottom: '0.5rem',
        fontWeight: '800',
    },
    subtitle: {
        color: 'var(--text-secondary)',
    },
    card: {
        background: 'var(--surface-color)',
        padding: '2.5rem',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        animation: 'fadeIn 0.5s ease',
    },
    stepIndicator: {
        color: 'var(--primary-color)',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        marginBottom: '1rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
    },
    question: {
        fontSize: '1.5rem',
        marginBottom: '1.5rem',
        fontWeight: '700',
    },
    textarea: {
        width: '100%',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-color)',
        color: 'var(--text-primary)',
        fontSize: '1.1rem',
        outline: 'none',
        resize: 'vertical',
        marginBottom: '2rem',
        minHeight: '120px',
    },
    navButtons: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
    },
    primaryButton: {
        padding: '0.8rem 2rem',
        background: 'var(--primary-gradient)',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        fontSize: '1rem',
        transition: 'transform 0.1s',
    },
    secondaryButton: {
        padding: '0.8rem 2rem',
        background: 'transparent',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        fontSize: '1rem',
    },
    promptPreview: {
        background: '#1e1e1e',
        padding: '1.5rem',
        borderRadius: '8px',
        color: '#d4d4d4',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        fontSize: '0.9rem',
        marginBottom: '2rem',
        maxHeight: '300px',
        overflowY: 'auto',
        border: '1px solid #333',
    },
    previewSection: {
        animation: 'fadeIn 0.5s ease',
    },
    previewGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        height: '600px',
    },
    editorPane: {
        display: 'flex',
        flexDirection: 'column',
    },
    previewPane: {
        display: 'flex',
        flexDirection: 'column',
    },
    paneTitle: {
        fontSize: '1rem',
        marginBottom: '0.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    iframeWrapper: {
        flex: 1,
        background: '#fff',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid var(--border-color)',
    },
    iframe: {
        width: '100%',
        height: '100%',
        border: 'none',
    },
    activeBadge: {
        fontSize: '0.7rem',
        color: '#00b894',
        background: 'rgba(0, 184, 148, 0.1)',
        padding: '0.2rem 0.5rem',
        borderRadius: '10px',
    },
    placeholder: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: '#b2bec3',
    },
    suggestionsArea: {
        marginBottom: '1.5rem',
    },
    suggestionsHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.8rem',
    },
    suggestionsLabel: {
        fontSize: '0.9rem',
        color: 'var(--text-secondary)',
        fontWeight: 'bold',
    },
    rerollButton: {
        background: 'none',
        border: 'none',
        color: 'var(--primary-color)',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: 'bold',
    },
    chipsContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.6rem',
    },
    chip: {
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        padding: '0.5rem 1rem',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        fontSize: '0.9rem',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
    },
    debugConsole: {
        background: '#2d3436',
        borderRadius: '8px',
        marginBottom: '1rem',
        overflow: 'hidden',
        border: '1px solid #444',
    },
    debugHeader: {
        background: '#000',
        padding: '0.5rem 1rem',
        fontSize: '0.8rem',
        color: '#b2bec3',
        fontWeight: 'bold',
        borderBottom: '1px solid #444',
    },
    logContainer: {
        maxHeight: '150px',
        overflowY: 'auto',
        fontFamily: 'monospace',
    },
    disabledButton: {
        opacity: 0.5,
        cursor: 'not-allowed',
        background: '#555', // Override gradient
    }
};

// Data Pools
const APP_TYPES = [
    'Todoリスト', '日記アプリ', 'クイズゲーム', 'ポモドーロタイマー', '家計簿',
    '瞑想ガイド', '習慣トラッカー', '電卓', 'おみくじ', 'ストップウォッチ',
    '単語帳', 'リズムゲーム', 'お絵かき帳', 'Markdownエディタ', '体重管理',
    '名言集', 'モックアップ天気予報', 'オセロ', 'マインスイーパー', 'テトリス風ゲーム',
    'ピアノ鍵盤', 'ドラムパッド', '視力検査', '色見本帳', '乱数生成器',
    'QRコード作成', '単位変換', '年齢計算', '割り勘電卓', 'ヨガタイマー'
];

const TARGETS = [
    '通勤中の会社員', 'テスト勉強中の学生', '料理中の主婦', 'ジムで筋トレ中の人',
    '散歩中のお年寄り', '寝る前の子供', 'カフェで作業するフリーランス', '会議中のビジネスマン',
    'キャンプ中の家族', 'ライブ会場のファン', 'ダイエット中の人', '禁煙中の人',
    'プログラマー', 'デザイナー', '作家', '猫好きの人', '犬の飼い主',
    '旅行者', '日本語学習者', 'ゲーマー', 'YouTuber', 'ミニマリスト',
    '断捨離中', '婚活中', '就活生', '新入社員', '受験生', '入院中の人',
    '暇つぶししたい人', '集中したい人'
];

const FEATURES = [
    'データのローカル保存', 'ダークモード切替', '効果音(SE)', 'BGM機能', 'シェア機能',
    '画像として保存', 'グラフ表示', 'ドラッグ&ドロップ', '音声入力', '音声読み上げ',
    'バイブレーション', 'プッシュ通知風演出', 'オフライン動作', 'PWA対応', 'ショートカットキー',
    '検索機能', 'タグ付け分類', '並び替え(ソート)', 'フィルタリング', 'モーダルウィンドウ',
    'チュートリアル表示', 'やり直し(Undo)機能', 'テーマカラー変更', '文字サイズ変更',
    'レスポンシブ対応', 'アニメーション演出', 'ランキング機能', 'いいね機能'
];

const DESIGNS = [
    'サイバーパンク風', 'ニューモーフィズム', 'グラスモーフィズム', 'フラットデザイン',
    'マテリアルデザイン', 'レトロゲーム(8bit)風', '手書き風', '水彩画風', '黒板チョーク風',
    'ネオンサイン風', '和風(縦書き)', '北欧スタイル', 'パステルカラーで可愛く',
    'ビビッドカラーで元気に', 'モノクロ・ミニマル', 'ダークモード主体', '高級感のあるゴールド',
    'ポップでアメコミ風', '業務用管理画面風', '宇宙・SF風', '自然・ボタニカル',
    '海・サーフスタイル', 'ゴシック・ホラー', 'ファンタジーRPG風', '子供向け・知育風',
    '新聞・雑誌エディトリアル風', 'ターミナル(コンソール)風', 'SNS風タイムライン', 'Apple製品風'
];

export default CreateApp;
