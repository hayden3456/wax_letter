<svelte:head>
    <title>Wax Seal Mailing Service - Custom Bulk Mail with Elegance</title>
</svelte:head>

<script>
    import { fade } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import { appState } from '$lib/stores';
    import { authStore } from '$lib/stores/authStore';
    import ContactForm from '$lib/components/ContactForm.svelte';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { saveHomepagePreviewImage, loadHomepagePreviewImage, deleteHomepagePreviewImage } from '$lib/firestoreService';
    import { get } from 'svelte/store';

    /** @type {HTMLInputElement | null} */
    let fileInput;
    let uploadedLogo = null;

    function handleImageClick() {
        if (fileInput) {
            fileInput.click();
        }
    }

    function startNewCampaign() {
        // Reset the store to clear any existing campaign data
        appState.reset();
        goto('/campaign/step/1');
    }

    let isGenerating = false;
    /** @type {string | null} */
    let generatedImage = null;
    let loadingMessage = "Generating Seal...";
    /** @type {ReturnType<typeof setInterval> | null} */
    let loadingInterval;
    let hasUploadedFile = false; // Track if user has uploaded a file
    let showRetryButton = false; // Show retry button if generation fails

    const loadingMessages = [
        "Heating the Wax...",
        "Customizing the Stamp...",
        "Preparing the Seal...",
        "Crafting Your Design...",
        "Applying the Impression...",
        "Perfecting the Details..."
    ];

    // Storage keys
    // Background generation improvements:
    // - Saves file data and metadata to localStorage before starting generation
    // - Tracks generation timestamp to detect timeouts (5 min max)
    // - Counts retry attempts (max 3) to prevent infinite loops
    // - Automatically resumes pending generations when user returns to page
    // - Shows retry UI if generation fails after max attempts
    // - Clears stale generation state if timeout exceeded
    const STORAGE_KEYS = {
        UPLOADED_FILE: 'homepage_uploaded_file',
        GENERATED_IMAGE: 'homepage_generated_image',
        IS_GENERATING: 'homepage_is_generating',
        GENERATION_TIMESTAMP: 'homepage_generation_timestamp',
        GENERATION_ATTEMPTS: 'homepage_generation_attempts'
    };
    
    // Generation timeout in milliseconds (5 minutes)
    const GENERATION_TIMEOUT = 5 * 60 * 1000;

    function startLoadingAnimation() {
        let index = 0;
        loadingMessage = loadingMessages[index];
        loadingInterval = setInterval(() => {
            index = (index + 1) % loadingMessages.length;
            loadingMessage = loadingMessages[index];
        }, 2000);
    }

    function stopLoadingAnimation() {
        if (loadingInterval !== null) {
            clearInterval(loadingInterval);
            loadingInterval = null;
        }
    }

    // Save state to localStorage and cloud
    async function saveState() {
        if (!browser) return;
        try {
            if (generatedImage) {
                localStorage.setItem(STORAGE_KEYS.GENERATED_IMAGE, generatedImage);
                // Also save to cloud (background, don't wait)
                const $auth = get(authStore);
                const userId = $auth.user?.uid || null;
                saveHomepagePreviewImage(generatedImage, userId).catch(err => {
                    console.warn('Failed to save preview to cloud (using local only):', err);
                });
                // Clear generation flags when image is generated
                localStorage.removeItem(STORAGE_KEYS.IS_GENERATING);
                localStorage.removeItem(STORAGE_KEYS.GENERATION_TIMESTAMP);
                localStorage.removeItem(STORAGE_KEYS.GENERATION_ATTEMPTS);
            }
            if (isGenerating) {
                localStorage.setItem(STORAGE_KEYS.IS_GENERATING, 'true');
                // Set timestamp when generation starts (if not already set)
                if (!localStorage.getItem(STORAGE_KEYS.GENERATION_TIMESTAMP)) {
                    localStorage.setItem(STORAGE_KEYS.GENERATION_TIMESTAMP, Date.now().toString());
                }
            } else if (!generatedImage) {
                // Only clear if we don't have an image (prevents clearing on successful completion)
                localStorage.removeItem(STORAGE_KEYS.IS_GENERATING);
            }
            if (hasUploadedFile) {
                localStorage.setItem(STORAGE_KEYS.UPLOADED_FILE, 'true');
            }
        } catch (e) {
            console.error('Failed to save state:', e);
        }
    }

    // Load state from localStorage and cloud
    async function loadState() {
        if (!browser) return;
        try {
            const savedImage = localStorage.getItem(STORAGE_KEYS.GENERATED_IMAGE);
            const isGeneratingSaved = localStorage.getItem(STORAGE_KEYS.IS_GENERATING);
            const hasUploaded = localStorage.getItem(STORAGE_KEYS.UPLOADED_FILE);
            const generationTimestamp = localStorage.getItem(STORAGE_KEYS.GENERATION_TIMESTAMP);
            const savedFileData = localStorage.getItem(STORAGE_KEYS.UPLOADED_FILE + '_data');

            // Try to load from cloud first (more up-to-date)
            try {
                const $auth = get(authStore);
                const userId = $auth.user?.uid || null;
                const cloudImage = await loadHomepagePreviewImage(userId);
                if (cloudImage) {
                    generatedImage = cloudImage;
                    hasUploadedFile = true;
                    showRetryButton = false;
                    // Update localStorage with cloud version
                    localStorage.setItem(STORAGE_KEYS.GENERATED_IMAGE, cloudImage);
                    // Clear generation flags since we have the image
                    localStorage.removeItem(STORAGE_KEYS.IS_GENERATING);
                    localStorage.removeItem(STORAGE_KEYS.GENERATION_TIMESTAMP);
                    localStorage.removeItem(STORAGE_KEYS.GENERATION_ATTEMPTS);
                } else if (savedImage) {
                    // Fallback to local storage
                    generatedImage = savedImage;
                    hasUploadedFile = true;
                    showRetryButton = false;
                    // Clear generation flags since we have the image
                    localStorage.removeItem(STORAGE_KEYS.IS_GENERATING);
                    localStorage.removeItem(STORAGE_KEYS.GENERATION_TIMESTAMP);
                    localStorage.removeItem(STORAGE_KEYS.GENERATION_ATTEMPTS);
                }
            } catch (e) {
                // Cloud load failed, use local storage
                console.warn('Failed to load from cloud, using local storage:', e);
                if (savedImage) {
                    generatedImage = savedImage;
                    hasUploadedFile = true;
                    showRetryButton = false;
                    // Clear generation flags since we have the image
                    localStorage.removeItem(STORAGE_KEYS.IS_GENERATING);
                    localStorage.removeItem(STORAGE_KEYS.GENERATION_TIMESTAMP);
                    localStorage.removeItem(STORAGE_KEYS.GENERATION_ATTEMPTS);
                }
            }

            // Check if there's a pending generation that needs to be resumed
            if (isGeneratingSaved === 'true' && !generatedImage && savedFileData) {
                // Check if the generation has timed out
                const now = Date.now();
                const timestamp = generationTimestamp ? parseInt(generationTimestamp, 10) : now;
                const timeSinceStart = now - timestamp;
                
                if (timeSinceStart < GENERATION_TIMEOUT) {
                    // Generation is still valid, resume it
                    console.log('Resuming pending generation...');
                    hasUploadedFile = true;
                    await continuePendingGeneration();
                } else {
                    // Generation timed out, clear it and allow user to retry
                    console.log('Generation timed out, clearing state');
                    localStorage.removeItem(STORAGE_KEYS.IS_GENERATING);
                    localStorage.removeItem(STORAGE_KEYS.GENERATION_TIMESTAMP);
                    localStorage.removeItem(STORAGE_KEYS.GENERATION_ATTEMPTS);
                    // Keep the file data so user can see what was attempted
                    if (hasUploaded) {
                        hasUploadedFile = true;
                    }
                }
            } else if (hasUploaded) {
                hasUploadedFile = true;
            }
        } catch (e) {
            console.error('Failed to load state:', e);
        }
    }

    // Continue a pending generation (if file was saved)
    async function continuePendingGeneration() {
        const savedFileData = localStorage.getItem(STORAGE_KEYS.UPLOADED_FILE + '_data');
        if (!savedFileData) {
            console.warn('No saved file data to continue generation');
            localStorage.removeItem(STORAGE_KEYS.IS_GENERATING);
            return;
        }

        // Get current attempt count
        const attemptsStr = localStorage.getItem(STORAGE_KEYS.GENERATION_ATTEMPTS);
        const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
        
        // Max 3 retry attempts
        if (attempts >= 3) {
            console.error('Max generation attempts reached');
            localStorage.removeItem(STORAGE_KEYS.IS_GENERATING);
            localStorage.removeItem(STORAGE_KEYS.GENERATION_TIMESTAMP);
            localStorage.removeItem(STORAGE_KEYS.GENERATION_ATTEMPTS);
            showRetryButton = true;
            return;
        }

        // Increment attempt count
        localStorage.setItem(STORAGE_KEYS.GENERATION_ATTEMPTS, (attempts + 1).toString());
        
        isGenerating = true;
        startLoadingAnimation();
        await saveState();

        // Try to use Service Worker for true background processing
        if (browser && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
            console.log('Resuming generation via Service Worker');
            
            const swController = navigator.serviceWorker.controller;
            const fileName = localStorage.getItem(STORAGE_KEYS.UPLOADED_FILE + '_name') || 'logo.png';
            const $auth = get(authStore);
            const userId = $auth.user?.uid || null;
            
            swController.postMessage({
                type: 'GENERATE_IMAGE',
                fileData: savedFileData,
                fileName: fileName,
                userId: userId
            });
            
            console.log('Resume request sent to Service Worker');
            // The Service Worker will handle it and notify us
        } else {
            // Fallback to regular fetch
            console.log('Service Worker not available, using fetch for resume');
            
            try {
                // Convert base64 data URL back to File
                const response = await fetch(savedFileData);
                const blob = await response.blob();
                const fileName = localStorage.getItem(STORAGE_KEYS.UPLOADED_FILE + '_name') || 'logo.png';
                const file = new File([blob], fileName, { type: blob.type || 'image/png' });

                const formData = new FormData();
                formData.append('logo', file);

                const apiResponse = await fetch('/api/generate-seal', {
                    method: 'POST',
                    body: formData,
                    keepalive: true
                });

                if (apiResponse.ok) {
                    const data = await apiResponse.json();
                    generatedImage = data.image;
                    hasUploadedFile = true;
                    showRetryButton = false;
                    // Save will clear the generation flags
                    await saveState();
                    console.log('Generation completed successfully');
                } else {
                    const errorText = await apiResponse.text();
                    console.error('Failed to generate seal:', apiResponse.status, errorText);
                    
                    // Don't retry immediately - let user return to page to trigger retry
                    if (attempts >= 2) {
                        localStorage.removeItem(STORAGE_KEYS.IS_GENERATING);
                        localStorage.removeItem(STORAGE_KEYS.GENERATION_TIMESTAMP);
                        localStorage.removeItem(STORAGE_KEYS.GENERATION_ATTEMPTS);
                        showRetryButton = true;
                    }
                }
            } catch (error) {
                console.error('Error continuing generation:', error);
                
                // Don't retry immediately for network errors
                if (attempts >= 2) {
                    localStorage.removeItem(STORAGE_KEYS.IS_GENERATING);
                    localStorage.removeItem(STORAGE_KEYS.GENERATION_TIMESTAMP);
                    localStorage.removeItem(STORAGE_KEYS.GENERATION_ATTEMPTS);
                    showRetryButton = true;
                }
            } finally {
                isGenerating = false;
                stopLoadingAnimation();
                await saveState();
            }
        }
    }

    // Manual retry function
    async function retryGeneration() {
        showRetryButton = false;
        const savedFileData = localStorage.getItem(STORAGE_KEYS.UPLOADED_FILE + '_data');
        
        if (!savedFileData) {
            alert('No saved file found. Please upload your logo again.');
            return;
        }

        // Reset generation state for fresh retry
        localStorage.removeItem(STORAGE_KEYS.GENERATION_ATTEMPTS);
        localStorage.removeItem(STORAGE_KEYS.GENERATION_TIMESTAMP);
        
        // Resume generation
        await continuePendingGeneration();
    }

    /**
     * @param {File} file
     * @returns {Promise<File>}
     */
    async function convertSvgToPng(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (!e.target || typeof e.target.result !== 'string') {
                    reject(new Error('Failed to read file'));
                    return;
                }
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Failed to get canvas context'));
                        return;
                    }
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

    // Background generation function that persists
    /**
     * @param {File} file
     */
    async function generateImageInBackground(file) {
        // Delete old preview image from cloud before generating new one
        try {
            const $auth = get(authStore);
            const userId = $auth.user?.uid || null;
            await deleteHomepagePreviewImage(userId).catch(() => {
                // Ignore errors - image might not exist
            });
        } catch (e) {
            // Ignore errors
        }

        // Clear any previous generation state
        localStorage.removeItem(STORAGE_KEYS.GENERATED_IMAGE);
        localStorage.removeItem(STORAGE_KEYS.GENERATION_TIMESTAMP);
        localStorage.removeItem(STORAGE_KEYS.GENERATION_ATTEMPTS);
        generatedImage = null;

        // Start generation UI
        isGenerating = true;
        startLoadingAnimation();
        hasUploadedFile = true;
        await saveState(); // This sets the timestamp and IS_GENERATING flag

        // Try to use Service Worker for true background processing
        let useServiceWorker = false;
        
        if (browser && 'serviceWorker' in navigator) {
            try {
                // Wait for Service Worker to be ready
                const registration = await navigator.serviceWorker.ready;
                if (registration.active && navigator.serviceWorker.controller) {
                    useServiceWorker = true;
                    console.log('Using Service Worker for background generation');
                } else {
                    console.log('Service Worker not controlling page yet, using fallback');
                }
            } catch (e) {
                console.log('Service Worker not available, using fallback');
            }
        }
        
        if (useServiceWorker && navigator.serviceWorker.controller) {
            const swController = navigator.serviceWorker.controller;
            
            // Convert file to data URL for Service Worker
            const reader = new FileReader();
            reader.onload = async (e) => {
                if (e.target && typeof e.target.result === 'string') {
                    const fileData = e.target.result;
                    localStorage.setItem(STORAGE_KEYS.UPLOADED_FILE + '_data', fileData);
                    localStorage.setItem(STORAGE_KEYS.UPLOADED_FILE + '_name', file.name);
                    
                    // Send to Service Worker for background processing
                    const $auth = get(authStore);
                    const userId = $auth.user?.uid || null;
                    
                    swController.postMessage({
                        type: 'GENERATE_IMAGE',
                        fileData: fileData,
                        fileName: file.name,
                        userId: userId
                    });
                    
                    console.log('Generation request sent to Service Worker');
                    // The Service Worker will handle the generation and notify us via message
                }
            };
            reader.readAsDataURL(file);
        } else {
            // Fallback to regular fetch (with resume capability)
            console.log('Service Worker not available, using fetch with resume capability');
            
            // Save file to localStorage for potential continuation
            if (browser) {
                try {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        if (e.target && typeof e.target.result === 'string') {
                            localStorage.setItem(STORAGE_KEYS.UPLOADED_FILE + '_data', e.target.result);
                            localStorage.setItem(STORAGE_KEYS.UPLOADED_FILE + '_name', file.name);
                            console.log('File saved to localStorage for potential resume');
                        }
                    };
                    reader.readAsDataURL(file);
                } catch (e) {
                    console.error('Failed to save file:', e);
                }
            }

            try {
                const formData = new FormData();
                formData.append('logo', file);

                // Use fetch with keepalive to help it continue
                const response = await fetch('/api/generate-seal', {
                    method: 'POST',
                    body: formData,
                    keepalive: true
                });

                if (response.ok) {
                    const data = await response.json();
                    generatedImage = data.image;
                    hasUploadedFile = true;
                    showRetryButton = false;
                    await saveState(); // Save to both local and cloud, clears generation flags
                    console.log('Generation completed successfully');
                } else {
                    const errorText = await response.text();
                    console.error('Failed to generate seal:', response.status, errorText);
                    // Don't clear IS_GENERATING flag - let resume logic handle retry
                }
            } catch (error) {
                console.error('Error generating image (may have been cancelled):', error);
                // Don't clear IS_GENERATING flag - resume logic will handle it
                console.log('Generation state saved for resume on return');
            } finally {
                // Only update local state, don't clear IS_GENERATING unless we succeeded
                if (generatedImage) {
                    isGenerating = false;
                    stopLoadingAnimation();
                    await saveState();
                } else {
                    // Keep the loading state for when user returns
                    isGenerating = false;
                    stopLoadingAnimation();
                }
            }
        }
    }

    /**
     * @param {Event} event
     */
    async function handleFileUpload(event) {
        const target = event.target;
        if (!target || !(target instanceof HTMLInputElement) || !target.files) {
            return;
        }
        let file = target.files[0];
        if (file) {
            try {
                // Reset retry state
                showRetryButton = false;
                
                // Convert SVG to PNG if needed
                if (file.type === 'image/svg+xml') {
                    file = await convertSvgToPng(file);
                }

                uploadedLogo = URL.createObjectURL(file);
                hasUploadedFile = true;
                saveState();

                // Start background generation (non-blocking)
                generateImageInBackground(file);
            } catch (error) {
                console.error('Error uploading file:', error);
                alert('An error occurred. Please try again.');
            } finally {
                // Reset file input to allow re-uploading
                if (fileInput) {
                    fileInput.value = '';
                }
            }
        }
    }

    // Listen for Service Worker messages
    function setupServiceWorkerListener() {
        if (!browser || !('serviceWorker' in navigator)) return;
        
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'IMAGE_GENERATED') {
                console.log('Received generated image from Service Worker');
                generatedImage = event.data.image;
                hasUploadedFile = true;
                isGenerating = false;
                showRetryButton = false;
                stopLoadingAnimation();
                saveState();
            } else if (event.data.type === 'IMAGE_GENERATION_FAILED') {
                console.error('Service Worker generation failed:', event.data.error);
                isGenerating = false;
                stopLoadingAnimation();
                showRetryButton = true;
            } else if (event.data.type === 'CACHED_GENERATION_RESULT') {
                console.log('Found cached generation result from Service Worker');
                generatedImage = event.data.image;
                hasUploadedFile = true;
                showRetryButton = false;
                saveState();
            }
        });
    }

    // Load saved state on mount
    onMount(async () => {
        setupServiceWorkerListener();
        
        // Wait for Service Worker to be ready and check for cached results
        if (browser && 'serviceWorker' in navigator) {
            try {
                // Wait for Service Worker to be ready
                const registration = await navigator.serviceWorker.ready;
                console.log('Service Worker is ready');
                
                // Give it a moment to fully activate
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Check for cached results
                const controller = navigator.serviceWorker.controller;
                if (controller) {
                    console.log('Checking for cached generation result...');
                    controller.postMessage({
                        type: 'CHECK_GENERATION_RESULT'
                    });
                } else {
                    console.log('No Service Worker controller yet');
                }
            } catch (e) {
                console.warn('Service Worker not available:', e);
            }
        }
        
        await loadState();
    });
