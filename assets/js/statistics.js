       // --- 1. DATA AND STATE MANAGEMENT (UPDATED) ---
        let incidents = [
            // All statuses are now 'Resolved'
            { id: 1, type: 'Fire', location: 'Mckinley Ave, S. Yellow Coat Ctr.', reported: '2023-12-10 2:06 PM', responseTime: '2.4 min', status: 'Resolved' },
            { id: 2, type: 'Medical', location: '123 Main St, Central District', reported: '2023-12-11 9:15 AM', responseTime: '3.1 min', status: 'Resolved' },
            { id: 3, type: 'Crime', location: 'Sylvanian Rd, North End', reported: '2023-12-11 11:30 AM', responseTime: '1.8 min', status: 'Resolved' },
            { id: 4, type: 'Fire', location: 'Austin House, S. Yellow Coat Ctr.', reported: '2023-12-12 1:45 PM', responseTime: '4.0 min', status: 'Resolved' },
        ];
        let nextIncidentId = incidents.length > 0 ? Math.max(...incidents.map(i => i.id)) + 1 : 1;

        // --- 2. UTILITY FUNCTIONS (UNMODIFIED) ---
        
        // Shows a temporary toast notification
        function showToast(message, type = 'success') {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            
            let colorClass, iconClass;
            if (type === 'success') {
                colorClass = 'bg-emerald-500';
                iconClass = 'uil-check-circle';
            } else if (type === 'error') {
                colorClass = 'bg-red-500';
                iconClass = 'uil-times-circle';
            } else {
                colorClass = 'bg-blue-500';
                iconClass = 'uil-info-circle';
            }

            toast.className = `p-4 rounded-lg shadow-lg flex items-center space-x-3 text-white ${colorClass} transition-all duration-300 ease-in-out transform translate-x-full opacity-0`;
            toast.innerHTML = `<i class="uil ${iconClass} text-2xl"></i><span>${message}</span>`;
            
            container.appendChild(toast);
            
            // Animate in
            setTimeout(() => {
                toast.classList.remove('translate-x-full', 'opacity-0');
                toast.classList.add('translate-x-0', 'opacity-100');
            }, 10);
            
            // Animate out and remove
            setTimeout(() => {
                toast.classList.remove('translate-x-0', 'opacity-100');
                toast.classList.add('translate-x-full', 'opacity-0');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
        // --- 3. CRUD FUNCTIONS (UNMODIFIED) ---

        // Function to open the modal for adding an incident
        document.getElementById('addIncidentBtn').addEventListener('click', () => {
            document.getElementById('incidentId').value = '';
            document.getElementById('incidentForm').reset();
            document.getElementById('modalTitle').textContent = 'Add New Incident';
            document.getElementById('saveFormBtn').textContent = 'Add Incident';
            document.getElementById('crudModal').classList.remove('hidden');
        });

        // Function to open the modal for editing an incident (Update)
        function editIncident(id) {
            const incident = incidents.find(i => i.id === id);
            if (!incident) return;

            document.getElementById('incidentId').value = incident.id;
            document.getElementById('incidentType').value = incident.type;
            document.getElementById('incidentLocation').value = incident.location;
            document.getElementById('incidentStatus').value = incident.status;
            
            document.getElementById('modalTitle').textContent = `Edit Incident #${incident.id}`;
            document.getElementById('saveFormBtn').textContent = 'Save Changes';
            document.getElementById('crudModal').classList.remove('hidden');
        }

        // Function to handle form submission (Create & Update)
        document.getElementById('incidentForm').addEventListener('submit', function(e) {
            e.preventDefault();

            const id = document.getElementById('incidentId').value;
            const type = document.getElementById('incidentType').value;
            const location = document.getElementById('incidentLocation').value;
            const status = document.getElementById('incidentStatus').value;
            const now = new Date();
            const reported = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (id) {
                // Update operation
                const index = incidents.findIndex(i => i.id == id);
                if (index !== -1) {
                    incidents[index] = {
                        ...incidents[index],
                        type,
                        location,
                        status
                    };
                    showToast(`Incident #${id} updated successfully!`);
                }
            } else {
                // Create operation
                const newIncident = {
                    id: nextIncidentId++,
                    type,
                    location,
                    reported,
                    responseTime: 'TBD', // Placeholder for new incident
                    status
                };
                incidents.push(newIncident);
                showToast(`New Incident #${newIncident.id} added!`);
            }

            document.getElementById('crudModal').classList.add('hidden');
            renderIncidents();
        });

        // Function to delete an incident (Delete)
        function deleteIncident(id) {
            if (confirm(`Are you sure you want to delete Incident #${id}?`)) {
                incidents = incidents.filter(i => i.id !== id);
                renderIncidents();
                showToast(`Incident #${id} deleted.`, 'error');
            }
        }

        // --- 4. BUTTON ACTIONS AND GENERAL SETUP (UNMODIFIED) ---

        // Modal close buttons
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            document.getElementById('crudModal').classList.add('hidden');
        });
        document.getElementById('cancelFormBtn').addEventListener('click', () => {
            document.getElementById('crudModal').classList.add('hidden');
        });

        // Top action buttons
        document.getElementById('filterBtn').addEventListener('click', () => {
            showToast('Applying Filter logic (simulated).', 'info');
        });
        document.getElementById('exportBtn').addEventListener('click', () => {
            showToast('Report data exported successfully (simulated).', 'success');
        });

        // Dark Mode Logic
        const themeToggleBtn = document.querySelector('[data-toggle-theme]');
        const currentTheme = localStorage.getItem('theme');

        if (currentTheme) {
            document.documentElement.setAttribute('data-theme', currentTheme);
            if (currentTheme === 'dark') {
                themeToggleBtn.checked = true;
            }
        }

        themeToggleBtn.addEventListener('change', function () {
            if (this.checked) {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            }
            initializeCharts();
        });
        // Initialize on page load
        window.onload = () => {
            renderIncidents(); // Populate the table with the updated data
        };