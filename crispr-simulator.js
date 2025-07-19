document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT REFERENCES ---
    const simulatorTitle = document.getElementById('simulator-title');
    const startBtn = document.getElementById('start-mission-btn');
    const dnaStrandContainer = document.getElementById('dna-strand-container');
    const dnaStrandEl = document.getElementById('dna-strand');
    const enzymeEl = document.getElementById('cas9-enzyme-v5');
    const gRNAEl = document.getElementById('grna-rings-v5');
    const repairChoiceContainer = document.getElementById('repair-choice-container');
    const logList = document.getElementById('science-log-list');
    const missionTitleEl = document.getElementById('mission-title');
    const missionObjectiveEl = document.getElementById('mission-objective');
    const componentList = document.getElementById('component-list');
    
    // After Action Report elements
    const missionCompleteScreen = document.getElementById('mission-complete-screen');
    const completionTitle = document.getElementById('completion-title');
    const completionSummary = document.getElementById('completion-summary');
    const correctApproachSection = document.getElementById('correct-approach-section');
    const correctApproachSummary = document.getElementById('correct-approach-summary');
    const tryAgainBtn = document.getElementById('try-again-btn');
    const nextMissionBtn = document.getElementById('next-mission-btn');
    
    // --- DATA: GENETIC CASE FILES with Explanations ---
    const caseFiles = {
        'case-001': {
            title: 'Case File 001: Sickle Cell Anemia',
            objective: 'Use HDR to correct the HBB gene point mutation.',
            dnaSequence: '...CCTG<span class="mutation">{mutation}</span>GAGG...',
            mutation: 'GTG', // Correctly represents the Valine codon
            correction: 'GAG', // Correctly represents the Glutamic acid codon
            correctPathway: 'HDR',
            successExplanation: "SUCCESS: The Homology Directed Repair (HDR) pathway used the donor template to precisely correct the GTG mutation to GAG, restoring the gene's function.",
            failureExplanation: {
                'NHEJ': "FAILURE: NHEJ is an error-prone pathway. It isn't precise enough for fixing a single-letter mutation and has likely made the gene non-functional.",
                'LIGASE': "FAILURE: Ligase only pastes the two broken ends of DNA back together. It cannot correct the underlying mutation, leaving the gene damaged."
            },
            correctExplanation: "For a precise correction like this, HDR is required. It uses a template to guide the repair, ensuring the correct sequence is inserted."
        },
        'case-003': {
            title: 'Case File 003: Cystic Fibrosis (ΔF508)',
            objective: 'Use HDR to insert the missing CTT codon into the CFTR gene.',
            dnaSequence: '...ATC<span class="mutation">{mutation}</span>GGT...',
            mutation: '---',
            correction: 'CTT',
            correctPathway: 'HDR',
            successExplanation: "SUCCESS: The HDR pathway successfully used the donor template to insert the missing CTT codon, restoring the CFTR gene's reading frame.",
            failureExplanation: {
                'NHEJ': "FAILURE: The NHEJ pathway randomly inserts or deletes bases. It cannot be used to insert a specific, required codon like CTT.",
                'LIGASE': "FAILURE: Ligase only pastes the two broken ends of DNA back together. It cannot insert the missing genetic information."
            },
            correctExplanation: "To insert a specific piece of DNA, the HDR pathway is essential as it uses the provided donor template to fill in the gap with the correct sequence."
        },
        'case-004': {
            title: 'Case File 004: Hypercholesterolemia',
            objective: 'Use NHEJ to disable the PCSK9 gene.',
            dnaSequence: '...ATCG<span class="mutation">{mutation}</span>TACG...',
            mutation: 'GACTAC',
            correction: '<span class="error-text">G---C</span>',
            correctPathway: 'NHEJ',
            successExplanation: "SUCCESS: The Non-Homologous End Joining (NHEJ) pathway repaired the DNA imperfectly, causing a random mutation (indel) that successfully disabled the PCSK9 gene.",
            failureExplanation: {
                'HDR': "FAILURE: HDR is a high-fidelity repair mechanism. By using a template, it would have perfectly repaired the DNA cut, failing our objective to disable the gene.",
                'LIGASE': "FAILURE: Ligase only pastes the two broken ends of DNA back together. It cannot disable the gene's function effectively."
            },
            correctExplanation: "When the goal is to disable a gene, the messy NHEJ pathway is the correct choice because the errors it introduces are what break the gene's function."
        }
    };
    const missionOrder = ['case-001', 'case-003', 'case-004'];
    let currentMissionIndex = 0;
    
    // --- CORE FUNCTIONS ---
    const log = (message, status = 'processing') => {
        const li = document.createElement('li');
        li.className = status;
        li.innerHTML = message;
        logList.appendChild(li);
        logList.scrollTop = logList.scrollHeight;
    };
    
    const setActiveComponent = (compId) => {
        document.querySelectorAll('#component-list li').forEach(li => li.classList.remove('active'));
        if (compId) {
            document.getElementById(compId).classList.add('active');
        }
    };
    
    const resetWorkspace = () => {
        startBtn.disabled = false;
        startBtn.classList.remove('hidden');
        repairChoiceContainer.classList.add('hidden');
        missionCompleteScreen.classList.add('hidden');
        correctApproachSection.classList.add('hidden');
        
        dnaStrandContainer.className = 'dna-strand-container';
        enzymeEl.className = 'cas9-enzyme-v5';
        gRNAEl.className = 'grna-rings-v5';
        
        logList.innerHTML = '';
        log('Awaiting Mission Start...', 'pending');
        setActiveComponent('comp-dna');
    };

    const loadMission = (caseId) => {
        const mission = caseFiles[caseId];
        currentMissionIndex = missionOrder.indexOf(caseId);
        resetWorkspace();
        
        simulatorTitle.textContent = `Interactive Lab: ${mission.title.split(': ')[1]}`;
        missionTitleEl.textContent = mission.title;
        missionObjectiveEl.innerHTML = mission.objective;
        dnaStrandEl.innerHTML = mission.dnaSequence.replace('{mutation}', mission.mutation);
    };

    const showMissionComplete = (isSuccess, chosenPathway) => {
        missionCompleteScreen.classList.remove('hidden');
        const mission = caseFiles[missionOrder[currentMissionIndex]];
        
        if (isSuccess) {
            completionTitle.textContent = "Mission Successful";
            completionTitle.className = "success";
            completionSummary.textContent = mission.successExplanation;
            correctApproachSection.classList.add('hidden');
            tryAgainBtn.classList.add('hidden');
            nextMissionBtn.classList.remove('hidden');
        } else {
            completionTitle.textContent = "Mission Failed";
            completionTitle.className = "failure";
            completionSummary.textContent = mission.failureExplanation[chosenPathway];
            correctApproachSummary.textContent = mission.correctExplanation;
            correctApproachSection.classList.remove('hidden');
            tryAgainBtn.classList.remove('hidden');
            nextMissionBtn.classList.add('hidden');
        }
    };
    
    const runSimulation = () => {
        startBtn.classList.add('hidden');
        logList.innerHTML = '';
        
        const steps = [
            { delay: 500,  logMsg: "Deploying Cas9 Nuclease...", action: () => { enzymeEl.classList.add('deploying'); setActiveComponent('comp-cas9'); } },
            { delay: 1500, logMsg: "Loading guide RNA (gRNA)...", action: () => { gRNAEl.classList.add('loading'); setActiveComponent('comp-grna'); } },
            { delay: 3000, logMsg: "Cas9 complex scanning for target DNA...", action: () => {} },
            { delay: 4500, logMsg: "Target found. Unwinding DNA...", action: () => dnaStrandContainer.classList.add('melt') },
            { delay: 5500, logMsg: "Performing double-strand break...", action: () => { enzymeEl.classList.add('cutting'); dnaStrandContainer.classList.add('cut'); }},
            { delay: 6500, logMsg: "Awaiting repair pathway command...", action: () => repairChoiceContainer.classList.remove('hidden') }
        ];

        steps.forEach(step => {
            setTimeout(() => { log(step.logMsg); step.action(); }, step.delay);
        });
    };

    const handleRepairChoice = (chosenPathway) => {
        repairChoiceContainer.classList.add('hidden');
        enzymeEl.classList.add('retracting');
        gRNAEl.classList.add('retracting');

        const mission = caseFiles[missionOrder[currentMissionIndex]];
        const isSuccess = chosenPathway === mission.correctPathway;
        let dnaResult;
        
        log(`Cell is attempting repair via ${chosenPathway}...`);
        
        if (isSuccess) {
            dnaResult = mission.dnaSequence.replace(/{mutation}|---/g, `<span class="success-text">${mission.correction}</span>`);
        } else {
            dnaResult = mission.dnaSequence.replace('{mutation}', '<span class="error-text">G---C</span>');
        }

        setTimeout(() => {
            dnaStrandContainer.classList.add('repaired');
            dnaStrandEl.innerHTML = dnaResult;
            showMissionComplete(isSuccess, chosenPathway);
        }, 1500);
    };

    // --- EVENT LISTENERS ---
    startBtn.addEventListener('click', runSimulation);
    
    repairChoiceContainer.addEventListener('click', (e) => {
        if (e.target.matches('[data-choice]')) {
            handleRepairChoice(e.target.dataset.choice);
        }
    });

    tryAgainBtn.addEventListener('click', () => loadMission(missionOrder[currentMissionIndex]));
    nextMissionBtn.addEventListener('click', () => {
        const nextIndex = (currentMissionIndex + 1) % missionOrder.length;
        loadMission(missionOrder[nextIndex]);
    });
    
    // Hover-to-learn interactivity
    enzymeEl.addEventListener('mouseover', () => setActiveComponent('comp-cas9'));
    gRNAEl.addEventListener('mouseover', () => setActiveComponent('comp-grna'));
    dnaStrandContainer.addEventListener('mouseover', () => setActiveComponent('comp-dna'));
    enzymeEl.addEventListener('mouseout', () => setActiveComponent(null));
    gRNAEl.addEventListener('mouseout', () => setActiveComponent(null));
    dnaStrandContainer.addEventListener('mouseout', () => setActiveComponent(null));

    // --- INITIALIZATION ---
    loadMission(missionOrder[0]);
});