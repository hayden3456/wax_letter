<script>
    import { appState } from '$lib/stores';
    import { createEventDispatcher } from 'svelte';
    import { browser } from '$app/environment';

    const dispatch = createEventDispatcher();

    let stampInput;
    let isGenerating = false;
    let generatedImage = null;
    let loadingMessage = "Generating Seal...";
    let loadingInterval;

    const loadingMessages = [
        "Heating the Wax...",
        "Customizing the Stamp...",
        "Preparing the Seal...",
        "Crafting Your Design...",
        "Applying the Impression...",
        "Perfecting the Details..."
    ];

    function startLoadingAnimation() {
        let index = 0;
        loadingMessage = loadingMessages[index];
        loadingInterval = setInterval(() => {
            index = (index + 1) % loadingMessages.length;
            loadingMessage = loadingMessages[index];
        }, 2000);
    }

    function stopLoadingAnimation() {
        if (loadingInterval) {
            clearInterval(loadingInterval);
            loadingInterval = null;
        }
    }

    async function convertSvgToPng(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name.replace('.svg', '.png'), { type: 'image/png' }));
                        } else {
                            reject(new Error('Failed to convert SVG'));
                        }
                    }, 'image/png');
                };
                img.onerror = () => reject(new Error('Failed to load SVG'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.currentTarget.classList.remove('dragover');
    }

    function handleFileDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleStampUpload(files[0]);
        }
    }

    async function handleStampUpload(file) {
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

        isGenerating = true;
        startLoadingAnimation();

        try {
            const reader = new FileReader();
            reader.onload = function(e) {
                $appState.stampImage = e.target.result;
            };
            reader.readAsDataURL(file);

            // Convert SVG to PNG if needed for API
            let apiFile = file;
            if (file.type === 'image/svg+xml') {
                apiFile = await convertSvgToPng(file);
                // Check size again after conversion
                if (apiFile.size > MAX_FILE_SIZE) {
                    alert(`Converted file is too large (${(apiFile.size / (1024 * 1024)).toFixed(2)}MB). Please use a smaller SVG file.`);
                    isGenerating = false;
                    stopLoadingAnimation();
                    if (stampInput) {
                        stampInput.value = '';
                    }
                    return;
                }
            }

            // Generate AI preview
            const formData = new FormData();
            formData.append('logo', apiFile);

            const response = await fetch('/api/generate-seal', {
                method: 'POST',
                body: formData,
                keepalive: true // Help continue even if user navigates away
            });

            if (response.ok) {
                const data = await response.json();
                generatedImage = data.image;
                
                // Save AI letter image to campaign state (will be saved to campaign via auto-save)
                if (generatedImage && browser) {
                    $appState.aiLetterImage = generatedImage;
                    console.log('✅ AI letter image saved to campaign state');
                }
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Failed to generate seal preview:', response.status, errorData);
                
                if (response.status === 413) {
                    alert('File is too large. Please use a smaller file (maximum 5MB).');
                } else {
                    alert(`Failed to generate preview: ${errorData.error || 'Server error'}`);
                }
            }
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            isGenerating = false;
            stopLoadingAnimation();
        }
    }

    // Track campaign ID to detect when it changes
    let lastCampaignId = $appState.campaignId;
    
    // Load saved preview image from campaign state (reactive - updates when campaign loads)
    $: if (browser) {
        // Reset generatedImage if campaign changed
        if ($appState.campaignId !== lastCampaignId) {
            generatedImage = null;
            lastCampaignId = $appState.campaignId;
        }
        
        // Load AI letter image from campaign state (same way logos are loaded)
        if (!generatedImage) {
            if ($appState.aiLetterImageUrl) {
                generatedImage = $appState.aiLetterImageUrl;
                console.log('✅ Loaded AI letter image URL from campaign');
            }
            // Also check if campaign has the data URL stored
            else if ($appState.aiLetterImage) {
                generatedImage = $appState.aiLetterImage;
                console.log('✅ Loaded AI letter image from campaign state');
            }
        }
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
            on:change={(e) => handleStampUpload(e.target.files[0])}
        >
    </div>

    {#if $appState.stampImage}
        <div class="preview-section" id="stampPreviewSection">
            <h3>Your Logo</h3>
            
            <!-- Uploaded Logo Display -->
            <div class="uploaded-logo-container">
                <img src={$appState.stampImage} alt="Your stamp preview" class="uploaded-logo">
            </div>

            <!-- Wax Seal Preview -->
            <div class="homepage-mockup">
                <h3>Wax Seal Preview</h3>
                <h4 class="patience-message">Please be patient, due to high demand this is taking a while to load properly</h4>
                <div class="real-image-container">
                    {#if generatedImage}
                        <img src={generatedImage} alt="Wax Sealed Letter with Custom Logo" class="hero-img generated">
                    {:else}
                        <img src="/single_letter_no_bg.png" alt="Wax Sealed Letter" class="hero-img">
                    {/if}
                    
                    {#if isGenerating}
                        <div class="loading-overlay">
                            <div class="spinner"></div>
                            <span>{loadingMessage}</span>
                        </div>
                    {/if}
                </div>
                {#if generatedImage}
                    <p class="ai-disclaimer">This is AI-generated. Not the actual wax seal. When you order we will get approval of the wax seal design via email.</p>
                {/if}
            </div>

            <button class="btn-secondary" on:click={() => stampInput.click()}>Change Image</button>
        </div>
    {/if}

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
        transform: rotate(0deg);
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
</style>
