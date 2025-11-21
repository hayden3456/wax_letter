<svelte:head>
    <title>Pricing - Wax Letter</title>
</svelte:head>

<section class="pricing-page">
    <div class="pricing-hero">
        <h1>Simple, Transparent Pricing</h1>
        <p class="subtitle">Every letter is crafted with care, sealed with elegance</p>
    </div>

    <!-- Main Pricing Card -->
    <div class="main-pricing-card">
        <div class="price-badge">
            <div class="dollar-sign">$</div>
            <div class="price-number">3</div>
            <div class="per-letter">per letter</div>
        </div>
        
        <div class="what-included">
            <h3>What's Included in Every Letter</h3>
            <div class="included-grid">
                <div class="included-item">
                    <span class="check-icon">✓</span>
                    <span>High-Quality Paper</span>
                </div>
                <div class="included-item">
                    <span class="check-icon">✓</span>
                    <span>Custom Printing</span>
                </div>
                <div class="included-item">
                    <span class="check-icon">✓</span>
                    <span>Hand-Applied Wax Seal</span>
                </div>
                <div class="included-item">
                    <span class="check-icon">✓</span>
                    <span>Premium Envelope</span>
                </div>
                <div class="included-item">
                    <span class="check-icon">✓</span>
                    <span>Full Address Printing</span>
                </div>
                <div class="included-item">
                    <span class="check-icon">✓</span>
                    <span>USPS First Class Postage</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Why $3? Breakdown Section -->
    <div class="breakdown-section">
        <h2>Why $3 Per Letter?</h2>
        <p class="breakdown-intro">We believe in transparency. Here's where every dollar goes:</p>
        
        <div class="cost-breakdown">
            <div class="breakdown-card">
                <div class="breakdown-icon">🖨️</div>
                <h4>Materials & Printing</h4>
                <div class="cost-amount">~$0.75</div>
                <p>Premium paper, envelope, ink, and professional printing for your custom message</p>
            </div>
            
            <div class="breakdown-card">
                <div class="breakdown-icon">✋</div>
                <h4>Hand-Crafted Wax Seal</h4>
                <div class="cost-amount">~$0.80</div>
                <p>Each wax seal is individually applied by hand with your custom stamp. This takes time, skill, and high-quality sealing wax</p>
            </div>
            
            <div class="breakdown-card">
                <div class="breakdown-icon">📮</div>
                <h4>Postage & Shipping</h4>
                <div class="cost-amount">~$1.10</div>
                <p>USPS First Class postage plus handling. Wax-sealed letters require special care and often extra postage</p>
            </div>
            
            <div class="breakdown-card">
                <div class="breakdown-icon">⚙️</div>
                <h4>Processing & Quality Control</h4>
                <div class="cost-amount">~$0.40</div>
                <p>Address verification, personalization, quality checks, and ensuring each letter meets our standards</p>
            </div>
        </div>

        <div class="value-proposition">
            <div class="value-content">
                <h3>The Real Value?</h3>
                <p>Your recipient doesn't just get mail, they get an <strong>experience</strong>. A wax-sealed letter stands out, gets opened first, and creates a lasting impression that digital communication simply can't match.</p>
                <p>Studies show that wax-sealed mail has a <strong>3-5x higher open rate</strong> than standard mail. That's the power of making things personal.</p>
            </div>
            <div class="value-visual">
                <div class="comparison">
                    <div class="comparison-item standard">
                        <div class="comparison-label">Standard Mail</div>
                        <div class="comparison-rate">~15%</div>
                        <div class="comparison-sublabel">Open Rate</div>
                    </div>
                    <div class="comparison-arrow">→</div>
                    <div class="comparison-item wax">
                        <div class="comparison-label">Wax Sealed</div>
                        <div class="comparison-rate">~65%</div>
                        <div class="comparison-sublabel">Open Rate</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Special Offers Section -->
    <div class="special-offers">
        <div class="offer-card bulk">
            <div class="offer-badge">💼 Bulk Orders</div>
            <h3>Sending 500+ Letters?</h3>
            <p>We offer special bulk pricing for large campaigns. Whether you're running a major marketing campaign, sending wedding invitations, or conducting outreach at scale, let's talk about how we can make it work for your budget.</p>
            <a href="/#contact" class="btn-primary">Get Bulk Pricing</a>
        </div>
        
        <div class="offer-card custom">
            <div class="offer-badge">✨ Custom Projects</div>
            <h3>Need Something Special?</h3>
            <p>We also handle non-traditional projects: oversized letters, custom paper colors, multiple wax seals, vintage stamps, specialty envelopes, and more. If you can dream it, we can probably seal it.</p>
            <a href="/#contact" class="btn-secondary">Request Custom Quote</a>
        </div>
    </div>

    <!-- CTA Section -->
    <div class="pricing-cta">
        <h2>Ready to Make an Impression?</h2>
        <p>Start your campaign today and give your recipients something they'll actually want to open.</p>
        <a href="/campaign/step/1" class="btn-primary large">Start Your Campaign</a>
    </div>
