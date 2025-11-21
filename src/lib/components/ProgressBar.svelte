<script>
    export let currentStep = 1;
</script>

<div class="progress-container visible">
    <div class="progress-bar">
        <a href="/campaign/step/1" class="progress-step {currentStep >= 1 ? 'active' : ''} {currentStep > 1 ? 'completed' : ''}" data-step="1">
            <div class="step-circle">1</div>
            <span>Upload Stamp</span>
        </a>
        <div class="progress-line"></div>
        <a href="/campaign/step/2" class="progress-step {currentStep >= 2 ? 'active' : ''} {currentStep > 2 ? 'completed' : ''}" data-step="2">
            <div class="step-circle">2</div>
            <span>Addresses</span>
        </a>
        <div class="progress-line"></div>
        <a href="/campaign/step/3" class="progress-step {currentStep >= 3 ? 'active' : ''} {currentStep > 3 ? 'completed' : ''}" data-step="3">
            <div class="step-circle">3</div>
            <span>Write Letter</span>
        </a>
        <div class="progress-line"></div>
        <a href="/campaign/step/4" class="progress-step {currentStep >= 4 ? 'active' : ''} {currentStep > 4 ? 'completed' : ''}" data-step="4">
            <div class="step-circle">4</div>
            <span>Review</span>
        </a>
    </div>
</div>
