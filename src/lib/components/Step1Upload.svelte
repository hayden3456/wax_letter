<script>
    import { appState } from '$lib/stores';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let stampInput;

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

    function handleStampUpload(file) {
        if (!file) return;

        const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload an SVG, PNG, or JPG file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            $appState.stampImage = e.target.result;
        };
        reader.readAsDataURL(file);
    }
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
                    <img src="/single_letter_no_bg.png" alt="Wax Sealed Letter" class="hero-img">
                    <div class="mockup-seal-overlay">
                        <img src={$appState.stampImage} alt="Your logo on letter">
                    </div>
                </div>
            </div>

            <button class="btn-secondary" on:click={() => stampInput.click()}>Change Image</button>
        </div>
    {/if}

    <div class="step-actions">
        <a href="/" class="btn-secondary" style="text-decoration: none; display: inline-block; text-align: center;">Cancel</a>
        <button class="btn-primary" on:click={() => dispatch('next')} disabled={!$appState.stampImage}>Next: Add Addresses</button>
    </div>
</div>