</section>

<style>
    .pricing-page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }

    .pricing-hero {
        text-align: center;
        padding: 4rem 2rem 3rem;
    }

    .pricing-hero h1 {
        font-size: 4rem;
        color: var(--primary-color);
        margin-bottom: 1rem;
        line-height: 1.1;
    }

    .subtitle {
        font-size: 1.5rem;
        color: var(--text-light);
        font-style: italic;
    }

    /* Main Pricing Card */
    .main-pricing-card {
        background: white;
        border: 3px solid var(--border-color);
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        box-shadow: var(--shadow-lg);
        padding: 3rem;
        margin: 3rem auto;
        max-width: 900px;
        transform: rotate(-0.5deg);
    }

    .price-badge {
        text-align: center;
        background: var(--primary-color);
        color: white;
        padding: 3rem;
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        margin: -5rem auto 3rem;
        max-width: 300px;
        box-shadow: var(--shadow-lg);
        transform: rotate(2deg);
        border: 3px solid var(--primary-dark);
    }

    .dollar-sign {
        font-size: 2rem;
        font-weight: bold;
    }

    .price-number {
        font-size: 6rem;
        font-weight: bold;
        line-height: 1;
        text-shadow: 3px 3px 0px rgba(0, 0, 0, 0.2);
    }

    .per-letter {
        font-size: 1.3rem;
        margin-top: 0.5rem;
        opacity: 0.9;
    }

    .what-included {
        margin-top: 3rem;
    }

    .what-included h3 {
        text-align: center;
        color: var(--primary-color);
        font-size: 2rem;
        margin-bottom: 2rem;
    }

    .included-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
    }

    .included-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: var(--card-background);
        border: 2px solid var(--border-color);
        border-radius: 15px;
        transition: transform 0.3s;
    }

    .included-item:hover {
        transform: translateX(5px);
    }

    .check-icon {
        font-size: 1.5rem;
        color: var(--success-color);
        font-weight: bold;
        background: rgba(40, 167, 69, 0.1);
        width: 35px;
        height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        flex-shrink: 0;
    }

    /* Breakdown Section */
    .breakdown-section {
        padding: 4rem 2rem;
        text-align: center;
    }

    .breakdown-section h2 {
        font-size: 3rem;
        color: var(--primary-color);
        margin-bottom: 1rem;
    }

    .breakdown-intro {
        font-size: 1.3rem;
        color: var(--text-light);
        margin-bottom: 3rem;
    }

    .cost-breakdown {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
        margin-bottom: 4rem;
    }

    .breakdown-card {
        background: white;
        border: 2px solid var(--border-color);
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        padding: 2rem;
        box-shadow: var(--shadow);
        transition: transform 0.3s;
        text-align: center;
    }

    .breakdown-card:hover {
        transform: translateY(-5px) rotate(1deg);
        box-shadow: var(--shadow-lg);
    }

    .breakdown-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .breakdown-card h4 {
        color: var(--primary-color);
        font-size: 1.3rem;
        margin-bottom: 0.5rem;
    }

    .cost-amount {
        font-size: 2rem;
        font-weight: bold;
        color: var(--secondary-color);
        margin: 1rem 0;
    }

    .breakdown-card p {
        font-size: 1rem;
        color: var(--text-light);
        line-height: 1.5;
    }

    /* Value Proposition */
    .value-proposition {
        background: var(--card-background);
        border: 3px solid var(--secondary-color);
        border-radius: 15px;
        padding: 3rem;
        margin: 4rem auto;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3rem;
        align-items: center;
    }

    .value-content h3 {
        color: var(--primary-color);
        font-size: 2rem;
        margin-bottom: 1rem;
    }

    .value-content p {
        font-size: 1.2rem;
        line-height: 1.6;
        margin-bottom: 1rem;
        text-align: left;
    }

    .comparison {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1.5rem;
    }

    .comparison-item {
        background: white;
        border: 2px solid var(--border-color);
        border-radius: 15px;
        padding: 2rem;
        min-width: 140px;
        text-align: center;
    }

    .comparison-item.wax {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-dark);
        transform: scale(1.1);
        box-shadow: var(--shadow);
    }

    .comparison-label {
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
        font-weight: bold;
    }

    .comparison-rate {
        font-size: 2.5rem;
        font-weight: bold;
        margin: 0.5rem 0;
    }

    .comparison-sublabel {
        font-size: 0.8rem;
        opacity: 0.8;
    }

    .comparison-arrow {
        font-size: 2rem;
        color: var(--primary-color);
    }

    /* Special Offers */
    .special-offers {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 2rem;
        margin: 4rem 0;
    }

    .offer-card {
        background: white;
        border: 3px solid var(--border-color);
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        padding: 3rem;
        box-shadow: var(--shadow);
        position: relative;
        transition: transform 0.3s;
    }

    .offer-card:hover {
        transform: translateY(-5px);
        box-shadow: var(--shadow-lg);
    }

    .offer-card.bulk {
        border-color: var(--accent-color);
    }

    .offer-card.custom {
        border-color: var(--secondary-color);
    }

    .offer-badge {
        display: inline-block;
        background: var(--secondary-color);
        color: var(--text-color);
        padding: 0.5rem 1.5rem;
        border-radius: 50px;
        font-weight: bold;
        margin-bottom: 1.5rem;
        border: 2px solid var(--border-color);
    }

    .offer-card.bulk .offer-badge {
        background: var(--accent-color);
        color: white;
    }

    .offer-card h3 {
        color: var(--primary-color);
        font-size: 2rem;
        margin-bottom: 1rem;
    }

    .offer-card p {
        font-size: 1.2rem;
        line-height: 1.6;
        margin-bottom: 2rem;
        color: var(--text-light);
    }

    .offer-card .btn-primary,
    .offer-card .btn-secondary {
        display: inline-block;
        text-decoration: none;
    }

    /* Pricing CTA */
    .pricing-cta {
        text-align: center;
        padding: 6rem 2rem;
        background: var(--primary-color);
        border: 3px solid var(--primary-dark);
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        color: white;
        margin: 4rem 0;
        box-shadow: var(--shadow-lg);
    }

    .pricing-cta h2 {
        font-size: 3rem;
        margin-bottom: 1rem;
        color: white;
    }

    .pricing-cta p {
        font-size: 1.5rem;
        margin-bottom: 2rem;
        opacity: 0.95;
    }

    .pricing-cta .btn-primary {
        background: var(--secondary-color);
        color: var(--text-color);
        border-color: #c4a55a;
        text-decoration: none;
    }

    .pricing-cta .btn-primary:hover {
        background: #f0d385;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .pricing-hero h1 {
            font-size: 2.5rem;
        }

        .subtitle {
            font-size: 1.2rem;
        }

        .main-pricing-card {
            padding: 2rem;
        }

        .price-badge {
            margin-top: -3rem;
        }

        .price-number {
            font-size: 4rem;
        }

        .included-grid {
            grid-template-columns: 1fr;
        }

        .breakdown-section h2 {
            font-size: 2rem;
        }

        .cost-breakdown {
            grid-template-columns: 1fr;
        }

        .value-proposition {
            grid-template-columns: 1fr;
            padding: 2rem;
        }

        .value-content p {
            text-align: center;
        }

        .comparison {
            flex-direction: column;
        }

        .comparison-arrow {
            transform: rotate(90deg);
        }

        .special-offers {
            grid-template-columns: 1fr;
        }

        .pricing-cta {
            padding: 3rem 1.5rem;
        }

        .pricing-cta h2 {
            font-size: 2rem;
        }

        .pricing-cta p {
            font-size: 1.2rem;
        }
    }
</style>

