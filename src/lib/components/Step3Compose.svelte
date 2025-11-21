<script>
    import { appState } from '$lib/stores';
    import { createEventDispatcher, onMount } from 'svelte';
    import { browser } from '$app/environment';
    import jsPDF from 'jspdf';

    const dispatch = createEventDispatcher();

    let letterBodyTextarea;
    let previewContent = { subject: '', body: '' };
    let isGeneratingPDF = false;

    // Add more placeholder options
    const placeholders = [
        { name: 'FirstName', label: '{{FirstName}}' },
        { name: 'LastName', label: '{{LastName}}' },
        { name: 'FullName', label: '{{FullName}}' },
        { name: 'Company', label: '{{Company}}' },
        { name: 'Address', label: '{{Address}}' },
        { name: 'City', label: '{{City}}' },
        { name: 'State', label: '{{State}}' },
        { name: 'Zip', label: '{{Zip}}' }
    ];

    function insertPlaceholder(placeholder) {
        if (!letterBodyTextarea) return;
        
        const start = letterBodyTextarea.selectionStart;
        const end = letterBodyTextarea.selectionEnd;
        const text = $appState.letter.body;

        $appState.letter.body = text.substring(0, start) + placeholder + text.substring(end);
        
        // Need to wait for DOM update to set focus and selection
        setTimeout(() => {
            letterBodyTextarea.focus();
            letterBodyTextarea.selectionStart = letterBodyTextarea.selectionEnd = start + placeholder.length;
        }, 0);
    }

    onMount(() => {
        if (browser && $appState.letter) {
            previewContent = getPreviewContent($appState.letter);
        }
    });

    $: if (browser && $appState.letter) {
        previewContent = getPreviewContent($appState.letter);
    }

    function getPreviewContent(letter) {
        if (!letter) {
            return { subject: '', body: '' };
        }

        const sampleData = {
            '{{FirstName}}': 'John',
            '{{LastName}}': 'Doe',
            '{{FullName}}': 'John Doe',
            '{{Company}}': 'Acme Corp',
            '{{Address}}': '123 Main Street',
            '{{City}}': 'New York',
            '{{State}}': 'NY',
            '{{Zip}}': '10001'
        };

        let previewSubject = letter.subject || '';
        let previewBody = letter.body || '';
        let previewClosing = letter.closing || '';
        let previewSignature = letter.signature || '';

        Object.keys(sampleData).forEach(key => {
            const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g');
            previewSubject = previewSubject.replace(regex, sampleData[key]);
            previewBody = previewBody.replace(regex, sampleData[key]);
        });

        return { 
            subject: previewSubject, 
            body: previewBody,
            closing: previewClosing,
            signature: previewSignature
        };
    }

    function generatePDF() {
        if (!browser) return;
        
        isGeneratingPDF = true;
        
        try {
            const doc = new jsPDF();
            
            // Set up document margins and dimensions
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 25;
            const maxWidth = pageWidth - (margin * 2);
            let yPosition = margin;

            // Add subject/greeting
            if (previewContent.subject) {
                doc.setFontSize(12);
                doc.setFont('times', 'normal');
                const subjectLines = doc.splitTextToSize(previewContent.subject, maxWidth);
                doc.text(subjectLines, margin, yPosition);
                yPosition += subjectLines.length * 7 + 10;
            }

            // Add body
            if (previewContent.body) {
                doc.setFontSize(11);
                doc.setFont('times', 'normal');
                const bodyLines = doc.splitTextToSize(previewContent.body, maxWidth);
                
                // Check if we need to handle page breaks
                for (let i = 0; i < bodyLines.length; i++) {
                    if (yPosition > pageHeight - margin) {
                        doc.addPage();
                        yPosition = margin;
                    }
                    doc.text(bodyLines[i], margin, yPosition);
                    yPosition += 7;
                }
                yPosition += 10;
            }

            // Add closing
            if (previewContent.closing) {
                if (yPosition > pageHeight - margin - 20) {
                    doc.addPage();
                    yPosition = margin;
                }
                doc.setFontSize(11);
                doc.text(previewContent.closing, margin, yPosition);
                yPosition += 10;
            }

            // Add signature
            if (previewContent.signature) {
                if (yPosition > pageHeight - margin - 20) {
                    doc.addPage();
                    yPosition = margin;
                }
                doc.setFontSize(11);
                doc.setFont('times', 'italic');
                doc.text(previewContent.signature, margin, yPosition);
            }

            // Save the PDF
            doc.save('letter-preview.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('There was an error generating the PDF. Please try again.');
        } finally {
            isGeneratingPDF = false;
        }
    }
</script>

<div class="step-container">
    <h2>Step 3: Compose Your Letter</h2>
    <p class="step-description">Write the content that will be printed on each letter. Use placeholders for personalization.</p>

    <div class="letter-composer-wrapper">
        <div class="letter-composer">
            <div class="placeholder-help">
                <strong>Available Placeholders (click to insert):</strong>
                <div class="placeholder-grid">
                    {#each placeholders as placeholder}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <span 
                            class="placeholder-tag" 
                            on:click={() => insertPlaceholder(placeholder.label)}
                            title="Click to insert {placeholder.label}"
                        >
                            {placeholder.label}
                        </span>
                    {/each}
                </div>
            </div>

            <div class="form-group">
                <label for="letterSubject">
                    Subject / Greeting
                    <span class="field-hint">e.g., "Dear &#123;&#123;FirstName&#125;&#125;,"</span>
                </label>
                <input 
                    type="text" 
                    id="letterSubject" 
                    bind:value={$appState.letter.subject} 
                    placeholder="Dear &#123;&#123;FirstName&#125;&#125;,"
                    class="letter-input"
                >
            </div>

            <div class="form-group">
                <label for="letterBody">
                    Letter Body
                    <span class="field-hint">The main content of your letter</span>
                </label>
                <textarea 
                    id="letterBody" 
                    bind:this={letterBodyTextarea}
                    bind:value={$appState.letter.body} 
                    rows="15" 
                    placeholder="Write your letter content here... Use placeholders to personalize each letter."
                    class="letter-textarea"
                ></textarea>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="letterClosing">
                        Closing
                        <span class="field-hint">e.g., "Sincerely," or "Best regards,"</span>
                    </label>
                    <input 
                        type="text" 
                        id="letterClosing" 
                        bind:value={$appState.letter.closing} 
                        placeholder="Sincerely,"
                        class="letter-input"
                    >
                </div>

                <div class="form-group">
                    <label for="letterSignature">
                        Signature Name
                        <span class="field-hint">Your name or company name</span>
                    </label>
                    <input 
                        type="text" 
                        id="letterSignature" 
                        bind:value={$appState.letter.signature} 
                        placeholder="Your Name or Company"
                        class="letter-input"
                    >
                </div>
            </div>
        </div>

        <div class="letter-preview-panel">
            <div class="preview-header">
                <h4>Live Preview</h4>
                <button 
                    class="btn-download-pdf" 
                    on:click={generatePDF}
                    disabled={!$appState.letter.body.trim() || isGeneratingPDF}
                    title="Download PDF preview of your letter"
                >
                    {#if isGeneratingPDF}
                        <span class="spinner">⏳</span> Generating...
                    {:else}
                        📄 Download PDF
                    {/if}
                </button>
            </div>
            <p class="preview-note">This is how your letter will look with sample data:</p>
            <div class="preview-letter">
                <div class="preview-content">
                    {#if previewContent.subject}
                        <p class="preview-greeting">{previewContent.subject}</p>
                    {:else}
                        <p class="preview-placeholder">Add a greeting...</p>
                    {/if}
                    
                    {#if previewContent.body}
                        <p class="preview-body">{previewContent.body}</p>
                    {:else}
                        <p class="preview-placeholder">Write your letter body...</p>
                    {/if}
                    
                    {#if $appState.letter.closing}
                        <p class="preview-closing">{$appState.letter.closing}</p>
                    {/if}
                    
                    {#if $appState.letter.signature}
                        <p class="preview-signature">{$appState.letter.signature}</p>
                    {/if}
                </div>
            </div>
        </div>
    </div>

    <div class="step-actions">
        <button class="btn-secondary" on:click={() => dispatch('back')}>Back</button>
        <button 
            class="btn-primary" 
            on:click={() => dispatch('next')} 
            disabled={!$appState.letter.body.trim()}
        >
            Next: Review Campaign
        </button>
    </div>
</div>

<style>
    .letter-composer-wrapper {
        display: grid;
        grid-template-columns: 1.2fr 1fr;
        gap: 2.5rem;
        margin: 2rem 0;
    }

    .placeholder-help {
        background: var(--background-color);
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
    }

    .placeholder-help strong {
        display: block;
        margin-bottom: 0.75rem;
        color: var(--text-color);
        font-size: 1.05rem;
    }

    .placeholder-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .placeholder-tag {
        display: inline-block;
        background: var(--primary-color);
        color: white;
        padding: 0.4rem 0.8rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.95rem;
        font-family: 'Courier New', monospace;
        transition: all 0.2s;
    }

    .placeholder-tag:hover {
        background: var(--primary-dark);
        transform: translateY(-2px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .form-group {
        margin-bottom: 1.2rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.4rem;
        font-weight: 600;
        color: var(--text-color);
        font-size: 1.1rem;
    }

    .field-hint {
        display: block;
        font-size: 0.95rem;
        font-weight: normal;
        color: var(--text-light);
        margin-top: 0.25rem;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    .letter-input {
        width: 100%;
        padding: 1.2rem;
        border: 2px solid var(--border-color);
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        font-family: 'Georgia', 'Times New Roman', serif;
        font-size: 1.5rem;
        transition: border-color 0.3s;
    }

    .letter-input:focus {
        outline: none;
        border-color: var(--primary-color);
    }

    .letter-textarea {
        width: 100%;
        padding: 1.4rem;
        border: 2px solid var(--border-color);
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        font-family: 'Georgia', 'Times New Roman', serif;
        font-size: 1.5rem;
        line-height: 1.8;
        resize: vertical;
        min-height: 280px;
        transition: border-color 0.3s;
    }

    .letter-textarea:focus {
        outline: none;
        border-color: var(--primary-color);
    }

    .letter-preview-panel {
        position: sticky;
        top: 2rem;
        height: fit-content;
    }

    .preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        gap: 1rem;
    }

    .letter-preview-panel h4 {
        margin-bottom: 0;
        color: var(--primary-color);
    }

    .btn-download-pdf {
        background-color: var(--secondary-color);
        color: var(--text-color);
        border: 2px solid var(--border-color);
        padding: 0.9rem 1.7rem;
        font-size: 1.3rem;
        font-family: inherit;
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.2);
        font-weight: bold;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .btn-download-pdf:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 3px 3px 0px rgba(0, 0, 0, 0.2);
        background-color: #f0d385;
    }

    .btn-download-pdf:active:not(:disabled) {
        transform: translateY(1px);
        box-shadow: 1px 1px 0px rgba(0, 0, 0, 0.2);
    }

    .btn-download-pdf:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
    }

    .spinner {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .preview-note {
        font-size: 1.3rem;
        color: var(--text-light);
        margin-bottom: 1rem;
    }

    .preview-letter {
        background: white;
        border: 2px solid var(--border-color);
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        padding: 2.5rem;
        box-shadow: var(--shadow);
        min-height: 500px;
    }

    .preview-content {
        font-family: 'Georgia', 'Times New Roman', serif;
        line-height: 1.8;
        font-size: 1.5rem;
    }

    .preview-greeting {
        font-size: 1.7rem;
        margin-bottom: 1.5rem;
        font-weight: 500;
    }

    .preview-body {
        margin-bottom: 2rem;
        white-space: pre-wrap;
        font-size: 1.5rem;
    }

    .preview-closing {
        margin-bottom: 0.8rem;
        font-size: 1.5rem;
    }

    .preview-signature {
        font-weight: 600;
        font-style: italic;
        font-size: 1.5rem;
    }

    .preview-placeholder {
        color: var(--text-light);
        font-style: italic;
        margin: 1rem 0;
    }

    @media (max-width: 1024px) {
        .letter-composer-wrapper {
            grid-template-columns: 1fr;
        }

        .letter-preview-panel {
            position: static;
        }

        .form-row {
            grid-template-columns: 1fr;
        }
    }
</style>
