<script>
    import { appState } from '$lib/stores';
    import { authStore } from '$lib/stores/authStore';
    import { createEventDispatcher } from 'svelte';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { get } from 'svelte/store';
    import { saveStep1PreviewImage, loadStep1PreviewImage, deleteStep1PreviewImage } from '$lib/firestoreService';

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

        // Delete old preview image from cloud before generating new one
        try {
            const $auth = get(authStore);
            const userId = $auth.user?.uid || null;
            await deleteStep1PreviewImage(userId).catch(() => {
                // Ignore errors - image might not exist
            });
        } catch (e) {
            // Ignore errors
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
                
                // Save to Firebase async (non-blocking, continues even if user leaves)
                if (generatedImage && browser) {
                    const $auth = get(authStore);
                    const userId = $auth.user?.uid || null;
                    saveStep1PreviewImage(generatedImage, userId).catch(err => {
                        console.warn('Failed to save preview to cloud (image still displayed):', err);
                    });
                }
            } else {
                console.error('Failed to generate seal preview');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            isGenerating = false;
            stopLoadingAnimation();
        }
    }

    // Load saved preview image from Firebase on mount
    onMount(async () => {
        if (!browser) return;
        
        // Only load if we have a stamp image but no generated image yet
        if ($appState.stampImage && !generatedImage) {
            try {
                const $auth = get(authStore);
                const userId = $auth.user?.uid || null;
                const cloudImage = await loadStep1PreviewImage(userId);
                if (cloudImage) {
                    generatedImage = cloudImage;
                    console.log('✅ Loaded Step1 preview image from Firebase');
                }
            } catch (e) {
                console.warn('Failed to load preview from cloud:', e);
            }
        }
    });
</script>

<div class="step-container">
    <h2>Step 1: Upload Your Stamp Pattern</h2>
    <p class="step-description">Upload your logo or design for the wax seal. SVG format is preferred for best quality.</p>

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
            <h3>Your Wax Seal Preview</h3>
            
            <!-- Sealed Envelope -->
            <div class="sealed-envelope">
                <div class="envelope-flap"></div>
                <div class="envelope-body">
                    <div class="envelope-address-lines">
                        <div class="address-line"></div>
                        <div class="address-line"></div>
                        <div class="address-line short"></div>
                    </div>
                </div>
                <div class="envelope-wax-seal">
                    <img src={$appState.stampImage} alt="Your stamp preview">
                </div>
            </div>

            <!-- Homepage Letter Mockup -->
            <div class="homepage-mockup">
                <h4>How it looks on your letter:</h4>
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
                    <p class="ai-disclaimer">This is AI-generated and won't show the actual wax seal.</p>
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
        font-size: 0.9rem;
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
        font-size: 1.2rem;
        color: var(--text-color);
    }
</style>
