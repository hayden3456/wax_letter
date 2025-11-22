<script>
    import { appState } from '$lib/stores';
    import { createEventDispatcher, onMount } from 'svelte';
    import { browser } from '$app/environment';
    import jsPDF from 'jspdf';

    const dispatch = createEventDispatcher();

    let editor;
    let showPreview = false;
    let isGeneratingPDF = false;
    
    // Track cursor position for inserting at caret
    let lastSavedRange = null;

    const placeholders = [
        { name: 'FirstName', label: 'First Name' },
        { name: 'LastName', label: 'Last Name' },
        { name: 'FullName', label: 'Full Name' },
        { name: 'Company', label: 'Company' }
    ];

    const sampleData = {
        'FirstName': 'John',
        'LastName': 'Doe',
        'FullName': 'John Doe',
        'Company': 'Acme Corp'
    };

    onMount(() => {
        if (browser) {
            // Initialize with default content if empty
            if (!$appState.letter.body || $appState.letter.body.trim() === '') {
                $appState.letter.body = `Dear {{FirstName}},

Write your letter content here...

Sincerely,
[Your Name]`;
            }
            renderEditorContent();
        }
    });

    // Watch for external updates to letter body (e.g. reset)
    // But avoid re-rendering if we are the ones editing
    let lastInternalUpdate = '';
    $: if (browser && $appState.letter.body !== lastInternalUpdate && !showPreview && editor) {
        // Only update if significantly different to avoid cursor jumping
        // For now, we trust the editor's internal state while editing
        // renderEditorContent(); 
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function renderEditorContent() {
        if (!editor) return;
        
        const text = $appState.letter.body || '';
        
        // Escape HTML first to treat everything as text
        let html = escapeHtml(text);
        
        // Replace newlines with <br>
        html = html.replace(/\n/g, '<br>');
        
        // Replace {{Key}} with pills
        placeholders.forEach(p => {
            const regex = new RegExp(`{{${p.name}}}`, 'g');
            const pillHtml = `<span class="placeholder-pill" contenteditable="false" data-val="${p.name}">${p.name}</span>`;
            html = html.replace(regex, pillHtml);
        });

        editor.innerHTML = html;
    }

    function updateStoreFromEditor() {
        if (showPreview || !editor) return;

        let text = '';
        
        // Helper to traverse nodes and build text
        function parseNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.classList.contains('placeholder-pill')) {
                    text += '{{' + node.dataset.val + '}}';
                } else if (node.tagName === 'BR') {
                    text += '\n';
                } else if (node.tagName === 'DIV') {
                    // Chrome/Firefox use divs for lines. 
                    // If it's not the first line, prepend newline
                    // Actually, usually div means "new line started here"
                    text += '\n'; 
                    node.childNodes.forEach(parseNode);
                } else {
                    node.childNodes.forEach(parseNode);
                }
            }
        }

        // Handle the editor's children
        editor.childNodes.forEach(parseNode);

        // Clean up: remove leading newline if it was added by the first div (common contenteditable quirk)
        // But be careful not to remove user's intentional newlines.
        // A simple trim() might be too aggressive for intended whitespace, but for a letter body it's usually fine.
        // Let's just trim the start/end.
        const newBody = text.trim();
        
        lastInternalUpdate = newBody;
        $appState.letter.body = newBody;
    }

    function handleInput() {
        saveSelection();
        updateStoreFromEditor();
    }

    function saveSelection() {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            lastSavedRange = sel.getRangeAt(0);
        }
    }

    function restoreSelection() {
        if (lastSavedRange) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(lastSavedRange);
        } else if (editor) {
            editor.focus();
        }
    }

    function insertPlaceholder(name) {
        if (showPreview) return;
        
        // Ensure editor has focus or use last saved range
        if (!lastSavedRange || (lastSavedRange.commonAncestorContainer !== editor && !editor.contains(lastSavedRange.commonAncestorContainer))) {
            editor.focus();
        } else {
            restoreSelection();
        }

        const pill = document.createElement('span');
        pill.className = 'placeholder-pill';
        pill.contentEditable = 'false';
        pill.dataset.val = name;
        pill.innerText = name;
        
        // Insert space after
        const space = document.createTextNode('\u00A0');

        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(space);
            range.insertNode(pill);
            
            // Move cursor after space
            range.setStartAfter(space);
            range.setEndAfter(space);
            sel.removeAllRanges();
            sel.addRange(range);
            
            saveSelection();
            updateStoreFromEditor();
        }
    }

    // Drag and Drop Handlers
    function handleDragStart(e, name) {
        e.dataTransfer.setData('text/plain', '{{' + name + '}}');
        e.dataTransfer.setData('application/x-wax-placeholder', name);
        e.dataTransfer.effectAllowed = 'copy';
    }

    function handleDragOver(e) {
        if (showPreview) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    function handleDrop(e) {
        if (showPreview) return;
        e.preventDefault();
        
        const name = e.dataTransfer.getData('application/x-wax-placeholder');
        if (name) {
            // Insert at drop position
            let range;
            if (document.caretRangeFromPoint) {
                range = document.caretRangeFromPoint(e.clientX, e.clientY);
            } else if (e.rangeParent) {
                range = document.createRange();
                range.setStart(e.rangeParent, e.rangeOffset);
                range.setEnd(e.rangeParent, e.rangeOffset);
            }

            if (range) {
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
                insertPlaceholder(name);
            }
        }
    }

    function togglePreview() {
        showPreview = !showPreview;
        if (showPreview) {
            // Render Preview
            let text = $appState.letter.body;
            // Replace placeholders with sample data
            Object.keys(sampleData).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                text = text.replace(regex, sampleData[key]);
            });
            
            editor.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
            editor.contentEditable = 'false';
        } else {
            // Render Edit Mode
            editor.contentEditable = 'true';
            renderEditorContent();
        }
    }

    function generatePDF() {
        if (!browser) return;
        isGeneratingPDF = true;
        
        try {
            const doc = new jsPDF();
            const margin = 25;
            const pageWidth = doc.internal.pageSize.getWidth();
            const maxWidth = pageWidth - (margin * 2);
            let yPosition = margin;

            // Prepare content with sample data
            let body = $appState.letter.body || '';

            Object.keys(sampleData).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                body = body.replace(regex, sampleData[key]);
            });

            // Add body
            if (body) {
                doc.setFontSize(11);
                doc.setFont('times', 'normal');
                const lines = doc.splitTextToSize(body, maxWidth);
                
                const pageHeight = doc.internal.pageSize.getHeight();

                lines.forEach(line => {
                    if (yPosition > pageHeight - margin) {
                        doc.addPage();
                        yPosition = margin;
                    }
                    doc.text(line, margin, yPosition);
                    yPosition += 7;
                });
                yPosition += 10;
            }

            doc.save('letter-preview.pdf');
        } catch (error) {
            console.error(error);
            alert('Error generating PDF');
        } finally {
            isGeneratingPDF = false;
        }
    }
