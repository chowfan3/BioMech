document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-mission-btn');
    const dnaStrandEl = document.getElementById('dna-strand');
    const pamScanner = document.getElementById('pam-scanner');
    const pamLabel = document.querySelector('.pam-label');
    const enzymeEl = document.getElementById('cas9-enzyme-v2');
    const gRNAEl = document.getElementById('gRNA-strand');
    const donorTemplateEl = document.getElementById('donor-template');
    const workspaceMsg = document.getElementById('workspace-message');
    const repairChoiceContainer = document.getElementById('repair-choice-container');
    const nhejBtn = document.getElementById('nhej-btn');
    const hdrBtn = document.getElementById('hdr-btn');
    const logList = document.getElementById('science-log-list');

    let missionActive = false;

    const log = (message, status = 'pending') => {
        if (logList.children[0] && logList.children[0].textContent === 'Awaiting Mission Start...') {
            logList.innerHTML = '';
        }
        const li = document.createElement('li');
        li.className = status;
        li.innerHTML = message;
        logList.appendChild(li);
        logList.scrollTop = logList.scrollHeight;
    };

    const showMessage = (text, type) => {
        workspaceMsg.textContent = text;
        workspaceMsg.className = `workspace-message-visible ${type}`;
    };

    const hideMessage = () => {
        workspaceMsg.className = 'workspace-message-hidden';
    };

    const resetSimulation = () => {
        missionActive = false;
        startBtn.disabled = false;
        startBtn.style.display = 'block';
        repairChoiceContainer.style.display = 'none';

        dnaStrandEl.innerHTML = `...CCTG<span class="error-text">GTG</span>GAGG...`;
        dnaStrandEl.classList.remove('cut', 'repaired');
        
        pamScanner.style.animation = 'none';
        pamLabel.style.opacity = '0';
        enzymeEl.style.animation = 'none';
        gRNAEl.style.animation = 'none';
        donorTemplateEl.style.animation = 'none';
        
        logList.innerHTML = '<li class="pending">Awaiting Mission Start...</li>';
        hideMessage();
    };

    startBtn.addEventListener('click', () => {
        if (missionActive) return;
        missionActive = true;
        startBtn.disabled = true;

        log('Locating target protospacer adjacent motif (PAM)...', 'processing');
        pamScanner.style.animation = 'scan 2s linear forwards';
        
        setTimeout(() => {
            pamLabel.style.opacity = '1';
            log('PAM sequence <span class="success-text">TGG</span> identified.', 'success');
            log('Synthesizing and loading guide RNA...', 'processing');
            gRNAEl.style.animation = 'load-grna 1.5s forwards';
        }, 2000);

        setTimeout(() => {
            log('Deploying Cas9 Nuclease...', 'processing');
            enzymeEl.style.animation = 'deploy-cas9 2s forwards';
        }, 3500);
        
        setTimeout(() => {
            log('Scanning for target sequence...', 'processing');
        }, 5500);
        
        setTimeout(() => {
            dnaStrandEl.classList.add('melt');
            log('Target found. Unwinding DNA...', 'success');
            log('Performing double-strand break...', 'processing');
        }, 6500);

        setTimeout(() => {
            dnaStrandEl.classList.add('cut');
            enzymeEl.classList.add('cut-effect');
            log('CUT CONFIRMED. DNA severed.', 'error');
            showMessage('CRITICAL CHOICE REQUIRED', 'warning');
            startBtn.style.display = 'none';
            repairChoiceContainer.style.display = 'flex';
        }, 7500);
    });

    nhejBtn.addEventListener('click', () => {
        log('NHEJ pathway initiated. Error-prone repair resulted in random indel.', 'error');
        dnaStrandEl.innerHTML = `...CCTG<span class="error-text">G---G</span>GAGG...`;
        showMessage('MISSION FAILED: Gene Knockout', 'error');
        repairChoiceContainer.style.display = 'none';
        setTimeout(resetSimulation, 4000);
    });
    
    hdrBtn.addEventListener('click', () => {
        log('HDR pathway initiated. Deploying donor template...', 'processing');
        repairChoiceContainer.style.display = 'none';
        donorTemplateEl.style.animation = 'deploy-donor 2s forwards';

        setTimeout(() => {
            dnaStrandEl.classList.add('repaired');
            dnaStrandEl.innerHTML = `...CCTG<span class="success-text">GAG</span>GAGG...`;
            log('DNA repaired using template.', 'success');
            showMessage('MISSION SUCCESSFUL', 'success');
            enzymeEl.style.animation = 'retract-cas9 2s forwards';
            gRNAEl.style.animation = 'retract-cas9 2s forwards';
        }, 2000);

        setTimeout(resetSimulation, 6000);
    });

    resetSimulation(); // Initialize
});