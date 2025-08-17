
const BILLS_STORAGE_KEY = 'cec068_bills';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('bill-form');
    const uploadButton = document.getElementById('upload-button');
    const signatureUpload = document.getElementById('signature-upload');
    const signaturePreview = document.getElementById('signature-preview');
    const signatureHiddenInput = document.getElementById('signature');

    uploadButton.addEventListener('click', () => {
        signatureUpload.click();
    });

    signatureUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result;
                signatureHiddenInput.value = result;
                signaturePreview.src = result;
                signaturePreview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (validateForm()) {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            data.distance = Number(data.distance);
            
            try {
                const storedBills = localStorage.getItem(BILLS_STORAGE_KEY);
                const allBills = storedBills ? JSON.parse(storedBills) : [];
                
                const newBill = { ...data, id: `${Date.now()}-${data.evaluatorId}` };
                const newBills = [...allBills, newBill];

                localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(newBills));
                
                document.getElementById('form-container').classList.add('hidden');
                document.getElementById('success-message').classList.remove('hidden');

            } catch (error) {
                console.error("Error submitting form:", error);
                alert("Could not submit your details. Please try again.");
            }
        }
    });

    function validateForm() {
        let isValid = true;
        const inputs = form.querySelectorAll('[required]');
        inputs.forEach(input => {
            const errorDiv = input.nextElementSibling;
            if (!input.value.trim()) {
                isValid = false;
                errorDiv.textContent = `${input.previousElementSibling.textContent} is required.`;
            } else if (input.type === 'email' && !/^\S+@\S+\.\S+$/.test(input.value)) {
                isValid = false;
                errorDiv.textContent = 'Please enter a valid email address.';
            } else {
                errorDiv.textContent = '';
            }
        });
        return isValid;
    }
});

    