</script>

<div class="step-container">
    <h2>Step 3: Compose Your Letter</h2>
    <p class="step-description">Drag and drop placeholders to personalize your letter.</p>

    <div class="wysiwyg-container">
        <!-- Left Sidebar: Placeholders -->
        <div class="sidebar">
            <h3>Available Placeholders</h3>
            <p class="sidebar-hint">Drag or click to insert</p>
            <div class="placeholder-list">
                {#each placeholders as p}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div 
                        class="placeholder-item" 
                        draggable="true"
                        on:dragstart={(e) => handleDragStart(e, p.name)}
                        on:click={() => insertPlaceholder(p.name)}
                    >
                        <span class="icon">+</span> {p.label}
                    </div>
                {/each}
            </div>
        </div>

        <!-- Right Side: Editor -->
        <div class="editor-area">
            <!-- Toolbar -->
            <div class="editor-toolbar">
                <div class="toggle-wrapper">
                    <label class="toggle-switch">
                        <input type="checkbox" checked={showPreview} on:change={togglePreview}>
                        <span class="slider round"></span>
                    </label>
                    <span class="toggle-label">{showPreview ? 'Viewing Preview' : 'View With Placeholders'}</span>
                </div>

                <button class="btn-text" on:click={generatePDF} disabled={isGeneratingPDF}>
                    {#if isGeneratingPDF}⏳{:else}📄{/if} Download PDF
                </button>
            </div>

            <!-- Main Editor -->
            <div 
                class="rich-editor {showPreview ? 'preview-mode' : ''}"
                bind:this={editor}
                contenteditable="true"
                on:input={handleInput}
                on:dragover={handleDragOver}
                on:drop={handleDrop}
                on:click={saveSelection}
                on:keyup={saveSelection}
                role="textbox"
                tabindex="0"
            ></div>
        </div>
    </div>

    <div class="step-actions">
        <button class="btn-secondary" on:click={() => dispatch('back')}>Back</button>
        <button 
            class="btn-primary" 
            on:click={() => dispatch('next')} 
            disabled={!$appState.letter.body || $appState.letter.body.trim().length === 0}
        >
            Next: Review Mail
        </button>
    </div>
</div>

<style>
    .wysiwyg-container {
        display: grid;
        grid-template-columns: 250px 1fr;
        gap: 2rem;
        margin: 2rem 0;
        align-items: start;
    }

    /* Sidebar */
    .sidebar {
        background: var(--background-color);
        padding: 1.5rem;
        border-radius: 12px;
        border: 1px solid var(--border-color);
        position: sticky;
        top: 2rem;
    }

    .sidebar h3 {
        font-size: 1.6rem;
        margin-bottom: 0.5rem;
        color: var(--primary-color);
    }

    .sidebar-hint {
        font-size: 1.2rem;
        color: var(--text-light);
        margin-bottom: 1.5rem;
    }

    .placeholder-list {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }

    .placeholder-item {
        background: white;
        border: 1px solid var(--border-color);
        padding: 0.8rem 1.2rem;
        border-radius: 8px;
        cursor: grab;
        font-size: 1.4rem;
        display: flex;
        align-items: center;
        gap: 0.8rem;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .placeholder-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        border-color: var(--primary-color);
    }

    .placeholder-item:active {
        cursor: grabbing;
    }

    .placeholder-item .icon {
        color: var(--primary-color);
        font-weight: bold;
    }

    /* Editor Area */
    .editor-area {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    /* Toolbar */
    .editor-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f8f9fa;
        padding: 0.8rem 1.5rem;
        border-radius: 8px 8px 0 0;
        border: 1px solid var(--border-color);
        border-bottom: none;
    }

    .toggle-wrapper {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .toggle-label {
        font-size: 1.4rem;
        font-weight: 500;
    }

    /* Toggle Switch */
    .toggle-switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 26px;
    }

    .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 20px;
        width: 20px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .4s;
    }

    input:checked + .slider {
        background-color: var(--primary-color);
    }

    input:checked + .slider:before {
        transform: translateX(24px);
    }

    .slider.round {
        border-radius: 34px;
    }

    .slider.round:before {
        border-radius: 50%;
    }

    .btn-text {
        background: none;
        border: none;
        color: var(--primary-color);
        font-weight: 600;
        cursor: pointer;
        font-size: 1.4rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .btn-text:hover {
        text-decoration: underline;
    }

    /* Rich Editor */
    .rich-editor {
        min-height: 400px;
        padding: 2rem;
        background: white;
        border: 1px solid var(--border-color);
        border-radius: 0 0 8px 8px;
        font-family: 'Georgia', 'Times New Roman', serif;
        font-size: 1.6rem;
        line-height: 1.8;
        outline: none;
        white-space: pre-wrap;
        box-shadow: var(--shadow);
    }

    .rich-editor:focus {
        border-color: var(--primary-color);
        box-shadow: var(--shadow-lg);
    }

    .rich-editor.preview-mode {
        background-color: #fafafa;
        color: #333;
    }

    /* Pills in Editor */
    :global(.placeholder-pill) {
        display: inline-block;
        background-color: #e3f2fd;
        color: #1976d2;
        padding: 2px 8px;
        border-radius: 12px;
        border: 1px solid #bbdefb;
        font-family: 'Inter', sans-serif;
        font-size: 0.9em;
        margin: 0 2px;
        vertical-align: middle;
        user-select: none;
        cursor: default;
        font-weight: 500;
    }

    @media (max-width: 900px) {
        .wysiwyg-container {
            grid-template-columns: 1fr;
        }

        .sidebar {
            position: static;
            margin-bottom: 1rem;
        }

        .placeholder-list {
            flex-direction: row;
            flex-wrap: wrap;
        }
    }
</style>
