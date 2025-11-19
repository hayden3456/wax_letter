// WaxSeal Mail - Main Application JavaScript

// State Management
const appState = {
    stampImage: null,
    addresses: [],
    letter: {
        subject: 'Dear {{FirstName}},',
        body: '',
        closing: 'Sincerely,',
        signature: ''
    },
    currentStep: 0
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadFromStorage();
    initializeEventListeners();
    updateLetterPreview();
});

// Storage Functions
function saveToStorage() {
    try {
        localStorage.setItem('waxseal_state', JSON.stringify(appState));
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }
}

function loadFromStorage() {
    try {
        const saved = localStorage.getItem('waxseal_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(appState, parsed);

            // Restore UI state if we have saved data
            if (appState.stampImage) {
                document.getElementById('stampPreviewImg').src = appState.stampImage;
                document.getElementById('stampPreviewSection').style.display = 'block';
                document.getElementById('step1Next').disabled = false;
            }

            if (appState.addresses.length > 0) {
                updateAddressDisplay();
                document.getElementById('step2Next').disabled = false;
            }

            if (appState.letter.body) {
                document.getElementById('letterSubject').value = appState.letter.subject;
                document.getElementById('letterBody').value = appState.letter.body;
                document.getElementById('letterClosing').value = appState.letter.closing;
                document.getElementById('letterSignature').value = appState.letter.signature;
                document.getElementById('step3Next').disabled = false;
            }
        }
    } catch (e) {
        console.error('Failed to load from localStorage:', e);
    }
}

function resetCampaign() {
    localStorage.removeItem('waxseal_state');
    Object.assign(appState, {
        stampImage: null,
        addresses: [],
        letter: {
            subject: 'Dear {{FirstName}},',
            body: '',
            closing: 'Sincerely,',
            signature: ''
        },
        currentStep: 0
    });
    location.reload();
}

// Screen Navigation
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    // Handle progress bar visibility
    const progressContainer = document.getElementById('progressContainer');
    if (screenId === 'home' || screenId === 'wip') {
        progressContainer.classList.remove('visible');
    } else {
        progressContainer.classList.add('visible');
        updateProgressBar(screenId);
    }

    // Scroll to top
    window.scrollTo(0, 0);
}

function updateProgressBar(screenId) {
    const stepMap = {
        'step1': 1,
        'step2': 2,
        'step3': 3,
        'step4': 4
    };

    const currentStep = stepMap[screenId] || 1;

    document.querySelectorAll('.progress-step').forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        step.classList.remove('active', 'completed');

        if (stepNum < currentStep) {
            step.classList.add('completed');
        } else if (stepNum === currentStep) {
            step.classList.add('active');
        }
    });
}

// Step Navigation Functions
function goToStep2() {
    if (appState.stampImage) {
        showScreen('step2');
    }
}

function goToStep3() {
    if (appState.addresses.length > 0) {
        showScreen('step3');
    }
}

function goToStep4() {
    // Save letter content
    appState.letter.subject = document.getElementById('letterSubject').value;
    appState.letter.body = document.getElementById('letterBody').value;
    appState.letter.closing = document.getElementById('letterClosing').value;
    appState.letter.signature = document.getElementById('letterSignature').value;
    saveToStorage();

    if (appState.letter.body.trim()) {
        populateReviewPage();
        showScreen('step4');
    }
}

// Event Listeners
function initializeEventListeners() {
    // Stamp Upload
    const stampUploadArea = document.getElementById('stampUploadArea');
    const stampInput = document.getElementById('stampInput');

    stampUploadArea.addEventListener('click', () => stampInput.click());
    stampUploadArea.addEventListener('dragover', handleDragOver);
    stampUploadArea.addEventListener('dragleave', handleDragLeave);
    stampUploadArea.addEventListener('drop', (e) => handleFileDrop(e, 'stamp'));
    stampInput.addEventListener('change', (e) => handleStampUpload(e.target.files[0]));

    // CSV Upload
    const csvUploadArea = document.getElementById('csvUploadArea');
    const csvInput = document.getElementById('csvInput');

    csvUploadArea.addEventListener('click', () => csvInput.click());
    csvUploadArea.addEventListener('dragover', handleDragOver);
    csvUploadArea.addEventListener('dragleave', handleDragLeave);
    csvUploadArea.addEventListener('drop', (e) => handleFileDrop(e, 'csv'));
    csvInput.addEventListener('change', (e) => handleCSVUpload(e.target.files[0]));

    // Letter composer inputs
    const letterInputs = ['letterSubject', 'letterBody', 'letterClosing', 'letterSignature'];
    letterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', () => {
                updateLetterPreview();
                validateLetterContent();
            });
        }
    });
}

