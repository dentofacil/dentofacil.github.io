document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // WIZARD STATE MACHINE
    // Tracks all user answers across the 5 steps before submitting
    // =========================================================================
    const state = {
        treatment: null,   // Step 1
        budget: null,      // Step 2
        urgency: null,     // Step 3
        seguro: null,      // Step 4
        name: null,        // Step 5
        location: null,    // Step 6 (Comuna/Ciudad)
        country: null      // Step 6 (País)
    };

    const paisInput = document.getElementById('pais-input');
    const comunaInput = document.getElementById('comuna-input');
    const nombreInput = document.getElementById('nombre-input');

    // Helper: transition between two wizard steps smoothly
    const goToStep = (fromId, toId) => {
        const from = document.getElementById(`wizard-step-${fromId}`);
        const to = document.getElementById(`wizard-step-${toId}`);
        if (!from || !to) return;
        from.classList.remove('active');
        // Allow reflow before adding active, so CSS animation triggers
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                to.classList.add('active');
                if (toId === 5) nombreInput.focus();
                if (toId === 6) paisInput ? paisInput.focus() : comunaInput.focus();
            });
        });
    };

    // =========================================================================
    // 1. TREATMENT BUTTONS — all buttons with data-next (steps 1, 2, 3)
    // =========================================================================
    document.querySelectorAll('.treatment-btn[data-next]').forEach(button => {
        button.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const nextStep = parseInt(btn.dataset.next);
            const value = btn.dataset.value;

            // Highlight selected button momentarily
            const siblingBtns = btn.closest('.treatment-grid').querySelectorAll('.treatment-btn');
            siblingBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            // Store the answer based on which step we're leaving
            if (nextStep === 2) state.treatment = value;
            if (nextStep === 3) state.budget = value;
            if (nextStep === 4) state.urgency = value;
            if (nextStep === 5) state.seguro = value;

            // Transition after brief selection feedback
            setTimeout(() => goToStep(nextStep - 1, nextStep), 280);
        });
    });

    // =========================================================================
    // 2. SMALL BACK BUTTONS (steps 2 & 3)
    // =========================================================================
    document.querySelectorAll('.btn-back-small[data-back]').forEach(btn => {
        btn.addEventListener('click', () => {
            const backStep = parseInt(btn.dataset.back);
            const currentStep = backStep + 1;
            goToStep(currentStep, backStep);
        });
    });

    // =========================================================================
    // 3. BACK BUTTON FROM STEP 4 & 5 (full-width back buttons)
    // =========================================================================
    const backToStep3 = document.getElementById('back-to-step-3');
    if (backToStep3) {
        backToStep3.addEventListener('click', () => goToStep(4, 3));
    }

    const backToStep4 = document.getElementById('back-to-step-4');
    if (backToStep4) {
        backToStep4.addEventListener('click', () => goToStep(5, 4));
    }

    const backToStep5 = document.getElementById('back-to-step-5');
    if (backToStep5) {
        backToStep5.addEventListener('click', () => goToStep(6, 5));
    }

    // =========================================================================
    // 4. NEXT BUTTON FROM STEP 5 (Nombre)
    // =========================================================================
    const btnNextStep5 = document.getElementById('btn-next-step-5');

    function submitName() {
        const nombre = nombreInput.value.trim();
        if (nombre.length < 2) {
            nombreInput.style.borderColor = 'var(--color-accent)';
            nombreInput.placeholder = 'Ingresa tu nombre';
            setTimeout(() => {
                nombreInput.style.borderColor = '';
                nombreInput.placeholder = 'Tu nombre...';
            }, 1800);
            return;
        }
        state.name = nombre;
        goToStep(5, 6);
    }

    if (btnNextStep5) btnNextStep5.addEventListener('click', submitName);
    if (nombreInput) nombreInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitName();
    });

    // =========================================================================
    // 5. SUBMIT FROM STEP 6 (location/commune)
    // =========================================================================
    const btnSubmit = document.getElementById('btn-submit-wizard');
    if (btnSubmit) {
        btnSubmit.addEventListener('click', submitWizard);
    }

    comunaInput && comunaInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitWizard();
    });

    function submitWizard() {
        const pais = paisInput ? paisInput.value.trim() : '';
        const comuna = comunaInput.value.trim();

        if (comuna.length < 2 || (paisInput && pais.length < 2)) {
            comunaInput.style.borderColor = 'var(--color-accent)';
            if (paisInput) paisInput.style.borderColor = 'var(--color-accent)';

            comunaInput.placeholder = 'Falta rellenar ubicación';
            setTimeout(() => {
                comunaInput.style.borderColor = '';
                if (paisInput) paisInput.style.borderColor = '';
                comunaInput.placeholder = 'Ej: Las Condes, Santiago...';
            }, 1800);
            return;
        }

        state.country = pais;
        state.location = comuna;

        // Change button to loading state
        const originalHTML = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Buscando...';
        btnSubmit.disabled = true;

        // === STEALTH BACKEND INGESTION ===
        console.log('Lead captured:', state);
        submitToGoogleFormsNinja(state).catch(err => console.error("Error ninja: ", err));

        setTimeout(() => {
            btnSubmit.innerHTML = originalHTML;
            btnSubmit.disabled = false;

            // Go to final WhatsApp step (step 7)
            goToStep(6, 7);
        }, 1400);
    }

    // =========================================================================
    // GOOGLE FORMS NINJA (POST OCULTO)
    // =========================================================================
    function submitToGoogleFormsNinja(stateData) {
        // Enlace de acción del formulario de Google (siempre termina en formResponse)
        const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdmpqZHk9VzcN6JyxLd-73j4eKrXt2ogggdokPhfG8DICJvSQ/formResponse";

        // IDs extraídos del Formulario Catcher
        const ENTRY_TRATAMIENTO = "entry.598799885";
        const ENTRY_PRESUPUESTO = "entry.1231370452";
        const ENTRY_URGENCIA = "entry.574891564";
        const ENTRY_NOMBRE = "entry.2114930226";
        const ENTRY_SEGURO = "entry.1647268582";
        const ENTRY_PAIS = "entry.1853272105";
        const ENTRY_UBICACION = "entry.278413523";
        const ENTRY_TELEFONO = "entry.1614612121";

        const formData = new URLSearchParams();
        formData.append(ENTRY_TRATAMIENTO, stateData.treatment || '-');
        formData.append(ENTRY_PRESUPUESTO, stateData.budget || '-');
        formData.append(ENTRY_URGENCIA, stateData.urgency || '-');
        formData.append(ENTRY_SEGURO, stateData.seguro || '-');
        formData.append(ENTRY_NOMBRE, stateData.name || '-');
        formData.append(ENTRY_PAIS, stateData.country || '-');
        formData.append(ENTRY_UBICACION, stateData.location || '-');
        formData.append(ENTRY_TELEFONO, 'Validando_WhatsApp'); // El teléfono se confirmará en el paso 7

        return fetch(FORM_URL, {
            method: 'POST',
            mode: 'no-cors', /* MAGIA: Esto engaña al navegador para que no bloquee CORS */
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });
    }

    // =========================================================================
    // 6. WHATSAPP LOOP BUTTON (Step 6 - The "Bucle Invertido")
    // =========================================================================
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    if (btnWhatsapp) {
        btnWhatsapp.addEventListener('click', () => {
            // Generate unique validation code
            const leadId = 'DF-' + Math.floor(1000 + Math.random() * 9000);
            const botNumber = '5690000000'; // Replace with real bot WA number

            const message = encodeURIComponent(
                `Hola Dentofacil, soy ${state.name || 'un paciente'}. Quiero validar mi solicitud de atención (${state.treatment}) con el código ${leadId}.`
            );

            // Open WhatsApp in new tab
            window.open(`https://wa.me/${botNumber}?text=${message}`, '_blank');

            // Redirect THIS tab to the success/premium pool page passing the country
            const safeCountry = encodeURIComponent(state.country || 'desconocido');
            window.location.href = `success.html?pais=${safeCountry}`;
        });
    }

});
