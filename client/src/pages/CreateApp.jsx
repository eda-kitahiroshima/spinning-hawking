import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API_BASE_URL from '../config';

const CreateApp = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // State for wizard steps
    const [currentStep, setCurrentStep] = useState(1);

    // State for answers
    const [answers, setAnswers] = useState({
        q1_type: '',
        q2_target: '',
        q3_features: '',
        q4_design: ''
    });

    // State for generated code & prompt
    const [generatedCode, setGeneratedCode] = useState('');
    const [copyFeedback, setCopyFeedback] = useState('');
    // Initial prompt for remixing
    const [remixPrompt, setRemixPrompt] = useState('');

    useEffect(() => {
        if (location.state?.initialCode || location.state?.initialPrompt) {
            if (location.state?.hasOwnProperty('initialCode')) {
                setGeneratedCode(location.state.initialCode || '');
            }
            if (location.state?.initialPrompt) {
                setRemixPrompt(location.state.initialPrompt);
            }
            setCurrentStep(6); // Jump to preview step explicitly
        }
    }, [location.state]);
    const [issueDescription, setIssueDescription] = useState('');
    const [fixCopyFeedback, setFixCopyFeedback] = useState('');
    const [logs, setLogs] = useState([]); // Store console logs/errors

    const totalSteps = 4;

    const handleAnswerChange = (key, value) => {
        setAnswers(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const nextStep = () => {
        if (currentStep < totalSteps + 2) { // 4 questions + 1 prompt view + 1 preview
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const generatePrompt = () => {
        return `あなたは世界最高峰のフロントエンドエンジニアです。
以下の要件を満たす、**単一のHTMLファイルで完結して動作する**Webアプリケーションのコードを作成してください。

【アプリの概要】
${answers.q1_type}

【ターゲットユーザー】
${answers.q2_target}

【必須機能】
${answers.q3_features}

【デザインコンセプト】
${answers.q4_design}

【重要な技術制約（厳守してください）】
1. **完全なシングルファイル**: HTML, CSS, JavaScriptをすべて1つの \`index.html\` に含めてください。外部ファイル（.cssや.js）の読み込みは禁止です。
2. **デザイン強化**: 配色やレイアウトには **Tailwind CSS (CDN)** を積極的に使用し、モダンで美しいUIにしてください。
   - 読み込み用タグ: \`<script src="https://cdn.tailwindcss.com"></script>\`
3. **ライブラリの使用**: React, Vue, jQueryなどを使用する場合は、必ず **CDN (unpkg, cdnjsなど)** 経由で読み込んでください。npm install や import は使用できません。
   - 推奨: Reactを使用する場合、Babel (standalone) もCDNで読み込み、\`<script type="text/babel">\` 内に記述してください。
4. **エラーハンドリング**: 実行時エラーが発生した場合に、コンソールだけでなく画面上にも「エラーが発生しました」と表示するなど、ユーザーが気づけるようにしてください。
5. **画像の使用**: 外部画像のリンク切れを防ぐため、可能な限りCSSで描画するか、Placehold.coなどのダミー画像サービス、またはFontAwesomeなどのCDNアイコンを使用してください。
6. **レスポンシブ対応**: PCでもスマホでも崩れないようにCSS Flexbox/Grid、またはTailwindのレスポンシブクラスを活用してください。

【出力形式】
解説やマークダウンのコードブロック記号（\`\`\`html ... \`\`\`）は不要です。
**HTMLコードそのものだけ** を出力してください。`;
    };

    const generateFixPrompt = () => {
        const errorLogs = logs.filter(l => l.type === 'error').map(l => `[Error] ${l.message}`).join('\n');

        return `提供されたコードに不具合があります。修正したコードを出力してください。

【現在のコード】
${generatedCode}

【不具合・修正依頼の内容】
${issueDescription}

${errorLogs ? `【発生しているエラーログ】\n${errorLogs}\n` : ''}

【修正の条件】
1. **完全なシングルファイル**（index.htmlのみ）で出力すること。
2. エラーの原因を特定し、確実に修正すること。
3. **HTMLコードそのものだけ** を出力してください（解説不要）。`;
    };

    const handleCopy = () => {
        const promptText = generatePrompt();
        navigator.clipboard.writeText(promptText);
        setCopyFeedback('コピーしました！');
        setTimeout(() => setCopyFeedback(''), 2000);
        setCurrentStep(6); // Move to final preview step
    };

    const handleCopyFixPrompt = () => {
        const promptText = generateFixPrompt();
        navigator.clipboard.writeText(promptText);
        setFixCopyFeedback('コピー完了！');
        setTimeout(() => setFixCopyFeedback(''), 2000);
    };

    const handleSubmit = async (isUpdate = false) => {
        if (!generatedCode) return;

        const userId = localStorage.getItem('userId');
        if (!userId) {
            alert('アプリを投稿するにはログインが必要です。');
            return;
        }

        // Use answers if available, otherwise fallback to existing metadata
        const existingData = location.state?.existingMetadata || {};

        // Title logic: Q1 answer -> OR Existing Name -> OR Default
        let title = answers.q1_type ? answers.q1_type.split('、')[0].split('。')[0] : (existingData.name || '無題のアプリ');

        // Description logic
        let description = '';
        if (answers.q1_type || answers.q2_target) {
            description = `AI Co-Pilot Studioで作成されたアプリです。\n\n【概要】\n${answers.q1_type}\n\n【ターゲット】\n${answers.q2_target}\n\n【主な機能】\n${answers.q3_features}\n\n【デザイン】\n${answers.q4_design}`;
        } else {
            description = existingData.description || 'AI Co-Pilot Studioで作成されたアプリです。';
        }

        // Tags logic
        let tags = ['AI作成'];
        if (answers.q1_type) {
            tags = [...tags, ...answers.q1_type.split('、')[0].split(' ').slice(0, 2)];
        } else if (existingData.tags) {
            // existingData.tags is likely a string "tag1, tag2" or array? EditApp passed raw string/array? 
            // In EditApp: tags: formData.tags (which is comma-separated string)
            if (typeof existingData.tags === 'string') {
                tags = existingData.tags.split(',').map(t => t.trim());
            }
        }

        const formData = new FormData();
        formData.append('name', title);
        formData.append('description', description);
        formData.append('tags', JSON.stringify(tags));
        formData.append('code', generatedCode);
        formData.append('userId', userId);
        formData.append('downloadUrl', '');

        // If existing screenshot URL is available, pass it if we don't have a new file?
        // Actually, backend generates screenshot from placehold.co by default for new apps.
        // For updates, we usually want to keep existing one unless we take a new one (not implemented here yet).
        // For now, let backend handle it.
        if (isUpdate && existingData.screenshotUrl) {
            formData.append('screenshotUrl', existingData.screenshotUrl);
        }

        try {
            let url = `${API_BASE_URL}/api/apps`;
            let method = 'POST';

            if (isUpdate && location.state?.originAppId) {
                url = `${API_BASE_URL}/api/apps/${location.state.originAppId}`;
                method = 'PUT';
            }

            const response = await fetch(url, {
                method: method,
                body: formData,
            });

            if (response.ok) {
                alert(isUpdate ? 'アプリが更新されました！' : 'アプリが投稿されました！');
                navigate('/');
            } else {
                const errData = await response.json();
                alert(`投稿に失敗しました: ${errData.error}`);
            }
        } catch (err) {
            console.error('Submission error:', err);
            alert('投稿エラー: ' + err.message + '\n(サーバーが起動していない可能性があります)');
        }
    };

    return (
        <div className="container" style={{ padding: '2rem 0', maxWidth: '1000px', margin: '0 auto' }}>
            {/* ... (Header omitted for brevity, logic remains same) ... */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={styles.title}>AI <span className="gradient-text">Co-Pilot</span> Studio</h1>
                <p style={styles.subtitle}>4つの質問に答えるだけで、AIへの完璧な指示書が完成します。</p>
            </div>

            {/* Config Phase (Steps 1-4) */}
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
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

            {/* Step 5: Copy Prompt */}
            {currentStep === 5 && (
                <div style={{ ...styles.card, maxWidth: '800px', margin: '0 auto' }}>
                    <div style={styles.stepIndicator}>FINAL STEP</div>
                    <h2 style={styles.question}>プロンプトが完成しました！</h2>
                    <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                        以下のボタンを押してコピーし、ChatGPTやClaudeに貼り付けてください。
                    </p>

                    <div style={styles.promptPreview}>
                        {generatePrompt()}
                    </div>

                    <div style={styles.navButtons}>
                        <button onClick={prevStep} style={styles.secondaryButton}>戻る</button>
                        <button onClick={handleCopy} style={styles.primaryButton}>
                            {copyFeedback || '📋 プロンプトをコピーして次へ'}
                        </button>
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