// Drag and Drop Handlers
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('dragover');
}

function handleFileDrop(e, type) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        if (type === 'stamp') {
            handleStampUpload(files[0]);
        } else if (type === 'csv') {
            handleCSVUpload(files[0]);
        }
    }
}

// Stamp Upload Handler
function handleStampUpload(file) {
    if (!file) return;

    const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload an SVG, PNG, or JPG file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        appState.stampImage = e.target.result;
        saveToStorage();

        // Update preview
        document.getElementById('stampPreviewImg').src = appState.stampImage;
        document.getElementById('stampPreviewSection').style.display = 'block';
        document.getElementById('step1Next').disabled = false;
    };
    reader.readAsDataURL(file);
}

// CSV Upload Handler
function handleCSVUpload(file) {
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('Please upload a CSV file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const csvData = e.target.result;
        parseCSV(csvData);
    };
    reader.readAsText(file);
}

// CSV Parser
function parseCSV(csvData) {
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
        showValidationError('CSV file must contain a header row and at least one data row.');
        return;
    }

    // Parse header
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());

    // Validate required fields
    const validation = validateCSVHeaders(headers);
    if (!validation.valid) {
        showValidationError(validation.message);
        return;
    }

    // Parse data rows
    const addresses = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const address = {};
            headers.forEach((header, index) => {
                address[header] = values[index].trim();
            });

            // Normalize address data
            const normalized = normalizeAddress(address, headers);
            if (normalized) {
                addresses.push(normalized);
            }
        }
    }

    if (addresses.length === 0) {
        showValidationError('No valid addresses found in the CSV file.');
        return;
    }

    appState.addresses = addresses;
    saveToStorage();
    showCSVPreview(headers, addresses);
    document.getElementById('step2Next').disabled = false;
    showValidationSuccess(`Successfully loaded ${addresses.length} addresses.`);
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);

    return result.map(val => val.replace(/^"|"$/g, '').trim());
}

function validateCSVHeaders(headers) {
    // Check for name fields
    const hasFullName = headers.includes('name') || headers.includes('fullname') || headers.includes('full name');
    const hasFirstLast = headers.includes('firstname') || headers.includes('first name') || headers.includes('first');
    const hasLastName = headers.includes('lastname') || headers.includes('last name') || headers.includes('last');

    const hasName = hasFullName || (hasFirstLast && hasLastName) || hasFirstLast;

    // Check for address fields
    const hasFullAddress = headers.includes('address') || headers.includes('full address');
    const hasStreet = headers.includes('street') || headers.includes('street address') || headers.includes('address1');
    const hasCity = headers.includes('city');
    const hasState = headers.includes('state');
    const hasZip = headers.includes('zip') || headers.includes('zipcode') || headers.includes('zip code') || headers.includes('postal');

    const hasAddress = hasFullAddress || (hasStreet && hasCity);

    if (!hasName) {
        return {
            valid: false,
            message: 'CSV must include a Name column (or First Name/Last Name columns).'
        };
    }

    if (!hasAddress) {
        return {
            valid: false,
            message: 'CSV must include an Address column (or Street, City, State, ZIP columns).'
        };
    }

    return { valid: true };
}

