<svelte:head>
    <title>Wax Seal Mailing Service - Custom Bulk Mail with Elegance</title>
</svelte:head>

<script>
    import { fade } from 'svelte/transition';
    import ContactForm from '$lib/components/ContactForm.svelte';

    let fileInput;
    let uploadedLogo = null;

    function handleImageClick() {
        fileInput.click();
    }

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

    async function handleFileUpload(event) {
        let file = event.target.files[0];
        if (file) {
            isGenerating = true;
            startLoadingAnimation();

            try {
                // Convert SVG to PNG if needed
                if (file.type === 'image/svg+xml') {
                    file = await convertSvgToPng(file);
                }

                uploadedLogo = URL.createObjectURL(file);

                const formData = new FormData();
                formData.append('logo', file);

                const response = await fetch('/api/generate-seal', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    generatedImage = data.image;
                } else {
                    console.error('Failed to generate seal');
                    alert('Failed to generate seal. Please try again.');
                }
            } catch (error) {
                console.error('Error uploading file:', error);
                alert('An error occurred. Please try again.');
            } finally {
                isGenerating = false;
                stopLoadingAnimation();
                // Reset file input to allow re-uploading
                fileInput.value = '';
            }
        }
    }
</script>

<section class="screen active" id="home">
    <div class="hero">
        <div class="hero-content">
            <h1>Elegant Bulk Mailing<br>with <span class="highlight">Wax Sealed</span> Letters</h1>
            <p>Make every letter memorable with custom wax seals featuring your logo. We print, seal, and mail the letters for you.</p>
            <a href="/campaign/step/1" class="btn-primary" style="text-decoration: none;">Start Your Campaign</a>
        </div>
        <div class="hero-image">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="real-image-container" on:click={handleImageClick}>
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
                on:change={handleFileUpload} 
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
        <a href="/campaign/step/1" class="btn-primary large" style="text-decoration: none;">Get Started Now</a>
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
        justify-content: center;
        align-items: center;
        width: 100%;
        padding: 1rem;
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