</script>

<section class="screen active" id="home">
    <div class="hero">
        <div class="hero-content">
            <h1>Elegant Bulk Mailing<br>with <span class="highlight">Wax Sealed</span> Letters</h1>
            <p>Make every letter memorable with custom wax seals featuring your logo. We print, seal, and mail the letters for you.</p>
            <button onclick={startNewCampaign} class="btn-primary" style="text-decoration: none;">Start Your Campaign</button>
        </div>
        <div class="hero-image">
            {#if hasUploadedFile}
                <h3 class="preview-heading">How it looks on your letter:</h3>
                <p class="preview-subheading">Wax Sealed Letter</p>
            {/if}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="real-image-container" onclick={handleImageClick}>
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
                {:else if showRetryButton}
                    <div class="retry-overlay">
                        <span>Generation failed</span>
                        <button onclick={retryGeneration} class="btn-retry">Retry</button>
                        <button onclick={handleImageClick} class="btn-upload-new">Upload New Logo</button>
                    </div>
                {:else}
                    <div class="upload-hint-overlay">
                        <span>Click to {generatedImage ? 'change' : 'add'} your logo</span>
                    </div>
                {/if}
            </div>
            <input 
                type="file" 
                accept="image/*,image/svg+xml" 
                bind:this={fileInput} 
                onchange={handleFileUpload} 
                style="display: none;"
            >
            {#if generatedImage}
                <p class="ai-disclaimer">This is AI-generated and won't show the actual wax seal.</p>
            {/if}
        </div>
    </div>

    <div class="features">
        <h2>Why Choose WaxSeal Mail?</h2>
        <div class="feature-grid">
            <div class="feature-card">
                <div class="feature-icon">✦</div>
                <h3>Custom Wax Seals</h3>
                <p>Upload your logo or design and we'll create beautiful wax seals for every letter.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">✉</div>
                <h3>Bulk Processing</h3>
                <p>Send hundreds or thousands of personalized letters with ease.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">✎</div>
                <h3>Custom Messages</h3>
                <p>Write your own letter content with personalization options.</p>
            </div>
        </div>
    </div>

    <div class="about-us">
        <div class="about-content">
            <h2>Our Story</h2>
            <p>
                We started in a small apartment, sending letters for another business idea. That's when I discovered that the personal touch of a wax seal made the biggest difference in response rates.
            </p>
            <p>
                I started making simple systems to produce as many wax seals as possible by hand. What began as a manual process has now advanced into a sophisticated operation capable of handling huge bulk mail orders, while maintaining that authentic, hand-crafted feel.
            </p>
        </div>
        <div class="about-images">
            <div class="polaroid rotate-left">
                <img src="/selfy_with_letter.png" alt="Me with a letter">
            </div>
            <div class="polaroid rotate-right">
                <img src="/candid_wax_seal_making.png" alt="Wax seal process">
            </div>
            <div class="polaroid rotate-left">
                <img src="/candid_letter_making.PNG" alt="Making letters">
            </div>
        </div>
    </div>

    <div class="showcase">
        <h2>See What's Possible</h2>
        <div class="showcase-grid">
            <div class="showcase-item">
                <img src="/wedding_invitation.png" alt="Wedding Invitations" class="showcase-img">
                <p>Wedding Invitations</p>
            </div>
            <div class="showcase-item">
                <img src="/corporate_letter.png" alt="Corporate Letters" class="showcase-img">
                <p>Corporate Letters</p>
            </div>
            <div class="showcase-item">
                <img src="/holiday_card.png" alt="Holiday Cards" class="showcase-img">
                <p>Holiday Cards</p>
            </div>
        </div>
    </div>

    <div class="cta-section">
        <h2>Ready to Make an Impression?</h2>
        <p>Start your bulk mailing campaign today with custom wax-sealed letters.</p>
        <button onclick={startNewCampaign} class="btn-primary large" style="text-decoration: none;">Get Started Now</button>
    </div>

    <!-- Contact Form -->
    <ContactForm />
</section>

<style>
    .real-image-container {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        max-width: 600px; /* Increased for larger letter image */
        max-height: 800px; /* Increased for larger letter image */
        margin: 0 auto;
        cursor: pointer;
        transition: transform 0.3s;
        border-radius: 10px;
        overflow: hidden;
        background: transparent; /* Ensure no background issues */
    }

    .real-image-container:hover {
        transform: scale(1.02);
    }

    .real-image-container:hover .upload-hint-overlay {
        opacity: 1;
    }

    .hero-image {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
        padding: 1rem;
    }

    .preview-heading {
        font-size: 1.5rem;
        color: var(--primary-color);
        margin-bottom: 0.5rem;
        text-align: center;
        font-weight: 600;
    }

    .preview-subheading {
        font-size: 1.2rem;
        color: var(--text-color);
        margin-bottom: 1.5rem;
        text-align: center;
        font-weight: 500;
    }

    .hero-img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain; /* Ensure image fits within container without distortion */
        filter: drop-shadow(5px 5px 5px rgba(0,0,0,0.2));
    }

    /* .wax-seal-overlay removed */

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

    .upload-hint-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s;
        border-radius: 10px;
        pointer-events: none;
    }

    .upload-hint-overlay span {
        color: white;
        font-weight: bold;
        background: rgba(0,0,0,0.6);
        padding: 0.5rem 1rem;
        border-radius: 20px;
    }

    .retry-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(220, 53, 69, 0.9);
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        padding: 2rem;
    }

    .retry-overlay span {
        color: white;
        font-weight: bold;
        font-size: 1.2rem;
    }

    .btn-retry,
    .btn-upload-new {
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        font-weight: bold;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;
    }

    .btn-retry {
        background: white;
        color: var(--error-color, #dc3545);
    }

    .btn-retry:hover {
        background: #f8f9fa;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }

    .btn-upload-new {
        background: transparent;
        color: white;
        border: 2px solid white;
    }

    .btn-upload-new:hover {
        background: rgba(255,255,255,0.2);
        transform: translateY(-2px);
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

    .about-us {
        padding: 6rem 2rem;
        max-width: 1200px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4rem;
        align-items: center;
    }

    .about-content h2 {
        font-size: 3rem;
        color: var(--primary-color);
        margin-bottom: 2rem;
    }

    .about-content p {
        font-size: 1.3rem;
        margin-bottom: 1.5rem;
        color: var(--text-color);
    }

    .about-images {
        position: relative;
        height: 500px;
        width: 100%;
    }

    .polaroid {
        background: white;
        padding: 1rem 1rem 3rem 1rem;
        box-shadow: var(--shadow);
        text-align: center;
        transition: all 0.3s ease;
        border: 1px solid #ddd;
        position: absolute;
        width: 280px;
        max-width: 90%;
    }

    .polaroid:nth-child(1) {
        top: 0;
        left: 0;
        z-index: 1;
        transform: rotate(-8deg);
    }

    .polaroid:nth-child(2) {
        top: 80px;
        left: 50%;
        transform: translateX(-50%) rotate(5deg);
        z-index: 2;
    }

    .polaroid:nth-child(3) {
        top: 160px;
        right: 0;
        transform: rotate(-6deg);
        z-index: 3;
    }

    .polaroid:hover {
        transform: scale(1.1) rotate(0deg) !important;
        z-index: 10 !important;
        box-shadow: var(--shadow-lg);
    }

    .polaroid img {
        width: 100%;
        height: auto;
        display: block;
        margin-bottom: 0.5rem;
        filter: sepia(0.2);
    }

    .polaroid span {
        font-family: 'Patrick Hand', cursive;
        color: #555;
        font-size: 1.2rem;
    }

    .rotate-left { transform: rotate(-3deg); }
    .rotate-right { transform: rotate(3deg); }

    .showcase-img {
        width: 100%;
        height: 300px;
        object-fit: contain;
        margin-bottom: 1rem;
    }

    @media (max-width: 768px) {
        .about-us {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 2rem;
        }

        .about-images {
            height: 600px;
        }

        .polaroid {
            width: 220px;
        }

        .polaroid:nth-child(1) {
            top: 0;
            left: 50%;
            transform: translateX(-50%) rotate(-8deg);
        }

        .polaroid:nth-child(2) {
            top: 180px;
            left: 50%;
            transform: translateX(-50%) rotate(5deg);
        }

        .polaroid:nth-child(3) {
            top: 360px;
            left: 50%;
            transform: translateX(-50%) rotate(-6deg);
        }
        
        .hero {
            grid-template-columns: 1fr;
            text-align: center;
        }
    }
</style>