function normalizeAddress(address, headers) {
    const normalized = {
        firstName: '',
        lastName: '',
        fullName: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        fullAddress: ''
    };

    // Extract name
    if (address['name'] || address['fullname'] || address['full name']) {
        normalized.fullName = address['name'] || address['fullname'] || address['full name'];
        const nameParts = normalized.fullName.split(' ');
        normalized.firstName = nameParts[0] || '';
        normalized.lastName = nameParts.slice(1).join(' ') || '';
    } else {
        normalized.firstName = address['firstname'] || address['first name'] || address['first'] || '';
        normalized.lastName = address['lastname'] || address['last name'] || address['last'] || '';
        normalized.fullName = `${normalized.firstName} ${normalized.lastName}`.trim();
    }

    // Extract address
    if (address['address'] || address['full address']) {
        normalized.fullAddress = address['address'] || address['full address'];
    } else {
        normalized.street = address['street'] || address['street address'] || address['address1'] || '';
        normalized.city = address['city'] || '';
        normalized.state = address['state'] || '';
        normalized.zip = address['zip'] || address['zipcode'] || address['zip code'] || address['postal'] || '';
        normalized.fullAddress = `${normalized.street}, ${normalized.city}, ${normalized.state} ${normalized.zip}`.trim();
    }

    // Validate that we have required data
    if (!normalized.fullName || (!normalized.fullAddress && !normalized.street)) {
        return null;
    }

    return normalized;
}

function showCSVPreview(headers, addresses) {
    document.getElementById('csvPreview').style.display = 'block';
    document.getElementById('addressCount').textContent = addresses.length;

    const thead = document.querySelector('#addressTable thead');
    const tbody = document.querySelector('#addressTable tbody');

    // Clear existing content
    thead.innerHTML = '';
    tbody.innerHTML = '';

    // Create header row
    const headerRow = document.createElement('tr');
    ['Name', 'Address'].forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Create data rows (show first 10)
    const displayAddresses = addresses.slice(0, 10);
    displayAddresses.forEach(address => {
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.textContent = address.fullName;
        row.appendChild(nameCell);

        const addressCell = document.createElement('td');
        addressCell.textContent = address.fullAddress;
        row.appendChild(addressCell);

        tbody.appendChild(row);
    });

    if (addresses.length > 10) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 2;
        cell.textContent = `... and ${addresses.length - 10} more`;
        cell.style.textAlign = 'center';
        cell.style.fontStyle = 'italic';
        row.appendChild(cell);
        tbody.appendChild(row);
    }
}

// Manual Address Entry
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    if (tabName === 'csv') {
        document.querySelector('.tab-btn:first-child').classList.add('active');
        document.getElementById('csvTab').classList.add('active');
    } else {
        document.querySelector('.tab-btn:last-child').classList.add('active');
        document.getElementById('manualTab').classList.add('active');
    }
}

function addManualAddress() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const street = document.getElementById('streetAddress').value.trim();
    const city = document.getElementById('city').value.trim();
    const state = document.getElementById('state').value.trim();
    const zip = document.getElementById('zipCode').value.trim();

    // Validate
    if (!firstName || !lastName || !street || !city || !state || !zip) {
        showValidationError('Please fill in all required fields.');
        return;
    }

    const address = {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        street,
        city,
        state,
        zip,
        fullAddress: `${street}, ${city}, ${state} ${zip}`
    };

    appState.addresses.push(address);
    saveToStorage();

    // Clear form
    document.getElementById('firstName').value = '';
    document.getElementById('lastName').value = '';
    document.getElementById('streetAddress').value = '';
    document.getElementById('city').value = '';
    document.getElementById('state').value = '';
    document.getElementById('zipCode').value = '';

    // Update display
    updateAddressDisplay();
    document.getElementById('step2Next').disabled = false;
    hideValidation();
}

function updateAddressDisplay() {
    const container = document.getElementById('manualAddresses');
    const list = document.getElementById('addressList');
    const count = document.getElementById('manualAddressCount');

    if (appState.addresses.length > 0) {
        container.style.display = 'block';
        count.textContent = appState.addresses.length;

        list.innerHTML = '';
        appState.addresses.forEach((address, index) => {
            const item = document.createElement('div');
            item.className = 'address-item';
            item.innerHTML = `
                <div class="address-item-content">
                    <div class="address-item-name">${address.fullName}</div>
                    <div class="address-item-address">${address.fullAddress}</div>
                </div>
                <button onclick="removeAddress(${index})" title="Remove">×</button>
            `;
            list.appendChild(item);
        });
    } else {
        container.style.display = 'none';
    }
}

