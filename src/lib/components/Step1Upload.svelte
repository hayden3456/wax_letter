<script lang="ts">
    import { appState } from '$lib/stores';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let stampInput: HTMLInputElement;

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.classList.add('dragover');
        }
    }

    function handleDragLeave(e: DragEvent) {
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.classList.remove('dragover');
        }
    }

    function handleFileDrop(e: DragEvent) {
        e.preventDefault();
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.classList.remove('dragover');
        }
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            handleStampUpload(files[0]);
        }
    }

    function handleStampUpload(file: File) {
        if (!file) return;

        const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload an SVG, PNG, or JPG file.');
            return;
        }

        // Check file size (5MB limit)
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_FILE_SIZE) {
            alert(`File too large. Maximum size is 5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Please use a smaller file.`);
            if (stampInput) {
                stampInput.value = '';
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e: ProgressEvent<FileReader>) {
            if (e.target?.result && typeof e.target.result === 'string') {
                // @ts-expect-error - stampImage is a writable store property
                $appState.stampImage = e.target.result;
            }
        };
        reader.onerror = function() {
            alert('Failed to read file. Please try again.');
            if (stampInput) {
                stampInput.value = '';
            }
        };
        reader.readAsDataURL(file);
    }
</script>

<div class="step-container">
    <h2>Step 1: Upload Your Stamp Pattern</h2>
    <p class="step-description">Upload your logo or design for the wax seal. SVG format is preferred for best quality.</p>

    <div class="campaign-name-section">
        <label for="campaignName">Title</label>
        <input 
            id="campaignName"
            type="text" 
            bind:value={$appState.name}
            placeholder="To find this group of mail in the future..."
            class="campaign-name-input"
        />
    </div>

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div 
        class="upload-area" 
        on:click={() => stampInput.click()}
        on:dragover={handleDragOver}
        on:dragleave={handleDragLeave}
        on:drop={handleFileDrop}
    >
        <div class="upload-icon">⬆</div>
        <p>Drag & drop your file here or click to browse</p>
        <p class="upload-hint">Supported formats: SVG (preferred), PNG, JPG</p>
        <input 
            type="file" 
            bind:this={stampInput} 
            accept=".svg,.png,.jpg,.jpeg" 
            hidden 
            on:change={(e) => {
                const target = e.target as HTMLInputElement;
                if (target.files && target.files[0]) {
                    handleStampUpload(target.files[0]);
                }
            }}
        >
    </div>

        <div class="preview-section" id="stampPreviewSection">
            <h3>Your Logo</h3>
            
            <!-- Uploaded Logo Display -->
            <div class="uploaded-logo-container">
                <img src={$appState.stampImage || '/waxletterlogo.png'} alt="Your stamp preview" class="uploaded-logo">
            </div>

            <!-- Wax Seal Preview -->
            <div class="homepage-mockup">
                <h3>Design Process</h3>
                <div class="design-process-content">
                    <p>We will email you your actual design and will iterate on your wax seal design once you order. You will receive a full refund if you do not like the results.</p>
                    <p class="sample-option">
                        Alternatively, <a href="/#contact" class="sample-link">contact us to get a sample made for free</a>.
                    </p>
                </div>
            </div>
        </div>

    <div class="step-actions">
        <a href="/" class="btn-secondary" style="text-decoration: none; display: inline-block; text-align: center;">Cancel</a>
        <button class="btn-primary" on:click={() => dispatch('next')} disabled={!$appState.stampImage}>Next: Add Addresses</button>
    </div>
</div>

<style>
    .real-image-container {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        max-width: 750px;
        max-height: 800px;
        margin: 0 auto;
        border-radius: 10px;
        overflow: hidden;
        background: transparent;
    }

    .hero-img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(5px 5px 5px rgba(0,0,0,0.2));
        transform: scale(1.15); /* Zoom in 15% to make image more prominent */
    }

    .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255,255,255,0.8);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 20;
        border-radius: 10px;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid var(--primary-light);
        border-top: 4px solid var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 0.5rem;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .hero-img.generated {
        transform: scale(1.15) rotate(0deg); /* Maintain 15% zoom even for generated images */
    }

    .ai-disclaimer {
        text-align: center;
        color: var(--text-muted);
        font-size: 1.4rem;
        font-style: italic;
        margin-top: 1rem;
        padding: 0.5rem;
        background: rgba(0,0,0,0.05);
        border-radius: 8px;
    }

    .homepage-mockup {
        margin-top: 2rem;
    }

    .homepage-mockup h4 {
        text-align: center;
        margin-bottom: 1rem;
        font-size: 1.4rem;
        color: var(--text-color);
    }

    .uploaded-logo-container {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 2rem 0;
        padding: 2rem;
        background: rgba(0,0,0,0.02);
        border-radius: 10px;
    }

    .uploaded-logo {
        max-width: 300px;
        max-height: 300px;
        width: auto;
        height: auto;
        object-fit: contain;
    }

    .patience-message {
        text-align: center;
        color: var(--text-muted);
        font-size: 1.2rem;
        font-style: italic;
        margin-bottom: 1.5rem;
        padding: 0.5rem;
    }

    .campaign-name-section {
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: var(--card-background);
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        border: 2px solid var(--border-color);
    }

    .campaign-name-section label {
        display: block;
        font-weight: bold;
        margin-bottom: 0.5rem;
        color: var(--text-color);
    }

    .campaign-name-input {
        width: 100%;
        padding: 0.75rem;
        font-size: 1.4rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        box-sizing: border-box;
        transition: border-color 0.3s;
    }

    .campaign-name-input:focus {
        outline: none;
        border-color: var(--primary-color);
    }

    .campaign-name-input::placeholder {
        color: #999;
    }

    @media (max-width: 768px) {
        .real-image-container {
            max-width: 100%;
            max-height: 400px;
        }

        .uploaded-logo-container {
            margin: 1rem 0;
            padding: 1rem;
        }

        .uploaded-logo {
            max-width: 200px;
            max-height: 200px;
        }

        .homepage-mockup {
            margin-top: 1.5rem;
        }

        .homepage-mockup h4 {
            font-size: 1.1rem;
        }

        .ai-disclaimer {
            font-size: 1rem;
        }

        .patience-message {
            font-size: 1rem;
        }

        .campaign-name-section {
            padding: 1rem;
            margin-bottom: 1rem;
        }

        .campaign-name-input {
            padding: 0.6rem;
            font-size: 1.1rem;
        }
    }

    @media (max-width: 480px) {
        .real-image-container {
            max-height: 300px;
        }

        .uploaded-logo {
            max-width: 150px;
            max-height: 150px;
        }

        .uploaded-logo-container {
            padding: 0.8rem;
        }

        .homepage-mockup h4 {
            font-size: 1rem;
        }

        .ai-disclaimer {
            font-size: 0.9rem;
        }

        .patience-message {
            font-size: 0.9rem;
        }

        .campaign-name-input {
            font-size: 1rem;
        }
    }
</style>
