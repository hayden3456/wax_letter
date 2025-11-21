<script>
  let submitting = false;
  let submitted = false;
  let error = '';

  /**
   * @param {Event} event
   */
  async function handleSubmit(event) {
    event.preventDefault();
    submitting = true;
    error = '';

    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const formData = new FormData(form);
    
    // Format the message nicely
    const message = `Name: ${formData.get('name')}
Email: ${formData.get('email')}
Project Type: ${formData.get('project_type')}
Quantity: ${formData.get('quantity')}

Message:
${formData.get('message')}`;

    const data = {
      access_key: import.meta.env.VITE_WEB3FORMS_KEY || '430289be-c656-4c27-a9fb-304940c74425',
      name: formData.get('name'),
      email: formData.get('email'),
      message: message,
      subject: 'Contact Form Submission from Wax Letter',
      from_name: 'Wax Letter Contact Form'
    };

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        submitted = true;
        form.reset();
      } else {
        error = result.message || 'Something went wrong. Please try again.';
      }
    } catch (err) {
      error = 'Something went wrong. Please try again.';
    } finally {
      submitting = false;
    }
  }
</script>

<section id="contact" class="contact-section">
  <div class="contact-container">
    <div class="contact-header">
      <h2>Let's Talk About Your Project</h2>
      <p>Have questions or ready to start your campaign? We'd love to hear from you!</p>
    </div>
    
    {#if submitted}
      <div class="success-message">
        <div class="success-icon">✓</div>
        <p class="success-title">Thank you for reaching out!</p>
        <p class="success-text">We've received your message and will get back to you within 24 hours.</p>
      </div>
    {:else}
      <form on:submit={handleSubmit} class="contact-form">
        {#if error}
          <div class="error-message">
            <p>{error}</p>
          </div>
        {/if}

        <div class="form-row">
          <div class="form-group">
            <label for="name">Your Name</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              disabled={submitting}
              placeholder="John Doe"
            />
          </div>

          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              disabled={submitting}
              placeholder="john@example.com"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="project_type">Project Type</label>
            <select
              id="project_type"
              name="project_type"
              required
              disabled={submitting}
            >
              <option value="">Select one...</option>
              <option value="wedding">Wedding Invitations</option>
              <option value="corporate">Corporate Letters</option>
              <option value="holiday">Holiday Cards</option>
              <option value="thank_you">Thank You Notes</option>
              <option value="marketing">Marketing Campaign</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div class="form-group">
            <label for="quantity">Estimated Quantity</label>
            <select
              id="quantity"
              name="quantity"
              required
              disabled={submitting}
            >
              <option value="">Select range...</option>
              <option value="1-50">1-50 letters</option>
              <option value="51-100">51-100 letters</option>
              <option value="101-250">101-250 letters</option>
              <option value="251-500">251-500 letters</option>
              <option value="500+">500+ letters</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="message">Tell us about your project</label>
          <textarea
            id="message"
            name="message"
            rows="5"
            required
            disabled={submitting}
            placeholder="What's the occasion? When do you need the letters? Any special requirements?"
          ></textarea>
        </div>

        <div class="form-submit">
          <button
            type="submit"
            disabled={submitting}
            class="btn-primary large"
          >
            {submitting ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </form>
    {/if}
  </div>
</section>

<style>
  .contact-section {
    padding: 6rem 2rem;
    background-color: var(--card-background);
    border-top: 2px solid var(--border-color);
  }

  .contact-container {
    max-width: 900px;
    margin: 0 auto;
  }

  .contact-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .contact-header h2 {
    font-size: 3.5rem;
    color: var(--primary-color);
    margin-bottom: 1rem;
  }

  .contact-header p {
    font-size: 1.5rem;
    color: var(--text-light);
  }

  .contact-form {
    background: white;
    padding: 2.5rem;
    border: 2px solid var(--border-color);
    border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
    box-shadow: var(--shadow-lg);
  }

  .form-group select {
    width: 100%;
    padding: 1.1rem;
    border: 2px solid var(--border-color);
    border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
    font-family: inherit;
    font-size: 1.4rem;
    transition: all 0.3s;
    background: white;
    cursor: pointer;
  }

  .form-group select:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 3px 3px 0px rgba(152, 41, 42, 0.1);
    transform: scale(1.01);
  }

  .form-group select:disabled,
  .form-group input:disabled,
  .form-group textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .error-message {
    background: #ffe6e6;
    color: var(--error-color);
    border: 2px solid var(--error-color);
    padding: 1.5rem;
    border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
    margin-bottom: 2rem;
    font-weight: bold;
    text-align: center;
    font-size: 1.5rem;
  }

  .success-message {
    background: white;
    padding: 5rem 4rem;
    border: 2px solid var(--success-color);
    border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
    box-shadow: var(--shadow-lg);
    text-align: center;
  }

  .success-icon {
    width: 80px;
    height: 80px;
    background: var(--success-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    font-weight: bold;
    margin: 0 auto 2rem;
    box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.2);
  }

  .success-title {
    font-size: 2rem;
    font-weight: bold;
    color: var(--primary-color);
    margin-bottom: 1rem;
  }

  .success-text {
    font-size: 1.2rem;
    color: var(--text-light);
  }

  .form-submit {
    margin-top: 2rem;
    text-align: center;
  }

  @media (max-width: 768px) {
    .contact-header h2 {
      font-size: 2rem;
    }

    .contact-header p {
      font-size: 1.1rem;
    }

    .contact-form {
      padding: 2rem;
    }

    .form-row {
      grid-template-columns: 1fr;
    }
  }
</style>