function removeAddress(index) {
    appState.addresses.splice(index, 1);
    saveToStorage();
    updateAddressDisplay();

    if (appState.addresses.length === 0) {
        document.getElementById('step2Next').disabled = true;
    }
}

// Validation Messages
function showValidationError(message) {
    const validationEl = document.getElementById('addressValidation');
    validationEl.textContent = message;
    validationEl.className = 'validation-message error';
}

function showValidationSuccess(message) {
    const validationEl = document.getElementById('addressValidation');
    validationEl.textContent = message;
    validationEl.className = 'validation-message success';
}

function hideValidation() {
    const validationEl = document.getElementById('addressValidation');
    validationEl.className = 'validation-message';
}

// Letter Composer
function insertPlaceholder(placeholder) {
    const textarea = document.getElementById('letterBody');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    textarea.value = text.substring(0, start) + placeholder + text.substring(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + placeholder.length;

    updateLetterPreview();
    validateLetterContent();
}

function updateLetterPreview() {
    const subject = document.getElementById('letterSubject').value;
    const body = document.getElementById('letterBody').value;
    const closing = document.getElementById('letterClosing').value;
    const signature = document.getElementById('letterSignature').value;

    // Replace placeholders with sample data for preview
    const sampleData = {
        '{{FirstName}}': 'John',
        '{{LastName}}': 'Doe',
        '{{FullName}}': 'John Doe',
        '{{City}}': 'New York'
    };

    let previewSubject = subject;
    let previewBody = body;

    Object.keys(sampleData).forEach(key => {
        previewSubject = previewSubject.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), sampleData[key]);
        previewBody = previewBody.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), sampleData[key]);
    });

    document.querySelector('.preview-greeting').textContent = previewSubject;
    document.querySelector('.preview-body').textContent = previewBody;
    document.querySelector('.preview-closing').textContent = closing;
    document.querySelector('.preview-signature').textContent = signature;
}

function validateLetterContent() {
    const body = document.getElementById('letterBody').value.trim();
    document.getElementById('step3Next').disabled = !body;
}

// Review Page
function populateReviewPage() {
    // Seal preview
    if (appState.stampImage) {
        document.getElementById('reviewSealImg').src = appState.stampImage;
    }

    // Address count
    document.getElementById('reviewAddressCount').textContent = appState.addresses.length;

    // Address preview
    const previewContainer = document.getElementById('reviewAddressPreview');
    previewContainer.innerHTML = '';
    const previewAddresses = appState.addresses.slice(0, 3);
    previewAddresses.forEach(address => {
        const div = document.createElement('div');
        div.textContent = `${address.fullName} - ${address.city || ''}`;
        previewContainer.appendChild(div);
    });
    if (appState.addresses.length > 3) {
        const more = document.createElement('div');
        more.textContent = `... and ${appState.addresses.length - 3} more`;
        more.style.fontStyle = 'italic';
        previewContainer.appendChild(more);
    }

    // Letter content
    const sampleData = {
        '{{FirstName}}': 'John',
        '{{LastName}}': 'Doe',
        '{{FullName}}': 'John Doe',
        '{{City}}': 'New York'
    };

    let subject = appState.letter.subject;
    let body = appState.letter.body;

    Object.keys(sampleData).forEach(key => {
        subject = subject.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), sampleData[key]);
        body = body.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), sampleData[key]);
    });

    document.querySelector('.review-greeting').textContent = subject;
    document.querySelector('.review-body').textContent = body;
    document.querySelector('.review-closing').textContent = appState.letter.closing;
    document.querySelector('.review-signature').textContent = appState.letter.signature;

    // Summary stats
    document.getElementById('summaryLetters').textContent = appState.addresses.length;
    document.getElementById('summarySeals').textContent = appState.addresses.length;
}

// Start Campaign
function startCampaign() {
    // Update WIP screen
    document.getElementById('wipLetters').textContent = appState.addresses.length;

    // Show WIP screen
    showScreen('wip');
}
