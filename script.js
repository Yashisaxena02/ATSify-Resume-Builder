/**
 * ==========================================================================
 * APPS MATRIX STATE ENGINE ARCHITECTURE & INITIALIZATION
 * ==========================================================================
 */

const AppState = {
    personal: {
        fullname: '', title: '', email: '', phone: '', address: '',
        linkedin: '', github: '', portfolio: '', avatarData: '', summary: ''
    },
    experiences: [],
    educations: [],
    skills: new Set(),
    projects: [],
    certifications: [],
    extra: { languages: '', achievements: '', interests: '' },
    
    presets: {
        tech: ['HTML5', 'CSS3', 'JavaScript', 'Python', 'Java', 'C++', 'SQL', 'React', 'Node.js', 'Git', 'AWS', 'Docker', 'TypeScript', 'Linux'],
        soft: ['Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Critical Thinking', 'Adaptability', 'Time Management']
    }
};

// Safe Execution Hook via DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        AppEngine.init();
    } catch (globalError) {
        console.error("Fatal initialization crash intercepted:", globalError);
    }
});

const AppEngine = {
    init() {
        this.cacheDOM();
        this.registerGlobalEvents();
        this.renderPresetSkills();
        
        // Dynamic Repeater Element Bootstrappers
        this.initRepeater('experience');
        this.initRepeater('education');
        this.initRepeater('project');
        this.initRepeater('certification');
        
        // Recover explicit user localized session state data safely
        StorageEngine.restoreSession();
        
        this.bindRealtimeValidation();
        this.triggerRealtimePipeline();
        this.updateSummaryCharacterCount();
    },

    cacheDOM() {
        // Safe query helper to prevent null-reference crashes
        const getEl = (id) => document.getElementById(id);
        const queryEl = (selector) => document.querySelector(selector);

        this.dom = {
            body: document.body,
            themeToggle: getEl('theme-toggle-btn'),
            accentDots: document.querySelectorAll('.accent-dot'),
            progressBarFill: getEl('progress-bar-fill'),
            progressPercentage: getEl('progress-percentage'),
            btnClearForm: getEl('btn-clear-form'),
            btnLoadSample: getEl('btn-load-sample'),
            
            fullname: getEl('input-fullname'),
            title: getEl('input-title'),
            email: getEl('input-email'),
            phone: getEl('input-phone'),
            address: getEl('input-address'),
            linkedin: getEl('input-linkedin'),
            github: getEl('input-github'),
            portfolio: getEl('input-portfolio'),
            summary: getEl('input-summary'),
            charCountSummary: getEl('char-count-summary'),
            
            dragZone: getEl('image-drag-zone'),
            avatarFile: getEl('input-avatar'),
            avatarPreviewBox: getEl('avatar-preview-container'),
            avatarImg: getEl('avatar-preview-img'),
            btnRemoveAvatar: getEl('btn-remove-avatar'),
            
            skillsSearch: getEl('skills-search-input'),
            techScroller: getEl('preset-tech-skills'),
            softScroller: getEl('preset-soft-skills'),
            tagsWrapper: getEl('skills-tags-container'),
            
            languages: getEl('input-languages'),
            achievements: getEl('input-achievements'),
            interests: getEl('input-interests'),
            
            atsScoreRing: getEl('ats-score-ring'),
            atsScoreText: getEl('ats-score-text'),
            strengthBar: queryEl('#strength-meter-bar span'),
            strengthLabel: getEl('strength-meter-label'),
            suggestionsList: getEl('diagnostic-suggestions-list'),
            
            canvas: getEl('ats-resume-canvas'),
            btnPrint: getEl('btn-print'),
            btnDownloadPdf: getEl('btn-download-pdf')
        };
    },

    registerGlobalEvents() {
        const self = this;

        // Theme Toggle Guarded Event
        if (this.dom.themeToggle) {
            this.dom.themeToggle.addEventListener('click', () => this.toggleThemeMode());
        }
        
        // Accent Color Dot Controller
        if (this.dom.accentDots) {
            this.dom.accentDots.forEach(dot => {
                dot.addEventListener('click', (e) => this.switchAccentSystem(e.target));
            });
        }
        
        if (this.dom.btnClearForm) this.dom.btnClearForm.addEventListener('click', () => this.clearActiveFormState());
        if (this.dom.btnLoadSample) this.dom.btnLoadSample.addEventListener('click', () => this.injectSampleMockData());
        if (this.dom.btnPrint) this.dom.btnPrint.addEventListener('click', () => window.print());
        if (this.dom.btnDownloadPdf) this.dom.btnDownloadPdf.addEventListener('click', () => this.exportHighFidelityPDF());

        // Accordion Controller Logic with Safe Parent Fallback
        document.querySelectorAll('.accordion-trigger').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const parent = trigger.closest('.accordion-item');
                if (!parent) return;
                const isExpanded = parent.classList.contains('expanded');
                parent.classList.toggle('expanded', !isExpanded);
                trigger.setAttribute('aria-expanded', !isExpanded);
            });
        });

        // Realtime Form Input Listeners
        const reactiveFields = ['fullname', 'title', 'email', 'phone', 'address', 'linkedin', 'github', 'portfolio', 'summary'];
        reactiveFields.forEach(field => {
            if (this.dom[field]) {
                this.dom[field].addEventListener('input', () => {
                    AppState.personal[field] = self.dom[field].value;
                    if(field === 'summary') self.updateSummaryCharacterCount();
                    self.triggerRealtimePipeline();
                });
            }
        });

        ['languages', 'achievements', 'interests'].forEach(field => {
            if (this.dom[field]) {
                this.dom[field].addEventListener('input', () => {
                    AppState.extra[field] = self.dom[field].value;
                    self.triggerRealtimePipeline();
                });
            }
        });

        // Photo Upload Handling Matrix Setup
        if (this.dom.dragZone && this.dom.avatarFile) {
            this.dom.dragZone.addEventListener('click', () => this.dom.avatarFile.click());
            this.dom.dragZone.addEventListener('dragover', (e) => { e.preventDefault(); self.dom.dragZone.classList.add('dragover'); });
            this.dom.dragZone.addEventListener('dragleave', () => self.dom.dragZone.classList.remove('dragover'));
            this.dom.dragZone.addEventListener('drop', (e) => {
                e.preventDefault();
                self.dom.dragZone.classList.remove('dragover');
                if (e.dataTransfer.files.length) self.processAvatarBuffer(e.dataTransfer.files[0]);
            });
        }
        
        if (this.dom.avatarFile) {
            this.dom.avatarFile.addEventListener('change', (e) => {
                if (e.target.files.length) self.processAvatarBuffer(e.target.files[0]);
            });
        }
        
        if (this.dom.btnRemoveAvatar) {
            this.dom.btnRemoveAvatar.addEventListener('click', () => this.purgeAvatarAsset());
        }

        // Skills Matrix Tags Input Listener
        if (this.dom.skillsSearch) {
            this.dom.skillsSearch.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.target.value.trim() !== '') {
                    e.preventDefault();
                    self.addSkillTag(e.target.value.trim());
                    e.target.value = '';
                }
            });
            this.dom.skillsSearch.addEventListener('input', (e) => self.filterPresetSkillsMatrix(e.target.value));
        }
    },

    initRepeater(type) {
        const container = document.getElementById(`${type}-list-container`);
        const btn = document.getElementById(`btn-add-${type}`);
        if (btn && container) {
            btn.addEventListener('click', () => {
                this.createRepeaterNode(type, container, null);
                this.triggerRealtimePipeline();
            });
        }
    },

    createRepeaterNode(type, container, dataObject = null) {
        if (!container) return;
        const uniqueId = `${type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const card = document.createElement('div');
        card.className = 'repeater-card';
        card.dataset.id = uniqueId;
        card.dataset.type = type;

        let templateHtml = '';
        
        if (type === 'experience') {
            const mock = dataObject || { title: '', company: '', location: '', start: '', end: '', current: false, desc: '' };
            templateHtml = `
                <div class="card-deletion-overlay"><button type="button" class="btn-delete-entry"><i class="fa-solid fa-trash-can"></i></button></div>
                <div class="grid-2-col">
                    <div class="form-group"><label>Job Title / Role</label><input type="text" class="form-input rep-field" data-prop="title" value="${mock.title}" placeholder="Software Engineer II"></div>
                    <div class="form-group"><label>Company / Employer</label><input type="text" class="form-input rep-field" data-prop="company" value="${mock.company}" placeholder="Stripe Inc."></div>
                </div>
                <div class="grid-3-col">
                    <div class="form-group"><label>Location</label><input type="text" class="form-input rep-field" data-prop="location" value="${mock.location}" placeholder="Remote / New York"></div>
                    <div class="form-group"><label>Start Date</label><input type="month" class="form-input rep-field" data-prop="start" value="${mock.start}"></div>
                    <div class="form-group">
                        <label>End Date</label>
                        <input type="month" class="form-input rep-field" data-prop="end" value="${mock.end}" ${mock.current ? 'disabled' : ''}>
                        <div class="checkbox-inline-row">
                            <input type="checkbox" id="chk_${uniqueId}" class="rep-field-chk" data-prop="current" ${mock.current ? 'checked' : ''}>
                            <label for="chk_${uniqueId}">Present</label>
                        </div>
                    </div>
                </div>
                <div class="form-group"><label>Description & Achievements</label><textarea class="form-input rep-field" data-prop="desc" rows="3" placeholder="Optimized database execution pipelines by 34% using custom indexing systems...">${mock.desc}</textarea></div>
            `;
        } else if (type === 'education') {
            const mock = dataObject || { degree: '', school: '', location: '', start: '', end: '', grade: '' };
            templateHtml = `
                <div class="card-deletion-overlay"><button type="button" class="btn-delete-entry"><i class="fa-solid fa-trash-can"></i></button></div>
                <div class="grid-2-col">
                    <div class="form-group"><label>Degree Matrix</label><input type="text" class="form-input rep-field" data-prop="degree" value="${mock.degree}" placeholder="B.S. Computer Science"></div>
                    <div class="form-group"><label>University / School</label><input type="text" class="form-input rep-field" data-prop="school" value="${mock.school}" placeholder="Stanford University"></div>
                </div>
                <div class="grid-3-col">
                    <div class="form-group"><label>Location</label><input type="text" class="form-input rep-field" data-prop="location" value="${mock.location}" placeholder="Stanford, CA"></div>
                    <div class="form-group"><label>Start Year</label><input type="number" min="1900" max="2099" class="form-input rep-field" data-prop="start" value="${mock.start}" placeholder="2021"></div>
                    <div class="form-group"><label>End Year</label><input type="number" min="1900" max="2099" class="form-input rep-field" data-prop="end" value="${mock.end}" placeholder="2025"></div>
                </div>
                <div class="form-group" style="max-width:33%"><label>Grade / CGPA</label><input type="text" class="form-input rep-field" data-prop="grade" value="${mock.grade}" placeholder="3.92 / 4.0"></div>
            `;
        } else if (type === 'project') {
            const mock = dataObject || { name: '', tech: '', desc: '', github: '', live: '' };
            templateHtml = `
                <div class="card-deletion-overlay"><button type="button" class="btn-delete-entry"><i class="fa-solid fa-trash-can"></i></button></div>
                <div class="grid-2-col">
                    <div class="form-group"><label>Project Title</label><input type="text" class="form-input rep-field" data-prop="name" value="${mock.name}" placeholder="Distributed Ledger Architecture"></div>
                    <div class="form-group"><label>Technologies Used</label><input type="text" class="form-input rep-field" data-prop="tech" value="${mock.tech}" placeholder="Go, gRPC, Protobuf, Docker"></div>
                </div>
                <div class="form-group"><label>Description</label><textarea class="form-input rep-field" data-prop="desc" rows="2" placeholder="Designed and deployed a highly fault-tolerant engine minimizing cluster latency...">${mock.desc}</textarea></div>
                <div class="grid-2-col">
                    <div class="form-group"><label>Repository Link</label><input type="url" class="form-input rep-field" data-prop="github" value="${mock.github}" placeholder="https://github.com/..."></div>
                    <div class="form-group"><label>Deployment Live Demo</label><input type="url" class="form-input rep-field" data-prop="live" value="${mock.live}" placeholder="https://demo-app.io"></div>
                </div>
            `;
        } else if (type === 'certification') {
            const mock = dataObject || { name: '', org: '', year: '' };
            templateHtml = `
                <div class="card-deletion-overlay"><button type="button" class="btn-delete-entry"><i class="fa-solid fa-trash-can"></i></button></div>
                <div class="grid-3-col">
                    <div class="form-group" style="grid-column: span 2"><label>Certification Name</label><input type="text" class="form-input rep-field" data-prop="name" value="${mock.name}" placeholder="AWS Certified Solutions Architect"></div>
                    <div class="form-group"><label>Year</label><input type="number" class="form-input rep-field" data-prop="year" value="${mock.year}" placeholder="2025"></div>
                </div>
                <div class="form-group"><label>Issuing Institution</label><input type="text" class="form-input rep-field" data-prop="org" value="${mock.org}" placeholder="Amazon Web Services"></div>
            `;
        }

        card.innerHTML = templateHtml;
        container.appendChild(card);

        const targetStateArray = type === 'experience' ? AppState.experiences :
                               type === 'education' ? AppState.educations :
                               type === 'project' ? AppState.projects : AppState.certifications;
        
        const runtimeObject = dataObject || this.buildObjectFromCard(card);
        if(!dataObject) targetStateArray.push(runtimeObject);
        card.dataset.stateIndex = targetStateArray.indexOf(runtimeObject);

        card.querySelectorAll('.rep-field').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = card.dataset.stateIndex;
                const prop = e.target.dataset.prop;
                if(targetStateArray[idx]) targetStateArray[idx][prop] = e.target.value;
                this.triggerRealtimePipeline();
            });
        });

        const chk = card.querySelector('.rep-field-chk');
        if(chk) {
            chk.addEventListener('change', (e) => {
                const idx = card.dataset.stateIndex;
                if(!targetStateArray[idx]) return;
                const endInput = card.querySelector('[data-prop="end"]');
                targetStateArray[idx].current = e.target.checked;
                if(e.target.checked) {
                    targetStateArray[idx].end = '';
                    if(endInput) { endInput.value = ''; endInput.disabled = true; }
                } else {
                    if(endInput) endInput.disabled = false;
                }
                this.triggerRealtimePipeline();
            });
        }

        card.querySelector('.btn-delete-entry').addEventListener('click', () => {
            card.style.animation = 'fadeSlideUp 0.2s reverse ease-in';
            setTimeout(() => {
                const idx = targetStateArray.indexOf(runtimeObject);
                if(idx > -1) targetStateArray.splice(idx, 1);
                card.remove();
                this.reindexRepeaterCards(type, targetStateArray);
                this.triggerRealtimePipeline();
            }, 200);
        });
    },

    buildObjectFromCard(card) {
        const fields = card.querySelectorAll('.rep-field');
        const obj = {};
        fields.forEach(f => { obj[f.dataset.prop] = f.value; });
        const chk = card.querySelector('.rep-field-chk');
        if(chk) obj.current = chk.checked;
        return obj;
    },

    reindexRepeaterCards(type, stateArray) {
        const cards = document.querySelectorAll(`.repeater-card[data-type="${type}"]`);
        cards.forEach(card => {
            const fields = card.querySelectorAll('.rep-field');
            let foundMatch = stateArray.find(item => {
                let match = true;
                fields.forEach(f => { if(item[f.dataset.prop] !== f.value) match = false; });
                return match;
            });
            if(foundMatch) card.dataset.stateIndex = stateArray.indexOf(foundMatch);
        });
    },

    renderPresetSkills() {
        if (!this.dom.techScroller || !this.dom.softScroller) return;
        this.dom.techScroller.innerHTML = '';
        this.dom.softScroller.innerHTML = '';
        
        AppState.presets.tech.forEach(skill => this.dom.techScroller.appendChild(this.buildPresetCheckboxNode(skill)));
        AppState.presets.soft.forEach(skill => this.dom.softScroller.appendChild(this.buildPresetCheckboxNode(skill)));
    },

    buildPresetCheckboxNode(skillName) {
        const label = document.createElement('label');
        label.className = 'skill-check-item';
        label.dataset.skill = skillName.toLowerCase();
        
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.value = skillName;
        chk.addEventListener('change', (e) => {
            if(e.target.checked) this.addSkillTag(skillName);
            else this.removeSkillTag(skillName);
        });
        
        label.appendChild(chk);
        label.appendChild(document.createTextNode(` ${skillName}`));
        return label;
    },

    addSkillTag(skillName) {
        const normalized = skillName.trim();
        if(normalized === '' || AppState.skills.has(normalized)) return;
        AppState.skills.add(normalized);
        this.renderActiveTagsWrapper();
        this.syncPresetCheckboxesState();
        this.triggerRealtimePipeline();
    },

    removeSkillTag(skillName) {
        AppState.skills.delete(skillName);
        this.renderActiveTagsWrapper();
        this.syncPresetCheckboxesState();
        this.triggerRealtimePipeline();
    },

    renderActiveTagsWrapper() {
        if (!this.dom.tagsWrapper) return;
        this.dom.tagsWrapper.innerHTML = '';
        AppState.skills.forEach(skill => {
            const tag = document.createElement('span');
            tag.className = 'skill-tag';
            tag.innerHTML = `${skill} <i class="fa-solid fa-circle-xmark"></i>`;
            tag.querySelector('i').addEventListener('click', () => this.removeSkillTag(skill));
            this.dom.tagsWrapper.appendChild(tag);
        });
    },

    syncPresetCheckboxesState() {
        document.querySelectorAll('.skill-check-item input').forEach(chk => {
            chk.checked = AppState.skills.has(chk.value);
        });
    },

    filterPresetSkillsMatrix(query) {
        const q = query.toLowerCase().trim();
        document.querySelectorAll('.skill-check-item').forEach(item => {
            if(item.dataset.skill.includes(q)) item.classList.remove('hidden');
            else item.classList.add('hidden');
        });
    },

    processAvatarBuffer(file) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            AppState.personal.avatarData = e.target.result;
            if (this.dom.avatarImg) this.dom.avatarImg.src = e.target.result;
            if (this.dom.avatarPreviewBox) this.dom.avatarPreviewBox.classList.remove('hidden');
            if (this.dom.dragZone) this.dom.dragZone.classList.add('hidden');
            this.triggerRealtimePipeline();
        };
        reader.readAsDataURL(file);
    },

    purgeAvatarAsset() {
        AppState.personal.avatarData = '';
        if (this.dom.avatarImg) this.dom.avatarImg.src = '';
        if (this.dom.avatarPreviewBox) this.dom.avatarPreviewBox.classList.add('hidden');
        if (this.dom.dragZone) this.dom.dragZone.classList.remove('hidden');
        if (this.dom.avatarFile) this.dom.avatarFile.value = '';
        this.triggerRealtimePipeline();
    },

    updateSummaryCharacterCount() {
        if (!this.dom.summary || !this.dom.charCountSummary) return;
        const count = this.dom.summary.value.length;
        this.dom.charCountSummary.innerText = `${count} / 500 characters`;
    },

    bindRealtimeValidation() {
        const self = this;
        const rules = [
            { el: this.dom.email, err: 'err-email', reg: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg: 'Invalid email address structure.' },
            { el: this.dom.linkedin, err: 'err-linkedin', reg: /^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/, msg: 'Must be a valid LinkedIn URI.' },
            { el: this.dom.github, err: 'err-github', reg: /^(https?:\/\/)?(www\.)?github\.com\/.*$/, msg: 'Must be a valid GitHub URI.' },
            { el: this.dom.portfolio, err: 'err-portfolio', reg: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, msg: 'Invalid portfolio domain path.' }
        ];

        rules.forEach(rule => {
            if (!rule.el) return;
            rule.el.addEventListener('input', () => {
                if(rule.el.value.trim() === '') {
                    self.clearErrorField(rule.el, rule.err);
                } else if(!rule.reg.test(rule.el.value.trim())) {
                    self.raiseErrorField(rule.el, rule.err, rule.msg);
                } else {
                    self.clearErrorField(rule.el, rule.err);
                }
            });
        });
        
        if (this.dom.fullname) {
            this.dom.fullname.addEventListener('input', () => {
                if(self.dom.fullname.value.trim() === '') self.raiseErrorField(self.dom.fullname, 'err-fullname', 'Full Name is required.');
                else self.clearErrorField(self.dom.fullname, 'err-fullname');
            });
        }
    },

    raiseErrorField(element, errorId, dynamicMessage) {
        const errNode = document.getElementById(errorId);
        if (element) element.classList.add('invalid-frame');
        if (errNode) errNode.innerText = dynamicMessage;
    },

    clearErrorField(element, errorId) {
        const errNode = document.getElementById(errorId);
        if (element) element.classList.remove('invalid-frame');
        if (errNode) errNode.innerText = '';
    },

    triggerRealtimePipeline() {
        this.renderCanvasSheet();
        this.executeAtsEngineDiagnostics();
        this.evaluateProfileCompletionProgress();
        StorageEngine.saveSession();
    },

    renderCanvasSheet() {
        if (!this.dom.canvas) return;
        const p = AppState.personal;
        
        const hSection = this.dom.canvas.querySelector('#canvas-header');
        const sSection = this.dom.canvas.querySelector('#canvas-summary');
        const eSection = this.dom.canvas.querySelector('#canvas-experience');
        const edSection = this.dom.canvas.querySelector('#canvas-education');
        const pSection = this.dom.canvas.querySelector('#canvas-projects');
        const skSection = this.dom.canvas.querySelector('#canvas-skills');
        const cSection = this.dom.canvas.querySelector('#canvas-certifications');
        const exSection = this.dom.canvas.querySelector('#canvas-extra');

        if(hSection) {
            const avatarHtml = p.avatarData ? `<img src="${p.avatarData}" class="avatar-embed" alt="Profile Icon">` : '';
            let headerHtml = `
                <div class="resume-header-block">
                    ${avatarHtml}
                    <h1>${p.fullname || 'YOUR FULL NAME'}</h1>
                    <div class="job-title">${p.title || 'Professional Target Profile Title'}</div>
                    <div class="contact-channels">
                        ${p.email ? `<span><i class="fa-solid fa-envelope"></i> ${p.email}</span>` : ''}
                        ${p.phone ? `<span><i class="fa-solid fa-phone"></i> ${p.phone}</span>` : ''}
                        ${p.address ? `<span><i class="fa-solid fa-location-dot"></i> ${p.address}</span>` : ''}
                        ${p.linkedin ? `<span><i class="fa-brands fa-linkedin"></i> ${p.linkedin.replace(/https?:\/\/(www\.)?/, '')}</span>` : ''}
                        ${p.github ? `<span><i class="fa-brands fa-github"></i> ${p.github.replace(/https?:\/\/(www\.)?/, '')}</span>` : ''}
                        ${p.portfolio ? `<span><i class="fa-solid fa-globe"></i> ${p.portfolio.replace(/https?:\/\/(www\.)?/, '')}</span>` : ''}
                    </div>
                </div>
            `;
            hSection.innerHTML = headerHtml;
        }

        if(sSection) sSection.innerHTML = p.summary ? `<h2 class="section-title">Professional Summary</h2><p class="resume-summary-text">${p.summary}</p>` : '';

        if(eSection) {
            let expHtml = '';
            if(AppState.experiences.length > 0) {
                expHtml += '<h2 class="section-title">Professional Experience</h2>';
                AppState.experiences.forEach(exp => {
                    const dateString = `${this.formatMonth(exp.start)} — ${exp.current ? 'Present' : this.formatMonth(exp.end)}`;
                    expHtml += `
                        <div class="resume-item-row">
                            <div class="item-meta-header"><span>${exp.title || 'Role Title'}</span><span>${dateString}</span></div>
                            <div class="item-meta-sub"><span>${exp.company || 'Company Entity'}</span><span>${exp.location || ''}</span></div>
                            ${exp.desc ? `<ul class="resume-bullet-list">${exp.desc.split('\n').map(bullet => bullet.trim() ? `<li>${bullet.replace(/^-\s*/, '')}</li>` : '').join('')}</ul>` : ''}
                        </div>
                    `;
                });
            }
            eSection.innerHTML = expHtml;
        }

        if(edSection) {
            let eduHtml = '';
            if(AppState.educations.length > 0) {
                eduHtml += '<h2 class="section-title">Education</h2>';
                AppState.educations.forEach(edu => {
                    const years = (edu.start || edu.end) ? `${edu.start || ''} — ${edu.end || 'Present'}` : '';
                    eduHtml += `
                        <div class="resume-item-row">
                            <div class="item-meta-header"><span>${edu.degree || 'Degree Profile'}</span><span>${years}</span></div>
                            <div class="item-meta-sub"><span>${edu.school || 'Academic Institution'}</span><span>${edu.location || ''}</span></div>
                            ${edu.grade ? `<ul class="resume-bullet-list"><li>Grade Metrics: ${edu.grade}</li></ul>` : ''}
                        </div>
                    `;
                });
            }
            edSection.innerHTML = eduHtml;
        }

        if(pSection) {
            let projHtml = '';
            if(AppState.projects.length > 0) {
                projHtml += '<h2 class="section-title">Technical Projects Portfolio</h2>';
                AppState.projects.forEach(proj => {
                    const links = [];
                    if(proj.github) links.push(`Source: ${proj.github.replace(/https?:\/\/(www\.)?/, '')}`);
                    if(proj.live) links.push(`Live Demo: ${proj.live.replace(/https?:\/\/(www\.)?/, '')}`);
                    const linksStr = links.length > 0 ? `(${links.join(' | ')})` : '';
                    
                    projHtml += `
                        <div class="resume-item-row">
                            <div class="item-meta-header"><span>${proj.name || 'System Archetype Project'}</span><span>${linksStr}</span></div>
                            ${proj.tech ? `<div class="item-meta-sub"><span>Tech Stack: ${proj.tech}</span></div>` : ''}
                            ${proj.desc ? `<ul class="resume-bullet-list"><li>${proj.desc}</li></ul>` : ''}
                        </div>
                    `;
                });
            }
            pSection.innerHTML = projHtml;
        }

        if(skSection) {
            skSection.innerHTML = AppState.skills.size > 0 ? 
                `<h2 class="section-title">Core Skills Inventory</h2><p class="resume-skills-line"><strong>Target Frameworks:</strong> ${Array.from(AppState.skills).join(' • ')}</p>` : '';
        }

        if(cSection) {
            let certHtml = '';
            if(AppState.certifications.length > 0) {
                certHtml += '<h2 class="section-title">Certifications & Credentials</h2>';
                AppState.certifications.forEach(c => {
                    certHtml += `
                        <div class="resume-item-row" style="margin-bottom:2mm">
                            <div class="item-meta-header"><span>${c.name || 'Credential'}</span><span>${c.year || ''}</span></div>
                            <div class="item-meta-sub"><span>Issuer: ${c.org || 'Authority'}</span></div>
                        </div>
                    `;
                });
            }
            cSection.innerHTML = certHtml;
        }

        if(exSection) {
            let extraHtml = '';
            const ex = AppState.extra;
            if(ex.languages || ex.achievements || ex.interests) {
                extraHtml += '<h2 class="section-title">Additional Profiles</h2>';
                if(ex.languages) extraHtml += `<p class="resume-skills-line" style="margin-bottom:1.5mm"><strong>Linguistic Proficiency:</strong> ${ex.languages}</p>`;
                if(ex.interests) extraHtml += `<p class="resume-skills-line" style="margin-bottom:1.5mm"><strong>Research Interests:</strong> ${ex.interests}</p>`;
                if(ex.achievements) {
                    extraHtml += `<div class="resume-item-row"><div class="item-meta-header" style="font-size:9.5pt; margin-bottom:1mm">Track Records</div>`;
                    extraHtml += `<ul class="resume-bullet-list">${ex.achievements.split('\n').map(a => a.trim() ? `<li>${a}</li>` : '').join('')}</ul></div>`;
                }
            }
            exSection.innerHTML = extraHtml;
        }
    },

    executeAtsEngineDiagnostics() {
        let score = 0;
        const suggestions = [];
        const p = AppState.personal;
        
        if(p.fullname && p.email && p.phone) { score += 15; suggestions.push({ pass: true, text: 'Essential identity communication nodes validated.' }); }
        else { suggestions.push({ pass: false, text: 'Missing essential target contact routes (Name, Mail, Phone).' }); }
        
        if(p.linkedin) { score += 5; suggestions.push({ pass: true, text: 'LinkedIn profile integrated.' }); }
        else { suggestions.push({ pass: false, text: 'Adding a professional LinkedIn link significantly elevates metric visibility.' }); }
        
        if(p.github || p.portfolio) { score += 5; suggestions.push({ pass: true, text: 'Project pipeline repository links verified.' }); }
        else { suggestions.push({ pass: false, text: 'Include public repository architectures links (e.g. GitHub).' }); }

        if(p.summary && p.summary.length > 80) { score += 15; suggestions.push({ pass: true, text: 'Profile abstract summary established.' }); }
        else { suggestions.push({ pass: false, text: 'Provide an active summary block containing dense operational descriptions over 80 characters.' }); }

        if(AppState.experiences.length > 0) {
            score += 20;
            let longDesc = true;
            let verbMatch = false;
            const verbs = ['executed', 'architected', 'optimized', 'spearheaded', 'formulated', 'overhauled', 'maximized', 'developed', 'implemented', 'designed'];
            
            AppState.experiences.forEach(e => {
                if(!e.desc || e.desc.length < 50) longDesc = false;
                verbs.forEach(v => { if(e.desc && e.desc.toLowerCase().includes(v)) verbMatch = true; });
            });
            
            if(longDesc) { score += 5; suggestions.push({ pass: true, text: 'Experience tracking descriptions display comprehensive depth.' }); }
            else { suggestions.push({ pass: false, text: 'Expand experience blocks with measurable metrics and results.' }); }
            
            if(verbMatch) { score += 5; suggestions.push({ pass: true, text: 'Impact action syntax verified across matrix.' }); }
            else { suggestions.push({ pass: false, text: 'Inject technical action verbs into role descriptions (e.g., Optimized, Spearheaded).' }); }
        } else {
            suggestions.push({ pass: false, text: 'Add at least one corporate or project deployment experience frame.' });
        }

        if(AppState.educations.length > 0) { score += 15; suggestions.push({ pass: true, text: 'Academic validation structure mapped.' }); }
        else { suggestions.push({ pass: false, text: 'Academic tracking node empty. Add education records.' }); }

        if(AppState.skills.size >= 6) { score += 10; suggestions.push({ pass: true, text: 'System skill density threshold cleared.' }); }
        else { suggestions.push({ pass: false, text: 'Include at least 6 core technical capability tags.' }); }

        if(AppState.projects.length > 0) { score += 10; suggestions.push({ pass: true, text: 'Standalone technical codebase structures verified.' }); }
        else { suggestions.push({ pass: false, text: 'Incorporate standalone application projects into your portfolio.' }); }

        this.animateCircularDiagnosticProgress(score);
        this.renderDiagnosticSuggestionsPanel(suggestions);
    },

    animateCircularDiagnosticProgress(targetScore) {
        if (!this.dom.atsScoreText || !this.dom.atsScoreRing) return;
        this.dom.atsScoreText.innerText = targetScore;
        const circumference = 2 * Math.PI * 38;
        const offset = circumference - (targetScore / 100) * circumference;
        this.dom.atsScoreRing.style.strokeDashoffset = offset;

        let color = "#ef4444";
        let label = 'Critical Structural Deficiency (Fail)';
        
        if(targetScore >= 45 && targetScore < 75) {
            color = "#eab308";
            label = 'Intermediate ATS Parse Quality Profile';
        } else if(targetScore >= 75) {
            color = "#22c55e";
            label = 'Premium Optimized Corporate System Integrity';
        }

        this.dom.atsScoreRing.style.stroke = color;
        if (this.dom.strengthBar) {
            this.dom.strengthBar.style.width = `${targetScore}%`;
            this.dom.strengthBar.style.backgroundColor = color;
        }
        if (this.dom.strengthLabel) this.dom.strengthLabel.innerText = label;
    },

    renderDiagnosticSuggestionsPanel(suggestions) {
        if (!this.dom.suggestionsList) return;
        this.dom.suggestionsList.innerHTML = '';
        suggestions.forEach(s => {
            const li = document.createElement('li');
            li.className = s.pass ? 'pass' : 'fail';
            li.innerHTML = s.pass ? `<i class="fa-solid fa-circle-check"></i> <span>${s.text}</span>` : `<i class="fa-solid fa-circle-exclamation"></i> <span>${s.text}</span>`;
            this.dom.suggestionsList.appendChild(li);
        });
    },

    evaluateProfileCompletionProgress() {
        let totalWeights = 0;
        let completeWeights = 0;

        const checkNode = (val) => { totalWeights++; if(val && val.toString().trim() !== '') completeWeights++; };
        
        checkNode(AppState.personal.fullname);
        checkNode(AppState.personal.title);
        checkNode(AppState.personal.email);
        checkNode(AppState.personal.summary);
        
        totalWeights++; if(AppState.experiences.length > 0) completeWeights++;
        totalWeights++; if(AppState.educations.length > 0) completeWeights++;
        totalWeights++; if(AppState.skills.size > 4) completeWeights++;
        totalWeights++; if(AppState.projects.length > 0) completeWeights++;

        const computedPct = Math.min(Math.round((completeWeights / totalWeights) * 100), 100);
        if (this.dom.progressBarFill) this.dom.progressBarFill.style.width = `${computedPct}%`;
        if (this.dom.progressPercentage) this.dom.progressPercentage.innerText = `${computedPct}%`;
    },

    exportHighFidelityPDF() {
        if (!window.jspdf || !window.html2canvas) {
            alert('PDF utilities are currently initializing. Please attempt export again in a moment.');
            return;
        }
        const { jsPDF } = window.jspdf;
        const targetElement = this.dom.canvas;
        if (!targetElement) return;
        
        const btnText = this.dom.btnDownloadPdf.innerHTML;
        this.dom.btnDownloadPdf.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Rasterizing...`;
        this.dom.btnDownloadPdf.disabled = true;

        html2canvas(targetElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const renderHeight = (canvas.height * pageWidth) / canvas.width;
            
            let currentHeightPosition = 0;
            let structuralHeightLeft = renderHeight;

            while (structuralHeightLeft > 0) {
                pdf.addImage(imgData, 'JPEG', 0, currentHeightPosition, pageWidth, renderHeight);
                structuralHeightLeft -= pageHeight;
                currentHeightPosition -= pageHeight;
                if (structuralHeightLeft > 0) pdf.addPage();
            }

            const cleanName = AppState.personal.fullname.replace(/\s+/g, '_') || 'Resume';
            pdf.save(`${cleanName}_ATS_Optimized.pdf`);
            
            this.dom.btnDownloadPdf.innerHTML = btnText;
            this.dom.btnDownloadPdf.disabled = false;
        }).catch(err => {
            console.error('PDF Conversion structural crash:', err);
            this.dom.btnDownloadPdf.innerHTML = btnText;
            this.dom.btnDownloadPdf.disabled = false;
        });
    },

    toggleThemeMode() {
        if (!this.dom.body) return;
        const currentTheme = this.dom.body.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.dom.body.setAttribute('data-theme', nextTheme);
        if (this.dom.themeToggle) {
            this.dom.themeToggle.innerHTML = nextTheme === 'dark' ? `<i class="fa-solid fa-sun"></i>` : `<i class="fa-solid fa-moon"></i>`;
        }
    },

    switchAccentSystem(targetDot) {
        if (!targetDot) return;
        this.dom.accentDots.forEach(d => d.classList.remove('active'));
        targetDot.classList.add('active');
        this.dom.body.setAttribute('data-accent', targetDot.dataset.accent);
    },

    clearActiveFormState() {
        if(!confirm('Are you absolute sure you want to flush all current active resume data inputs?')) return;
        
        AppState.personal = { fullname: '', title: '', email: '', phone: '', address: '', linkedin: '', github: '', portfolio: '', avatarData: '', summary: '' };
        AppState.experiences = [];
        AppState.educations = [];
        AppState.skills.clear();
        AppState.projects = [];
        AppState.certifications = [];
        AppState.extra = { languages: '', achievements: '', interests: '' };

        const explicitInputs = ['fullname', 'title', 'email', 'phone', 'address', 'linkedin', 'github', 'portfolio', 'summary', 'languages', 'achievements', 'interests'];
        explicitInputs.forEach(f => { if(this.dom[f]) this.dom[f].value = ''; });
        
        document.querySelectorAll('.repeater-container').forEach(c => c.innerHTML = '');
        this.purgeAvatarAsset();
        this.syncPresetCheckboxesState();
        this.renderActiveTagsWrapper();
        this.updateSummaryCharacterCount();
        
        StorageEngine.purgeSession();
        this.triggerRealtimePipeline();
    },

    injectSampleMockData() {
        this.clearActiveFormState();
        
        AppState.personal = {
            fullname: 'Jonathan Vance',
            title: 'Lead Distributed Systems Architect',
            email: 'j.vance@infrastructure.dev',
            phone: '+1 (555) 382-9921',
            address: 'Austin, Texas',
            linkedin: 'https://linkedin.com/in/jonathan-vance-dev',
            github: 'https://github.com/vance-architectures',
            portfolio: 'https://infrastructure.dev',
            avatarData: '',
            summary: 'Highly analytical systems architecture expert with 8+ years experience designing ultra-low latency backend frameworks. Proven track record eliminating compute bottlenecks, engineering resilient distributed clusters, and spearheading high-throughput data pipelines processing over 40TB daily metrics.'
        };

        AppState.experiences = [
            { title: 'Principal Infrastructure Engineer', company: 'Cloudflare Operations', location: 'Austin, TX', start: '2023-03', end: '', current: true, desc: '- Architected high performance edge computing engine minimizing core request routing latencies by 42%.\n- Spearheaded system migrations transferring legacy protocols onto modular Go-based microservice infrastructure.\n- Managed 14-person cross-functional engineer pipeline delivering high availability clusters.' },
            { title: 'Senior Software Specialist', company: 'Capsule Data Systems', location: 'Denver, CO', start: '2020-01', end: '2023-02', current: false, desc: '- Optimized distributed index pools scaling cluster throughput capacity from 15k to 85k requests per second.\n- Implemented strict telemetry pipelines monitoring application nodes executing real-time memory profile diagnostic operations.' }
        ];

        AppState.educations = [
            { degree: 'M.S. Distributed Systems Engineering', school: 'University of Texas at Austin', location: 'Austin, TX', start: '2018', end: '2020', grade: '3.96 / 4.0' },
            { degree: 'B.S. Computer Engineering', school: 'Georgia Institute of Technology', location: 'Atlanta, GA', start: '2014', end: '2018', grade: 'First Class Honors' }
        ];

        AppState.projects = [
            { name: 'Aegis Consensus Engine', tech: 'Rust, Raft Protocol, gRPC, Prometheus', desc: 'Custom implementation of a highly secure replicated state machine engine maintaining consistency thresholds across adversarial server nodes.', github: 'https://github.com/vance/aegis-core', live: '' }
        ];

        AppState.certifications = [
            { name: 'AWS Certified Solutions Architect – Professional', org: 'Amazon Web Services (AWS)', year: '2024' }
        ];

        AppState.extra = {
            languages: 'English (Native), German (Professional)',
            achievements: 'Awarded corporate "Top Technical Innovation Award" out of 4,000 global engineers.\nPlaced 2nd out of 500 competitors in World System Optimization Hackathon.',
            interests: 'Kernel Dev Research, Mountain Ultra-marathons, Amateur Cryptography'
        };

        const inputs = ['fullname', 'title', 'email', 'phone', 'address', 'linkedin', 'github', 'portfolio', 'summary'];
        inputs.forEach(f => { if(this.dom[f]) this.dom[f].value = AppState.personal[f]; });
        
        if(this.dom.languages) this.dom.languages.value = AppState.extra.languages;
        if(this.dom.achievements) this.dom.achievements.value = AppState.extra.achievements;
        if(this.dom.interests) this.dom.interests.value = AppState.extra.interests;

        AppState.experiences.forEach(e => this.createRepeaterNode('experience', document.getElementById('experience-list-container'), e));
        AppState.educations.forEach(ed => this.createRepeaterNode('education', document.getElementById('education-list-container'), ed));
        AppState.projects.forEach(p => this.createRepeaterNode('project', document.getElementById('project-list-container'), p));
        AppState.certifications.forEach(c => this.createRepeaterNode('certification', document.getElementById('certification-list-container'), c));

        ['Go', 'Rust', 'Python', 'Git', 'AWS', 'Docker', 'Linux', 'Problem Solving'].forEach(s => AppState.skills.add(s));
        
        this.syncPresetCheckboxesState();
        this.renderActiveTagsWrapper();
        this.updateSummaryCharacterCount();
        this.triggerRealtimePipeline();
    },

    formatMonth(yearMonthStr) {
        if(!yearMonthStr) return '';
        const parts = yearMonthStr.split('-');
        if(parts.length < 2) return yearMonthStr;
        const date = new Date(parts[0], parts[1] - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
};

const StorageEngine = {
    saveSession() {
        try {
            const structuralStateCopy = { ...AppState };
            structuralStateCopy.skills = Array.from(structuralStateCopy.skills);
            localStorage.setItem('NOVUS_RESUME_SESSION_BLOB', JSON.stringify(structuralStateCopy));
        } catch(err) { console.warn("Session auto-save writing blocked:", err); }
    },

    restoreSession() {
        try {
            const rawBlob = localStorage.getItem('NOVUS_RESUME_SESSION_BLOB');
            if(!rawBlob) return;
            const parsed = JSON.parse(rawBlob);
            
            if(parsed.personal) {
                AppState.personal = parsed.personal;
                const pFields = ['fullname', 'title', 'email', 'phone', 'address', 'linkedin', 'github', 'portfolio', 'summary'];
                pFields.forEach(f => { if(AppState.personal[f] && AppEngine.dom[f]) AppEngine.dom[f].value = AppState.personal[f]; });
                
                if(AppState.personal.avatarData) {
                    if (AppEngine.dom.avatarImg) AppEngine.dom.avatarImg.src = AppState.personal.avatarData;
                    if (AppEngine.dom.avatarPreviewBox) AppEngine.dom.avatarPreviewBox.classList.remove('hidden');
                    if (AppEngine.dom.dragZone) AppEngine.dom.dragZone.classList.add('hidden');
                }
            }

            if(parsed.extra) {
                AppState.extra = parsed.extra;
                ['languages', 'achievements', 'interests'].forEach(f => { if(AppState.extra[f] && AppEngine.dom[f]) AppEngine.dom[f].value = AppState.extra[f]; });
            }

            if(parsed.skills && Array.isArray(parsed.skills)) {
                AppState.skills = new Set(parsed.skills);
                AppEngine.syncPresetCheckboxesState();
                AppEngine.renderActiveTagsWrapper();
            }

            if(parsed.experiences && Array.isArray(parsed.experiences)) {
                parsed.experiences.forEach(e => {
                    AppState.experiences.push(e);
                    AppEngine.createRepeaterNode('experience', document.getElementById('experience-list-container'), e);
                });
            }
            if(parsed.educations && Array.isArray(parsed.educations)) {
                parsed.educations.forEach(ed => {
                    AppState.educations.push(ed);
                    AppEngine.createRepeaterNode('education', document.getElementById('education-list-container'), ed);
                });
            }
            if(parsed.projects && Array.isArray(parsed.projects)) {
                parsed.projects.forEach(p => {
                    AppState.projects.push(p);
                    AppEngine.createRepeaterNode('project', document.getElementById('project-list-container'), p);
                });
            }
            if(parsed.certifications && Array.isArray(parsed.certifications)) {
                parsed.certifications.forEach(c => {
                    AppState.certifications.push(c);
                    AppEngine.createRepeaterNode('certification', document.getElementById('certification-list-container'), c);
                });
            }
        } catch (e) {
            console.error('Session restorer fail:', e);
            this.purgeSession();
        }
    },

    purgeSession() {
        localStorage.removeItem('NOVUS_RESUME_SESSION_BLOB');
    }
};