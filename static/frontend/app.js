(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`/api`,t=`evalai_auth_token`;function n(e){return!e||typeof e!=`object`?``:Object.entries(e).map(([e,t])=>{let n=Array.isArray(t)?t.join(` `):String(t);return e===`detail`?n:`${e}: ${n}`}).filter(Boolean).join(` `)}async function r(r,i={}){let a=i.body instanceof FormData,o={Accept:`application/json`,...i.body&&!a?{"Content-Type":`application/json`}:{},...i.headers||{}},s=sessionStorage.getItem(t),c=r.startsWith(`/auth/login/`)||r.startsWith(`/auth/register/`);s&&!c&&(o.Authorization=`Token ${s}`);let l;try{l=await fetch(`${e}${r}`,{...i,headers:o})}catch{throw Error(`The EvalAI server could not be reached.`)}let u=await l.json().catch(()=>({}));if(!l.ok||u.success===!1){l.status===401&&(sessionStorage.removeItem(t),window.dispatchEvent(new Event(`evalai:unauthorized`)));let e=u.errors,r=typeof e?.detail==`string`?e.detail:null,i=n(e);throw Error(i||u.message||r||`The request was unsuccessful.`)}return u.data??u}var i={login:async(e,n)=>{let i=await r(`/auth/login/`,{method:`POST`,body:JSON.stringify({email:e,password:n})});return sessionStorage.setItem(t,i.token),i.user},register:async(e,n)=>{let i=await r(`/auth/register/${e.toLowerCase()}/`,{method:`POST`,body:JSON.stringify(n)});return sessionStorage.setItem(t,i.token),i.user},me:()=>r(`/auth/me/`),health:()=>r(`/health/`),students:()=>r(`/auth/students/`),logout:async()=>{try{sessionStorage.getItem(`evalai_auth_token`)&&await r(`/auth/logout/`,{method:`POST`})}finally{sessionStorage.removeItem(t)}},questions:()=>r(`/questions/`),question:e=>r(`/questions/${e}/`),createQuestion:e=>r(`/questions/`,{method:`POST`,body:JSON.stringify(e)}),subjectResources:()=>r(`/questions/subjects/`),subjectPipeline:e=>r(`/questions/subjects/${e}/pipeline/`),subjectEnrollments:e=>r(`/questions/subjects/${e}/enrollments/`),createSubjectWithDocuments:e=>r(`/questions/subjects/`,{method:`POST`,body:e}),replaceSubjectDocument:(e,t)=>r(`/questions/subjects/${e}/replace-document/`,{method:`POST`,body:t}),enrollStudent:(e,t)=>r(`/questions/subjects/${e}/enrollments/`,{method:`POST`,body:JSON.stringify({student_id:t})}),unenrollStudent:(e,t)=>r(`/questions/subjects/${e}/enrollments/${t}/`,{method:`DELETE`}),updateExtractedQuestion:(e,t)=>r(`/questions/extracted-questions/${e}/`,{method:`PATCH`,body:JSON.stringify(t)}),uploadMappedAnswerSheet:e=>r(`/submissions/answer-sheets/mapped-upload/`,{method:`POST`,body:e}),uploadSubjectAnswerSheet:(e,t)=>r(`/submissions/subjects/${e}/answer-sheets/`,{method:`POST`,body:t}),retrySubmission:e=>r(`/submissions/${e}/retry/`,{method:`POST`}),submissions:(e={})=>{let t=new URLSearchParams;Object.entries(e).forEach(([e,n])=>{n!=null&&n!==``&&t.set(e,n)});let n=t.toString();return r(`/submissions/${n?`?${n}`:``}`)},submission:e=>r(`/submissions/${e}/`),evaluate:e=>r(`/submissions/${e}/evaluate/`,{method:`POST`}),evaluationForSubmission:e=>r(`/submissions/${e}/evaluation/`),updateMarks:(e,t,n=``,i=null,a=``)=>r(`/evaluations/${e}/update-marks/`,{method:`POST`,body:JSON.stringify({approved_marks:t,teacher_comments:n,...a?{feedback:a}:{},...i?{question_evaluations:i}:{}})}),approveEvaluation:(e,t=``)=>r(`/evaluations/${e}/approve/`,{method:`POST`,body:JSON.stringify({teacher_comments:t})}),publishEvaluation:e=>r(`/evaluations/${e}/publish/`,{method:`POST`}),approveAndPublishEvaluation:(e,t=``)=>r(`/evaluations/${e}/approve-and-publish/`,{method:`POST`,body:JSON.stringify({teacher_comments:t})}),teacherDashboard:()=>r(`/dashboard/teacher/`),teacherAnalytics:()=>r(`/dashboard/teacher/analytics/`),studentDashboard:()=>r(`/dashboard/student/`),getAuthenticatedBlobUrl:async e=>{let n=sessionStorage.getItem(t),r=n?{Authorization:`Token ${n}`}:{},i=await fetch(e,{headers:r});if(!i.ok){let e=await i.json().catch(()=>({}));throw Error(e.message||`Failed to load document.`)}let a=await i.blob();return{blobUrl:URL.createObjectURL(a),mimeType:i.headers.get(`content-type`)||a.type||``,pageCount:Number(i.headers.get(`X-Document-Page-Count`)||1),pageNumber:Number(i.headers.get(`X-Document-Page-Number`)||1)}},downloadAuthenticatedFile:async(e,n)=>{let r=sessionStorage.getItem(t),i=r?{Authorization:`Token ${r}`}:{},a=await fetch(e,{headers:i});if(!a.ok){let e=await a.json().catch(()=>({}));throw Error(e.message||`Failed to download document.`)}let o=await a.blob(),s=URL.createObjectURL(o),c=document.createElement(`a`);c.href=s,n&&(c.download=n),document.body.appendChild(c),c.click(),setTimeout(()=>{c.remove(),URL.revokeObjectURL(s)},1e3)}},a=document.querySelector(`#app`),o={user:null,role:`teacher`,authMode:`login`,activeTab:{},pollTimer:null,pollInFlight:!1,aiMode:`unknown`,reviewMarks:{},reviewReasons:{},reviewComments:{},reviewFeedback:{},previewBlobUrl:null},s=(e=``)=>String(e??``).replace(/[&<>'"]/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,"'":`&#39;`,'"':`&quot;`})[e]),c=e=>s(typeof e==`string`?e:`Chunk `+(e.chunk_id??`?`)+`, page `+(e.page_number??`?`)+`: `+(e.text||``)),l=e=>e?new Date(e).toLocaleString():`—`,u=e=>e==null?`—`:Number(e).toFixed(2).replace(/\.00$/,``),d=()=>location.hash.replace(/^#\/?/,``)||(o.user?`${o.role.toLowerCase()}/dashboard`:`login`),f=e=>String(e||``).toUpperCase(),p=e=>`${f(e).toLowerCase()}/dashboard`,m=e=>{location.hash=`#/${e}`},h=e=>{let t={alert:`<path d="M12 9v4m0 4h.01M10.3 3.9 2.7 17.3a1.5 1.5 0 0 0 1.3 2.2h16a1.5 1.5 0 0 0 1.3-2.2L13.3 3.9a1.5 1.5 0 0 0-3 0Z"/>`,book:`<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z"/><path d="M4 17a2.5 2.5 0 0 1 2.5-2.5H20M8 7h8"/>`,chart:`<path d="M4 19V5m0 14h17M8 15l3-4 3 2 5-7"/>`,check:`<path d="m5 12 4 4L19 6"/>`,clock:`<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,download:`<path d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v3h14v-3"/>`,eye:`<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>`,eyeOff:`<path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a14 14 0 0 1-3.1 3.8M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10 10 0 0 0 4-.8"/>`,file:`<path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10Z"/><path d="M13 3v7h7M8 14h8m-8 4h8"/>`,grid:`<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/>`,logout:`<path d="M10 17l5-5-5-5m5 5H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>`,plus:`<path d="M12 5v14m-7-7h14"/>`,search:`<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>`,upload:`<path d="M12 16V4m0 0L8 8m4-4 4 4M5 14v5h14v-5"/>`,users:`<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 10v-2a4 4 0 0 0-3-3.87m-1-12.13a4 4 0 0 1 0 7.75"/>`,x:`<path d="m6 6 12 12M18 6 6 18"/>`};return`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${t[e]||t.file}</svg>`};function g(){document.querySelectorAll(`#app input[type='file']`).forEach(e=>{if(e.dataset.dropzoneReady)return;e.dataset.dropzoneReady=`true`;let t=document.createElement(`span`);t.className=`file-dropzone`;let n=document.createElement(`span`);n.className=`file-drop-prompt`,n.innerHTML=`${h(`upload`)}<span><strong>Choose a file or drop it here</strong><small></small></span>`;let r=n.querySelector(`small`),i=e.accept.split(`,`).map(e=>e.trim()).filter(Boolean);r.textContent=i.length?i.join(`, `).replace(/\./g,``).toUpperCase():`Select a file`;let a=document.createElement(`span`);a.className=`file-selection hidden`;let o=document.createElement(`span`);o.className=`file-selection-icon`,o.innerHTML=h(`file`);let s=document.createElement(`span`);s.className=`file-selection-info`;let c=document.createElement(`button`);c.type=`button`,c.className=`file-remove`,c.setAttribute(`aria-label`,`Remove selected file`),c.innerHTML=h(`x`),a.append(o,s,c);let l=document.createElement(`span`);l.className=`file-drop-error hidden`,l.setAttribute(`role`,`status`),e.before(t),t.append(e,n,a,l),e.addEventListener(`change`,()=>{let r=e.files?.[0];if(l.classList.add(`hidden`),t.classList.toggle(`has-file`,!!r),n.classList.toggle(`hidden`,!!r),a.classList.toggle(`hidden`,!r),r){let e=r.size<1048576?`${Math.max(1,Math.round(r.size/1024))} KB`:`${(r.size/1048576).toFixed(1)} MB`;s.textContent=`${r.name} · ${e}`,c.setAttribute(`aria-label`,`Remove selected file`)}else s.textContent=``,c.setAttribute(`aria-label`,`Remove selected file`)}),t.addEventListener(`dragover`,e=>{e.preventDefault(),t.classList.add(`is-dragging`)}),t.addEventListener(`dragleave`,e=>{t.contains(e.relatedTarget)||t.classList.remove(`is-dragging`)}),t.addEventListener(`drop`,n=>{n.preventDefault(),t.classList.remove(`is-dragging`);let r=n.dataTransfer?.files?.[0];if(!r)return;if(i.length&&!i.some(e=>e.startsWith(`.`)?r.name.toLowerCase().endsWith(e.toLowerCase()):e.endsWith(`/*`)?r.type.startsWith(e.slice(0,-1)):r.type===e)){l.textContent=`This file type is not accepted here.`,l.classList.remove(`hidden`);return}let a=new DataTransfer;a.items.add(r),e.files=a.files,e.dispatchEvent(new Event(`change`,{bubbles:!0}))}),c.addEventListener(`click`,t=>{t.preventDefault(),t.stopPropagation(),e.value=``,e.dispatchEvent(new Event(`change`,{bubbles:!0})),e.focus()})})}var _=(e,t=`info`)=>{document.querySelectorAll(`.toast`).forEach(e=>e.remove());let n=document.createElement(`div`);n.className=`toast toast-${t}`,n.textContent=e,document.body.appendChild(n),setTimeout(()=>n.remove(),4e3)};function v(){o.pollTimer&&=(clearInterval(o.pollTimer),null),o.pollInFlight=!1}function y(e){let t=String(e||``).toUpperCase(),n={UPLOADED:{label:`Uploaded`,cls:`status-uploaded`},PROCESSING:{label:`Processing…`,cls:`status-processing`},AI_EVALUATED:{label:`AI Evaluated`,cls:`status-ai_evaluated`},PENDING_TEACHER_REVIEW:{label:`Pending Review`,cls:`status-pending_teacher_review`},APPROVED:{label:`Approved`,cls:`status-approved`},PUBLISHED:{label:`Published`,cls:`status-published`},FAILED:{label:`Failed`,cls:`status-failed`},READY:{label:`Ready`,cls:`status-published`}}[t]||{label:t||`Unknown`,cls:`status-uploaded`};return`<span class="tag ${n.cls}">${s(n.label)}</span>`}function b(){return o.aiMode===`mock`?`<div class="mock-ai-banner" role="status"><strong>MOCK AI</strong><span>Deterministic demo scoring is active. Scores are not provider evaluations and require teacher review.</span></div>`:``}function x(e,t=`dashboard`){let n=o.role===`TEACHER`,r=n?[[`dashboard`,`Subjects`],[`analytics`,`Analytics`]]:[[`dashboard`,`My Subjects`],[`results`,`Published Results`]];return`
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">E</span>
        <div>
          <strong>EvalAI</strong>
          <small>AI Answer Evaluation</small>
        </div>
      </div>
      <nav class="space-y-1">
        ${r.map(([e,n])=>`
          <a href="#/${o.role.toLowerCase()}/${e}" class="nav-link ${t===e?`nav-link-active`:``}">
            <span class="nav-icon">${h(e===`analytics`?`chart`:e===`results`?`book`:`grid`)}</span>
            <span>${n}</span>
          </a>`).join(``)}
      </nav>
      <div class="sidebar-footer">
        <div class="user-chip">
          <div class="avatar">${s((o.user?.first_name||o.user?.username||`?`).slice(0,2).toUpperCase())}</div>
          <div class="min-w-0">
            <strong class="truncate">${s(o.user?.first_name||o.user?.username)}</strong>
            <small>${n?`Instructor`:`Student`}</small>
          </div>
        </div>
        <button id="logout" class="button button-ghost w-full">${h(`logout`)}<span>Sign out</span></button>
      </div>
    </aside>
    <main class="main-content">
      <header class="topbar">
        <div>
          <span class="eyebrow">${n?`Teacher workspace`:`Student portal`}</span>
          <h1>${n?`Unified Evaluation System`:`Enrolled Subjects & Results`}</h1>
        </div>
        <span class="status-pill">Connected</span>
      </header>
      ${b()}
      <nav class="mobile-nav">
        ${r.map(([e,n])=>`
          <a href="#/${o.role.toLowerCase()}/${e}" class="${t===e?`active`:``}">
            ${n}
          </a>`).join(``)}
      </nav>
      <section class="page-content">${e}</section>
    </main>
  </div>`}function S(){let e=o.authMode===`register`;return`
  <div class="auth-page">
    <div class="auth-panel">
      <div class="brand brand-large">
        <span class="brand-mark">E</span>
        <div>
          <strong>EvalAI</strong>
          <small>AI-Powered Answer Sheet Evaluation</small>
        </div>
      </div>
      ${b()}
      <div class="auth-copy">
        <span class="eyebrow">Rigorous & Explainable</span>
        <h1>Evaluate understanding with precision.</h1>
        <p>Unified subject workflow: upload question paper & answer key, process student sheets with Groq AI, and publish auditable verified marks.</p>
        <ul class="auth-features">
          <li>${h(`check`)}<span>Evidence-based marking</span></li>
          <li>${h(`check`)}<span>Teacher-approved results</span></li>
          <li>${h(`check`)}<span>Private to each student</span></li>
        </ul>
      </div>
      <div class="auth-note">Secure role-based access for teachers and students.</div>
    </div>
    <div class="auth-form-wrap">
      <div class="auth-form">
        <div class="role-tabs">
          <button type="button" data-role="teacher" aria-pressed="${o.role.toLowerCase()===`teacher`}" class="${o.role.toLowerCase()===`teacher`?`active`:``}">Teacher</button>
          <button type="button" data-role="student" aria-pressed="${o.role.toLowerCase()===`student`}" class="${o.role.toLowerCase()===`student`?`active`:``}">Student</button>
        </div>
        <h2>${e?`Create account`:`Sign in to EvalAI`}</h2>
        <p class="muted">${e?`Register with your institutional credentials.`:`Sign in to manage subjects and evaluations.`}</p>
        <div id="auth-error" class="error-box hidden"></div>
        <form id="auth-form" class="form-stack">
          ${e?`<label>Full name<input name="fullName" required autocomplete="name"></label>`:``}
          <label>Email<input name="email" type="email" required autocomplete="email"></label>
          ${e?`<label>Username<input name="username" required autocomplete="username"></label>`:``}
          <label>Password<div class="password-control"><input name="password" type="password" required minlength="6" autocomplete="${e?`new-password`:`current-password`}"><button type="button" class="password-toggle" data-password-toggle aria-label="Show password" aria-pressed="false">${h(`eye`)}</button></div></label>
          ${e?`<label>Confirm password<div class="password-control"><input name="confirmPassword" type="password" required minlength="6" autocomplete="new-password"><button type="button" class="password-toggle" data-password-toggle aria-label="Show password" aria-pressed="false">${h(`eye`)}</button></div></label>`:``}
          <button class="button button-primary w-full" type="submit">${e?`Create account`:`Sign in`}</button>
        </form>
        <button id="auth-switch" class="text-button">${e?`Already have an account? Sign in`:`Create a new account`}</button>
      </div>
    </div>
  </div>`}function C(e,t,n=`blue`){return`<div class="metric-card accent-${n}"><span>${e}</span><strong>${t??0}</strong></div>`}function w(e,t=``){return`<div class="empty-state"><p>${s(e)}</p>${t}</div>`}function T(e,t,n){let r=t?`Complete`:n?`In progress`:`Waiting`;return`<li class="pipeline-step ${t?`complete`:n?`current`:``}" ${n?`aria-current="step"`:``}>
    <span class="pipeline-step-indicator">${t?h(`check`):``}</span>
    <span class="pipeline-step-copy"><strong>${s(e)}</strong><small>${r}</small></span>
  </li>`}async function E(){v();let[e,t]=await Promise.all([i.teacherDashboard().catch(()=>({metrics:{}})),i.subjectResources().catch(()=>({resources:[]}))]),n=e.metrics||{},r=t.resources||[];return x(`
    <div class="page-heading">
      <div>
        <span class="eyebrow">Subjects Catalogue</span>
        <h2>Subject Management</h2>
        <p>Create and select a subject to manage question papers, enrolled students, and student evaluations.</p>
      </div>
      <button id="open-create-subject-modal" class="button button-primary" type="button" aria-haspopup="dialog">${h(`plus`)} Create subject</button>
    </div>

    <div class="metric-grid">
      ${C(`Total Subjects`,r.length,`blue`)}
      ${C(`Submissions`,n.total_submissions||0,`teal`)}
      ${C(`Pending Reviews`,n.pending_reviews||0,`amber`)}
      ${C(`Approved / Published`,n.approved_evaluations||0,`purple`)}
    </div>

    <dialog id="create-subject-modal" class="create-subject-dialog" aria-labelledby="create-subject-title">
      <div class="dialog-heading">
        <div>
          <span class="eyebrow">New subject</span>
          <h2 id="create-subject-title">Create a subject</h2>
          <p class="muted">Add the subject details and upload its question paper and reference PDF.</p>
        </div>
        <button id="close-create-subject-modal" class="button button-ghost dialog-close" type="button" aria-label="Close create subject dialog">${h(`x`)}</button>
      </div>
      <section class="card">
        <form id="create-subject-form" class="form-grid" enctype="multipart/form-data">
          <label>Subject Name *<input name="name" required placeholder="e.g. Software Engineering"></label>
          <label>Subject Code<input name="code" placeholder="e.g. CS-401"></label>
          <label>Semester<input name="semester" placeholder="e.g. Semester 5"></label>
          <label>Academic Year<input name="academic_year" placeholder="e.g. 2026-2027"></label>
          <label>Question Paper PDF *<input name="question_paper" type="file" required accept=".pdf"></label>
          <label>Reference / Answer Key PDF *<input name="reference_notes" type="file" required accept=".pdf"></label>
          <label class="full">Subject Description / Evaluation Notes<textarea name="notes_description" rows="2" placeholder="Optional notes for evaluation scheme..."></textarea></label>
          <div class="full">
            <button class="button button-primary" type="submit">${h(`upload`)} Create Subject & Index PDFs</button>
          </div>
        </form>
      </section>
    </dialog>

    <section class="space-y-4">
      <div class="section-heading">
        <h3>Existing Subjects (${r.length})</h3>
      </div>
      <div class="question-grid">
        ${r.length?r.map(e=>`
          <div class="question-card">
            <div class="question-meta">
              <span class="tag">${s(e.code||`SUBJECT`)}</span>
              <span>${s(e.semester||``)} ${s(e.academic_year||``)}</span>
            </div>
            <h3>${s(e.name)}</h3>
            <p>${s(e.notes_description||`Question paper and reference documents configured.`)}</p>
            <div class="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>${h(`users`)} ${e.enrolled_count??0} Enrolled students</span>
            </div>
            <a class="button button-primary mt-4" href="#/teacher/subject/${e.id}">Open Subject Workspace →</a>
          </div>`).join(``):w(`No subjects created yet. Use the form above to create your first subject.`)}
      </div>
    </section>
  `,`dashboard`)}async function D(e){v();let t=o.activeTab[e]||`overview`,[n,r,a,c,f]=await Promise.all([i.subjectResources(),i.subjectPipeline(e).catch(()=>({})),i.students(),i.subjectEnrollments(e),i.submissions({subject:e}).catch(()=>({submissions:[]}))]),p=(n.resources||[]).find(t=>String(t.id)===String(e));if(!p)throw Error(`Subject not found.`);let m=a.students||[],g=new Set((c.enrollments||[]).map(e=>String(e.student)));p.enrolled_students=m.filter(e=>g.has(String(e.id)));let _=f.submissions||[];(r.status===`PROCESSING`||r.status===`PENDING`||_.some(e=>e.status===`PROCESSING`||e.status===`UPLOADED`))&&(o.pollTimer=setInterval(async()=>{if(!o.pollInFlight){if(!d().startsWith(`teacher/subject/${e}`))v();else{o.pollInFlight=!0;try{let[t,n]=await Promise.all([i.subjectPipeline(e),i.submissions({subject:e})]);t.status===`PROCESSING`||t.status===`PENDING`||(n.submissions||[]).some(e=>e.status===`PROCESSING`||e.status===`UPLOADED`)||(v(),P())}catch{}finally{o.pollInFlight=!1}}}},3e3));let b=(r.question_papers||[])[0],S=b?.questions||[],C=(r.reference_documents||[])[0],E=r.documents||[],D=E.find(e=>e.kind===`reference`),O=E.find(e=>e.kind===`question_paper`),k=C?.processing_status||D?.status||``,A=b?.processing_status||O?.status||``,j=k===`COMPLETED`&&Number(r.reference_chunks_count||0)>0,M=A===`COMPLETED`&&S.length>0,N=S.some(e=>e.maximum_marks==null),F=r.is_ready===!0&&j&&M&&!N,I=``;if(t===`overview`){let e=S.reduce((e,t)=>e+(Number(t.maximum_marks)||0),0),t=[!!(E.length||b||C||p.question_paper_url||p.reference_material_url),j,M&&!N,F],n=t.findIndex(e=>!e);I=`
      <div class="space-y-6">
        <!-- Pipeline processing status -->
        <div class="card">
          <div class="section-heading">
            <div>
              <h3>Documents & Processing Pipeline</h3>
              <span class="muted">Status of canonical PDFs and extracted knowledge chunks</span>
            </div>
            <div>${y(r.status||(r.is_ready?`READY`:`PROCESSING`))}</div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 my-3">
            <div class="p-3 bg-slate-50 rounded-xl">
              <span class="text-xs text-slate-500 font-semibold block">Total Document Pages</span>
              <strong class="text-xl block mt-1">${r.total_pages??0} pages</strong>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl">
              <span class="text-xs text-slate-500 font-semibold block">Extracted Questions</span>
              <strong class="text-xl block mt-1">${r.extracted_questions_count??S.length} questions</strong>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl">
              <span class="text-xs text-slate-500 font-semibold block">Reference Chunks</span>
              <strong class="text-xl block mt-1">${r.reference_chunks_count??0} chunks</strong>
            </div>
          </div>
          <ol class="pipeline-stepper" aria-label="Subject document processing steps">
            ${T(`PDFs uploaded`,t[0],n===0)}
            ${T(`Reference indexed`,t[1],n===1)}
            ${T(`Questions verified`,t[2],n===2)}
            ${T(`Evaluation ready`,t[3],n===3)}
          </ol>
          ${r.latest_error?`<div class="error-box">Extraction error: ${s(r.latest_error)}</div>`:``}
          <div class="mt-4 flex flex-wrap gap-4 pt-3 border-t border-slate-100">
            ${p.question_paper_url?`<button class="button button-secondary text-xs" data-download-url="${s(p.question_paper_url)}" data-filename="question_paper_${s(p.code||p.id)}.pdf">${h(`download`)} Download Question Paper</button>`:``}
            ${p.reference_material_url?`<button class="button button-secondary text-xs" data-download-url="${s(p.reference_material_url)}" data-filename="reference_notes_${s(p.code||p.id)}.pdf">${h(`download`)} Download Reference Material</button>`:``}
          </div>
        </div>

        <!-- Replace documents form -->
        <div class="card">
          <div class="section-heading">
            <div>
              <h3>Replace Documents</h3>
              <span class="muted">Upload new versions. Existing evaluations continue to reference the version they were graded with.</span>
            </div>
          </div>
          <form id="replace-doc-form" class="form-grid" enctype="multipart/form-data">
            <input type="hidden" name="subject_id" value="${p.id}">
            <label>Document Kind
              <select name="kind" required>
                <option value="question_paper">Question Paper (PDF)</option>
                <option value="reference">Reference / Answer Key (PDF)</option>
              </select>
            </label>
            <label>New PDF File
              <input name="file" type="file" required accept=".pdf">
            </label>
            <div class="full">
              <button class="button button-secondary" type="submit">Upload & Re-index Document</button>
            </div>
          </form>
        </div>

        <!-- Extracted questions table -->
        <div class="card">
          <div class="section-heading">
            <div>
              <h3>Extracted Questions (${S.length})</h3>
              <span class="muted">Review and correct question segmentation or maximum marks. Changes immediately update exam grading criteria.</span>
            </div>
            <div class="text-right">
              <span class="text-xs text-slate-500 block">Total Marks:</span>
              <strong class="text-lg text-blue-700">${u(e)}</strong>
            </div>
          </div>
          ${S.length?`
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style="width: 80px">Number</th>
                    <th>Question Text</th>
                    <th style="width: 130px">Max Marks</th>
                    <th style="width: 100px">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${S.map(e=>`
                    <tr>
                      <td class="font-bold">${s(e.number||`#${e.id}`)}</td>
                      <td>
                        <textarea class="w-full text-sm border border-slate-200 rounded-lg p-2" rows="2" id="q-text-${e.id}">${s(e.text)}</textarea>
                      </td>
                      <td>
                        <input class="w-full text-sm border border-slate-200 rounded-lg p-2" type="number" step="0.5" min="0" id="q-marks-${e.id}" value="${e.maximum_marks??``}">
                      </td>
                      <td>
                        <button class="button button-secondary text-xs save-extracted-q" data-qid="${e.id}">Save</button>
                      </td>
                    </tr>`).join(``)}
                </tbody>
              </table>
            </div>`:w(`No questions extracted yet. Please upload a Question Paper PDF.`)}
        </div>
      </div>`}else if(t===`students`){let e=new Set((p.enrolled_students||[]).map(e=>e.id)),t=p.enrolled_students||[],n=m.filter(t=>!e.has(t.id));I=`
      <div class="space-y-6">
        <div class="card">
          <div class="section-heading">
            <div>
              <h3>Enrolled Students (${t.length})</h3>
              <span class="muted">Students enrolled in this subject can view published results and materials.</span>
            </div>
          </div>

          <div class="my-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 class="text-sm font-bold text-slate-800 mb-2">Enroll Registered Student</h4>
            <div class="flex flex-wrap gap-2 items-center">
              <select id="enroll-student-select" class="flex-1 min-w-[240px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
                ${n.length?n.map(e=>`
                    <option value="${e.id}">${s(e.first_name||e.username)} (${s(e.username)} - ${s(e.email)})</option>`).join(``):`<option value="">All registered students are already enrolled</option>`}
              </select>
              <button id="enroll-student-btn" class="button button-primary" ${n.length?``:`disabled`}>Enroll Student</button>
            </div>
          </div>

          ${t.length?`
            <div class="student-list-toolbar">
              <p class="muted">Manage the students who can access this subject.</p>
              <label class="student-search" for="enrolled-student-search">
                ${h(`search`)}
                <span class="sr-only">Search enrolled students</span>
                <input id="enrolled-student-search" type="search" placeholder="Search by name, username or email">
              </label>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${t.map(e=>`
                    <tr class="enrolled-student-row">
                      <td>
                        <div class="student-cell">
                          <span class="avatar student-row-avatar">${s((e.first_name||e.username||`?`).slice(0,2).toUpperCase())}</span>
                          <strong>${s(e.first_name||e.username)} ${s(e.last_name||``)}</strong>
                        </div>
                      </td>
                      <td>${s(e.username)}</td>
                      <td>${s(e.email||`—`)}</td>
                      <td>
                        <button class="button button-outline text-xs unenroll-btn" data-sid="${e.id}">Unenroll</button>
                      </td>
                    </tr>`).join(``)}
                </tbody>
              </table>
            </div>
            <div id="student-search-empty" class="empty-state student-search-empty hidden" role="status">No enrolled students match this search.</div>`:w(`No students are enrolled in this subject yet. Enroll a student above.`)}
        </div>
      </div>`}else if(t===`answer_sheets`){let e=p.enrolled_students||[],t=[];e.length||t.push(`Enroll a student in this subject before uploading an answer sheet.`),k===`FAILED`?t.push(`Reference PDF processing failed: `+(C?.processing_error||D?.error||r.latest_error||`Replace it with a searchable PDF and upload it again.`)):k?j||t.push(`The subject reference PDF is still processing. This form will be enabled when processing completes.`):t.push(`Upload a reference PDF in Overview & Documents before uploading answer sheets.`),A===`FAILED`?t.push(`Question paper processing failed: `+(b?.processing_error||O?.error||r.latest_error||`Replace it with a searchable PDF and upload it again.`)):A?M||t.push(`The question paper is still processing or has no extracted questions.`):t.push(`Upload a question paper in Overview & Documents before uploading answer sheets.`),M&&N&&t.push(`Add maximum marks to every extracted question in Overview & Documents first.`);let n=e.length>0&&F;I=`
      <div class="space-y-6">
        <!-- Answer sheet upload form -->
        <div class="card">
          <div class="section-heading">
            <div>
              <h3>Upload Student Answer Sheet</h3>
              <span class="muted">Upload handwritten scans or PDFs for an enrolled student. Automatically triggers Groq AI transcription, segmentation, and evaluation.</span>
            </div>
          </div>
          <form id="upload-answer-sheet-form" class="form-grid" enctype="multipart/form-data">
            <input type="hidden" name="subject_id" value="${p.id}">
            <label>Select Enrolled Student *
              <select name="student_id" required>
                ${e.length?e.map(e=>`
                    <option value="${e.id}">${s(e.first_name||e.username)} (${s(e.username)})</option>`).join(``):`<option value="">No enrolled students. Please enroll students first.</option>`}
              </select>
            </label>
            <label>Answer Sheet File (PDF, PNG, JPG, JPEG, WEBP) *
              <input name="document" type="file" required accept=".pdf,.png,.jpg,.jpeg,.webp">
            </label>
            <div class="full">
              <button class="button button-primary" type="submit" ${n?``:`disabled`}>Upload & Run AI Evaluation</button>
              ${t.length?`<div class="muted mt-2" role="status"><ul class="list-disc pl-5">${t.map(e=>`<li>${s(e)}</li>`).join(``)}</ul></div>`:``}
            </div>
          </form>
        </div>

        <!-- Submissions table -->
        <div class="card">
          <div class="section-heading">
            <div>
              <h3>Subject Submissions (${_.length})</h3>
              <span class="muted">Track student attempts and evaluation status</span>
            </div>
          </div>
          ${_.length?`
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Attempt ID</th>
                    <th>Student</th>
                    <th>Uploaded</th>
                    <th>Status</th>
                    <th>Confidence</th>
                    <th>Score</th>
                    <th>Flags</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${_.map(e=>{let t=e.evaluation,n=t?.confidence==null?null:Math.round(Number(t.confidence)*100),r=t?.needs_attention;return`
                      <tr>
                        <td><strong>#${e.id}</strong></td>
                        <td>
                          <strong>${s(e.student_name||`Student`)}</strong>
                          <small>${s(e.student_username||``)}</small>
                        </td>
                        <td>${l(e.submitted_at)}</td>
                        <td>${y(e.status)}</td>
                        <td>
                          ${n==null?`—`:`<div class="confidence-meter">
                                  <span>${n}%</span>
                                  <div class="meter-bar"><div class="meter-fill" style="width: ${n}%"></div></div>
                                </div>`}
                        </td>
                        <td>
                          ${t?`<strong class="text-blue-700">${u(t.teacher_approved_marks??t.suggested_marks)}</strong> / ${u(t.max_marks)}`:`—`}
                        </td>
                        <td>
                          ${r?`<span class="badge-attention">Needs Review</span>`:``}
                          ${e.status===`FAILED`&&e.processing_error?`<span class="badge-flag" title="${s(e.processing_error)}">Error</span>`:``}
                        </td>
                        <td>
                          <div class="flex items-center gap-2">
                            ${e.status===`FAILED`?`<button class="button button-secondary text-xs retry-eval-btn" data-subid="${e.id}">Retry</button>`:``}
                            <a class="button button-secondary text-xs" href="#/teacher/review/${e.id}">Review →</a>
                          </div>
                        </td>
                      </tr>`}).join(``)}
                </tbody>
              </table>
            </div>`:w(`No answer sheets uploaded for this subject yet.`)}
        </div>
      </div>`}else if(t===`review`){let e=o.reviewFilter||`all`,t=_;e===`attention`?t=_.filter(e=>e.evaluation?.needs_attention):e===`pending`?t=_.filter(e=>e.status===`PENDING_TEACHER_REVIEW`||e.status===`AI_EVALUATED`):e===`published`&&(t=_.filter(e=>e.status===`PUBLISHED`)),I=`
      <div class="space-y-6">
        <div class="card">
          <div class="section-heading">
            <div>
              <h3>Evaluation Review Queue</h3>
              <span class="muted">Filter by status and inspect AI recommendations</span>
            </div>
            <div class="flex gap-2">
              <button class="button ${e===`all`?`button-primary`:`button-secondary`} text-xs filter-btn" data-filter="all">All (${_.length})</button>
              <button class="button ${e===`attention`?`button-primary`:`button-secondary`} text-xs filter-btn" data-filter="attention">Needs Attention</button>
              <button class="button ${e===`pending`?`button-primary`:`button-secondary`} text-xs filter-btn" data-filter="pending">Pending Review</button>
              <button class="button ${e===`published`?`button-primary`:`button-secondary`} text-xs filter-btn" data-filter="published">Published</button>
            </div>
          </div>

          ${t.length?`
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Uploaded</th>
                    <th>Status</th>
                    <th>AI Score</th>
                    <th>Final Score</th>
                    <th>Confidence</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${t.map(e=>{let t=e.evaluation;return`
                      <tr>
                        <td>
                          <strong>${s(e.student_name||`Student`)}</strong>
                          <small>${s(e.student_username||``)}</small>
                        </td>
                        <td>${l(e.submitted_at)}</td>
                        <td>${y(e.status)} ${t?.needs_attention?`<span class="badge-attention ml-1">Flagged</span>`:``}</td>
                        <td>${t?`${u(t.suggested_marks)} / ${u(t.max_marks)}`:`—`}</td>
                        <td>${t?.teacher_approved_marks==null?`—`:`${u(t.teacher_approved_marks)} / ${u(t.max_marks)}`}</td>
                        <td>${t?.confidence==null?`—`:`${Math.round(Number(t.confidence)*100)}%`}</td>
                        <td>
                          <a class="button button-primary text-xs" href="#/teacher/review/${e.id}">Review Evaluation →</a>
                        </td>
                      </tr>`}).join(``)}
                </tbody>
              </table>
            </div>`:w(`No submissions matching "${e}" filter.`)}
        </div>
      </div>`}return x(`
    <div class="page-heading">
      <div>
        <span class="eyebrow">${s(p.code||`SUBJECT`)}</span>
        <h2>${s(p.name)}</h2>
        <p>${s(p.notes_description||`Unified subject workspace`)}</p>
      </div>
    </div>

    <!-- Workspace Tabs -->
    <nav class="tabs-nav">
      <button class="tab-btn ${t===`overview`?`active`:``}" data-tab="overview">Overview & Documents</button>
      <button class="tab-btn ${t===`students`?`active`:``}" data-tab="students">Students (${(p.enrolled_students||[]).length})</button>
      <button class="tab-btn ${t===`answer_sheets`?`active`:``}" data-tab="answer_sheets">Answer Sheets (${_.length})</button>
      <button class="tab-btn ${t===`review`?`active`:``}" data-tab="review">Review Queue</button>
    </nav>

    ${I}
  `,`dashboard`)}async function O(e){v();let[t,n]=await Promise.all([i.submission(e),i.evaluationForSubmission(e).catch(()=>({evaluation:null}))]),r=t.submission,a=n.evaluation||r.evaluation;if(o.selectedSubmission=r,o.selectedEvaluation=a,!a)return x(`
      <div class="page-heading">
        <div>
          <a class="back-link" href="#/teacher/subject/${r.subject||``}">← Back to subject</a>
          <h2>Submission #${r.id} Evaluation</h2>
          <p>Student: ${s(r.student_name)} · Status: ${s(r.status)}</p>
        </div>
      </div>
      <div class="card empty-state">
        <p>No evaluation records found for this submission.</p>
        ${r.status===`FAILED`?`<div class="error-box my-4">Failure reason: ${s(r.processing_error||`Unknown AI error`)}</div>`:``}
        ${r.status===`FAILED`?`<button class="button button-primary mt-4 retry-eval-btn" data-subid="${r.id}">Retry AI Evaluation</button>`:``}
      </div>
    `,`dashboard`);let d=a.question_evaluations||[],f=a.max_marks||d.reduce((e,t)=>e+(Number(t.maximum_marks??t.max_marks)||0),0);d.forEach(e=>{o.reviewMarks[e.id]===void 0&&(o.reviewMarks[e.id]=e.teacher_approved_marks??e.ai_marks??e.marks_awarded??0),o.reviewReasons[e.id]===void 0&&(o.reviewReasons[e.id]=e.teacher_override_reason||``),o.reviewComments[e.id]===void 0&&(o.reviewComments[e.id]=e.teacher_comments||``),o.reviewFeedback[e.id]===void 0&&(o.reviewFeedback[e.id]=e.feedback||``)});let p=d.reduce((e,t)=>{let n=Number(o.reviewMarks[t.id]);return e+(isNaN(n)?0:n)},0),m=a.confidence==null?null:Math.round(Number(a.confidence)*100);return x(`
    <div class="page-heading">
      <div>
        <a class="back-link" href="#/teacher/subject/${r.subject||``}">← Back to subject</a>
        <div class="flex items-center gap-3">
          <h2>Submission #${r.id} Review</h2>
          ${y(r.status)}
          ${a.needs_attention?`<span class="badge-attention">Needs Attention</span>`:``}
        </div>
        <p>Student: <strong>${s(r.student_name)}</strong> (${s(r.student_username)}) · Submitted ${l(r.submitted_at)}</p>
      </div>
      <div class="text-right">
        <span class="text-xs text-slate-500 block uppercase font-bold tracking-wider">Live Total Marks</span>
        <strong class="text-3xl font-black text-blue-700" id="live-total-display">${u(p)}</strong>
        <span class="text-sm text-slate-500 font-semibold"> / ${u(f)} max</span>
      </div>
    </div>

    <!-- Split Pane Review -->
    <div class="review-split">
      <!-- Left: Answer Sheet Viewer -->
      <div class="sheet-viewer-pane">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-sm font-bold text-slate-800">Original Answer Sheet</h3>
          <button class="button button-secondary text-xs" id="download-sheet-btn" data-url="${s(r.answer_sheet_url)}" data-filename="answer_sheet_${r.id}">${h(`download`)} Download</button>
        </div>
        <div id="sheet-preview-container" class="min-h-[400px] flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden">
          <span class="text-xs text-slate-400">Loading document preview…</span>
        </div>
      </div>

      <!-- Right: Question-wise evaluation cards & actions -->
      <div class="evaluation-pane">
        <!-- Overall summary banner -->
        <div class="card">
          <div class="section-heading">
            <h3 class="text-base">Overall AI Assessment</h3>
            ${m==null?``:`<div class="confidence-meter">
                    <span class="text-slate-600 font-bold">Confidence: ${m}%</span>
                    <div class="meter-bar w-24"><div class="meter-fill" style="width: ${m}%"></div></div>
                  </div>`}
          </div>
          <p class="text-sm text-slate-700 leading-relaxed">AI feedback: ${s(a.feedback||`Evaluation completed.`)}</p>
          <label class="text-xs font-bold text-slate-700 block mt-3 mb-1" for="overall-feedback-input">Edited Overall Feedback</label>
          <textarea id="overall-feedback-input" class="w-full text-sm border border-slate-300 rounded-xl p-3" rows="3">${s(a.feedback||``)}</textarea>
          <div class="mt-4 pt-4 border-t border-slate-100">
            <label class="text-xs font-bold text-slate-700 block mb-1">Overall Teacher Comments (published to student)</label>
            <textarea id="overall-teacher-comments" class="w-full text-sm border border-slate-300 rounded-xl p-3" rows="2" placeholder="Add optional overarching feedback...">${s(a.teacher_comments||``)}</textarea>
          </div>
        </div>

        <!-- Question Cards -->
        <div class="space-y-5" id="questions-container">
          ${d.map((e,t)=>{e.confidence!=null&&Math.round(Number(e.confidence)*100);let n=(e.flags||[]).length>0,r=e.correct_points||[],i=e.mistakes||[],a=e.missing_concepts||[],l=e.evidence||[],d=Number(e.maximum_marks??e.max_marks??0),f=o.reviewMarks[e.id];return`
              <div class="q-eval-card" data-qid="${e.id}">
                <div class="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span class="eyebrow">Question ${s(e.question_number||t+1)}</span>
                    <h4 class="font-bold text-slate-900 mt-0.5">${s(e.question_text||`Question ${e.question_number||t+1}`)}</h4>
                  </div>
                  <div class="text-right">
                    <span class="text-xs text-slate-500 font-bold block">AI Suggested</span>
                    <span class="font-mono font-bold text-slate-700">${u(e.ai_marks??e.awarded_marks)} / ${u(d)}</span>
                  </div>
                </div>

                <!-- Flag Badges -->
                ${n?`<div class="flex flex-wrap gap-1.5">
                        ${e.flags.map(e=>`<span class="badge-flag">${h(`alert`)} ${s(e.replace(/_/g,` `))}</span>`).join(``)}
                      </div>`:``}

                <!-- Transcribed student answer -->
                <div class="bg-slate-50 p-3 rounded-xl">
                  <span class="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Student Answer (Transcribed)</span>
                  <p class="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-mono">${s(e.student_answer||`No response transcribed for this question.`)}</p>
                </div>

                <!-- Expected answer from reference -->
                ${e.expected_answer?`<div class="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                        <span class="text-xs font-bold text-blue-700 uppercase tracking-wide block mb-1">Expected Answer (Reference Scheme)</span>
                        <p class="text-xs text-slate-700 leading-relaxed">${s(e.expected_answer)}</p>
                      </div>`:``}

                <!-- Breakdown of Points & Mistakes -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div class="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <span class="font-bold text-emerald-800 block mb-1.5">${h(`check`)} Correct Concepts Identified</span>
                    ${r.length?`<ul class="list-disc pl-4 space-y-1 text-slate-700">${r.map(e=>`<li>${s(e)}</li>`).join(``)}</ul>`:`<span class="text-slate-400">None identified</span>`}
                  </div>
                  <div class="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                    <span class="font-bold text-rose-800 block mb-1.5">${h(`x`)} Mistakes / Inaccuracies</span>
                    ${i.length?`<ul class="list-disc pl-4 space-y-1 text-slate-700">${i.map(e=>`<li>${s(e)}</li>`).join(``)}</ul>`:`<span class="text-slate-400">None identified</span>`}
                  </div>
                </div>

                ${a.length?`<div class="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-xs">
                        <span class="font-bold text-amber-800 block mb-1.5">Missing Key Concepts</span>
                        <ul class="list-disc pl-4 space-y-1 text-slate-700">${a.map(e=>`<li>${s(e)}</li>`).join(``)}</ul>
                      </div>`:``}

                <!-- Evidence quotes & reference citation -->
                <div class="space-y-2 text-xs">
                  ${l.length?`<div>
                          <span class="font-bold text-slate-600 block mb-1">Verified Student Quotes:</span>
                          <div class="flex flex-wrap gap-1.5">
                            ${l.map(e=>`<span class="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700 font-mono">“${s(e)}”</span>`).join(``)}
                          </div>
                        </div>`:``}
                  ${(e.reference_evidence||[]).length?`<div class="text-slate-500">
                          <span class="font-semibold">Reference Citation:</span>
                          <ul class="list-disc pl-4">${e.reference_evidence.map(e=>`<li>${c(e)}</li>`).join(``)}</ul>
                        </div>`:``}
                </div>

                <!-- Justification & Improvement -->
                ${e.justification||e.improvement_suggestions?`<div class="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                        ${e.justification?`<p><strong>Justification:</strong> ${s(e.justification)}</p>`:``}
                        ${e.improvement_suggestions?`<p><strong>Suggestions:</strong> ${s(e.improvement_suggestions)}</p>`:``}
                      </div>`:``}

                <!-- Teacher Marks Edit & Override -->
                <div class="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label class="text-xs font-bold text-slate-700 block mb-1">Final Marks (0 - ${u(d)})</label>
                    <input type="number" step="0.5" min="0" max="${d}" class="q-mark-input w-full rounded-xl border border-slate-300 p-2 text-sm font-bold text-blue-700" data-qid="${e.id}" data-max="${d}" value="${f}">
                  </div>
                  <div>
                    <label class="text-xs font-bold text-slate-700 block mb-1">Teacher Override Reason</label>
                    <input type="text" class="q-reason-input w-full rounded-xl border border-slate-300 p-2 text-xs" data-qid="${e.id}" placeholder="If altering AI score..." value="${s(o.reviewReasons[e.id])}">
                  </div>
                  <div>
                    <label class="text-xs font-bold text-slate-700 block mb-1">Teacher Notes</label>
                    <input type="text" class="q-comments-input w-full rounded-xl border border-slate-300 p-2 text-xs" data-qid="${e.id}" placeholder="Feedback for student..." value="${s(o.reviewComments[e.id])}">
                  </div>
                  <div class="md:col-span-3">
                    <label class="text-xs font-bold text-slate-700 block mb-1">Question Feedback</label>
                    <textarea class="q-feedback-input w-full rounded-xl border border-slate-300 p-2 text-xs" data-qid="${e.id}" rows="2">${s(o.reviewFeedback[e.id]??e.feedback??``)}</textarea>
                  </div>
                </div>
              </div>`}).join(``)}
        </div>

        <!-- Action Bar -->
        <div class="card sticky bottom-4 shadow-xl border-blue-200 bg-white/95 backdrop-blur flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <button class="button button-secondary" id="save-draft-btn">Save Draft Edits</button>
            <button class="button button-success" id="approve-publish-btn">Approve & Publish to Student</button>
          </div>
          <div class="text-right">
            <span class="text-xs text-slate-500 font-semibold">Student sees results only after publish</span>
          </div>
        </div>
      </div>
    </div>
  `,`dashboard`)}async function k(){v();let[e,t]=await Promise.all([i.subjectResources().catch(()=>({resources:[]})),i.studentDashboard().catch(()=>({metrics:{},recent_submissions:[]}))]),n=e.resources||[],r=t.metrics||{},a=r.reviewed_count?`${r.average_score_percentage??0}%`:`—`;return x(`
    <div class="page-heading">
      <div>
        <span class="eyebrow">Student Portal</span>
        <h2>My Enrolled Subjects</h2>
        <p>Access subject question papers, reference notes, and published evaluation feedback.</p>
      </div>
    </div>

    <div class="metric-grid">
      ${C(`Enrolled Subjects`,n.length,`blue`)}
      ${C(`Submissions Made`,r.total_submissions||0,`teal`)}
      ${C(`Published Evaluations`,r.reviewed_count||0,`purple`)}
      ${C(`Average Score`,a,`amber`)}
    </div>

    <section class="space-y-4">
      <div class="section-heading">
        <h3>Enrolled Subjects (${n.length})</h3>
      </div>
      <div class="question-grid">
        ${n.length?n.map(e=>`
          <div class="question-card">
            <div class="question-meta">
              <span class="tag">${s(e.code||`SUBJECT`)}</span>
              <span>${s(e.semester||``)}</span>
            </div>
            <h3>${s(e.name)}</h3>
            <p>${s(e.notes_description||`Instructor materials and published results.`)}</p>
            <a class="button button-primary mt-4" href="#/student/subject/${e.id}">View Subject Materials & Results →</a>
          </div>`).join(``):w(`You are not enrolled in any subjects yet. Your teacher must enroll you.`)}
      </div>
    </section>
  `,`dashboard`)}async function A(e){v();let t=o.activeTab[e]||`materials`,[n,r]=await Promise.all([i.subjectResources(),i.submissions({subject:e}).catch(()=>({submissions:[]}))]),a=(n.resources||[]).find(t=>String(t.id)===String(e));if(!a)throw Error(`Subject not found or you are not enrolled.`);let d=r.submissions||[],f=``;return t===`materials`?f=`
      <div class="card space-y-5">
        <div class="section-heading">
          <div>
            <h3>Official Subject Materials</h3>
            <span class="muted">Download question papers and reference schemes authorized by your instructor</span>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <strong class="block text-slate-800">Question Paper PDF</strong>
              <small class="text-slate-500">Official questions for this course</small>
            </div>
            ${a.question_paper_url?`<button class="button button-primary text-xs" data-download-url="${s(a.question_paper_url)}" data-filename="question_paper_${s(a.code||a.id)}.pdf">${h(`download`)} Download PDF</button>`:`<span class="tag">Not uploaded yet</span>`}
          </div>
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <strong class="block text-slate-800">Reference Notes / Key</strong>
              <small class="text-slate-500">Instructor reference scheme</small>
            </div>
            ${a.reference_material_url?`<button class="button button-primary text-xs" data-download-url="${s(a.reference_material_url)}" data-filename="reference_notes_${s(a.code||a.id)}.pdf">${h(`download`)} Download PDF</button>`:`<span class="tag">Not uploaded yet</span>`}
          </div>
        </div>
      </div>`:t===`results`&&(f=`
      <div class="space-y-6">
        ${d.length?d.map(e=>{let t=e.evaluation;if(e.status!==`PUBLISHED`||t==null||t.final_marks==null)return`
                    <div class="card">
                      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <strong class="text-base text-slate-900 block">Attempt #${e.id}</strong>
                          <span class="text-xs text-slate-500">Submitted on ${l(e.submitted_at)}</span>
                        </div>
                        <div>${y(`Awaiting teacher review`)}</div>
                      </div>
                      <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl my-4 text-xs text-amber-900 leading-relaxed">
                        ${h(`clock`)} <strong>Your evaluation is pending teacher review.</strong> Marks and AI explanations will be published here once your instructor finalizes them.
                      </div>
                    </div>`;let n=t.question_evaluations||[],r=Number(t.max_marks),i=Number(t.final_marks),a=r>0?Math.min(100,Math.max(0,i/r*100)):0;return`
                  <div class="card space-y-5">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <div class="flex items-center gap-2">
                          <strong class="text-xl text-slate-900">Attempt #${e.id} Result</strong>
                          ${y(`PUBLISHED`)}
                        </div>
                        <span class="text-xs text-slate-500">Published on ${l(t.published_at)}</span>
                      </div>
                      <div class="result-score-ring" style="--score: ${a}%">
                        <div class="result-score-value">
                          <span>Final score</span>
                          <strong>${u(t.final_marks)}</strong>
                          <small>of ${u(t.max_marks)}</small>
                        </div>
                      </div>
                    </div>

                    ${t.teacher_comments?`<div class="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs">
                            <span class="font-bold text-blue-900 block mb-1">Teacher Feedback:</span>
                            <p class="text-slate-700 leading-relaxed">${s(t.teacher_comments)}</p>
                          </div>`:``}

                    <div class="space-y-4">
                      <h4 class="text-sm font-bold text-slate-800">Question-by-Question Breakdown</h4>
                      ${n.map((e,t)=>`
                        <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                          <div class="flex items-start justify-between gap-3 border-b border-slate-200/60 pb-2">
                            <div>
                              <span class="eyebrow">Question ${s(e.question_number||t+1)}</span>
                              <strong class="block text-sm text-slate-900 mt-0.5">${s(e.question_text||`Question ${e.question_number||t+1}`)}</strong>
                            </div>
                            <div class="text-right">
                              <strong class="text-base text-blue-700 font-bold q-marks-awarded">${u(e.awarded_marks??e.marks_awarded??e.ai_marks)}</strong>
                              <span class="text-xs text-slate-500"> / ${u(e.maximum_marks??e.max_marks)}</span>
                            </div>
                          </div>

                          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span class="font-bold text-slate-700 block mb-1">Your Original Answer</span>
                              <p class="whitespace-pre-wrap">${s(e.student_answer||`No answer transcription is available.`)}</p>
                            </div>
                            <div class="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                              <span class="font-bold text-blue-800 block mb-1">Expected Answer (Reference)</span>
                              <p class="whitespace-pre-wrap">${s(e.expected_answer||`No expected answer was recorded.`)}</p>
                            </div>
                          </div>

                          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div class="p-2.5 bg-emerald-50 rounded-lg">
                              <span class="font-bold text-emerald-800 block mb-1">${h(`check`)} Correct Points</span>
                              ${(e.correct_points||[]).length?`<ul class="list-disc pl-4 space-y-0.5 text-slate-700">${e.correct_points.map(e=>`<li>${s(e)}</li>`).join(``)}</ul>`:`<span class="text-slate-400">None</span>`}
                            </div>
                            <div class="p-2.5 bg-rose-50 rounded-lg">
                              <span class="font-bold text-rose-800 block mb-1">${h(`x`)} Mistakes Identified</span>
                              ${(e.mistakes||[]).length?`<ul class="list-disc pl-4 space-y-0.5 text-slate-700">${e.mistakes.map(e=>`<li>${s(e)}</li>`).join(``)}</ul>`:`<span class="text-slate-400">None</span>`}
                            </div>
                          </div>

                          ${(e.missing_concepts||[]).length?`<div class="p-3 bg-amber-50 rounded-lg text-xs"><strong class="block mb-1">Missing Concepts</strong><ul class="list-disc pl-4">${e.missing_concepts.map(e=>`<li>${s(e)}</li>`).join(``)}</ul></div>`:``}
                          ${(e.evidence||[]).length?`<div class="text-xs"><strong class="block mb-1">Evidence from Your Answer</strong><ul class="list-disc pl-4">${e.evidence.map(e=>`<li>${s(e)}</li>`).join(``)}</ul></div>`:``}
                          ${(e.reference_evidence||[]).length?`<div class="text-xs text-slate-600"><strong class="block mb-1">Reference Evidence</strong><ul class="list-disc pl-4">${e.reference_evidence.map(e=>`<li>${c(e)}</li>`).join(``)}</ul></div>`:``}
                          ${e.justification?`<p class="text-xs text-slate-600"><strong>Marking justification:</strong> ${s(e.justification)}</p>`:``}
                          ${e.feedback?`<p class="text-xs text-slate-700"><strong>Question feedback:</strong> ${s(e.feedback)}</p>`:``}
                          ${e.confidence==null?``:`<p class="text-xs text-slate-500">AI confidence: ${Math.round(Number(e.confidence)*100)}% · Teacher reviewed</p>`}

                          ${e.teacher_comments?`<p class="text-xs text-slate-700"><strong>Instructor notes:</strong> ${s(e.teacher_comments)}</p>`:``}
                          ${e.improvement_suggestions?`<p class="text-xs text-slate-600"><strong>Improvement suggestions:</strong> ${s(e.improvement_suggestions)}</p>`:``}
                        </div>`).join(``)}
                    </div>

                    <div class="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
                      ${t.report_url?`<button class="button button-secondary text-xs" data-download-url="${s(t.report_url)}" data-filename="evaluation_report_${e.id}.pdf">${h(`download`)} Download Detailed Report PDF</button>`:``}
                      ${e.answer_sheet_url?`<button class="button button-outline text-xs" data-download-url="${s(e.answer_sheet_url)}" data-filename="my_answer_sheet_${e.id}">${h(`file`)} View My Answer Sheet</button>`:``}
                    </div>
                  </div>`}).join(``):w(`No submissions made for this subject yet.`)}
      </div>`),x(`
    <div class="page-heading">
      <div>
        <a class="back-link" href="#/student/dashboard">← Back to my subjects</a>
        <span class="eyebrow">${s(a.code||`SUBJECT`)}</span>
        <h2>${s(a.name)}</h2>
        <p>${s(a.notes_description||`Subject resources and evaluation results`)}</p>
      </div>
    </div>

    <nav class="tabs-nav">
      <button class="tab-btn ${t===`materials`?`active`:``}" data-tab="materials">Subject Materials</button>
      <button class="tab-btn ${t===`results`?`active`:``}" data-tab="results">My Results (${d.length})</button>
    </nav>

    ${f}
  `,`dashboard`)}async function j(){v();let e=(await i.studentDashboard().catch(()=>({recent_submissions:[]}))).recent_submissions||[];return x(`
    <div class="page-heading">
      <div>
        <span class="eyebrow">Results Folio</span>
        <h2>Published Evaluations</h2>
        <p>Your official instructor-approved scores and feedback.</p>
      </div>
    </div>
    <div class="space-y-4">
      ${e.length?e.map(e=>{let t=e.evaluation;return t?`
                <div class="card flex items-center justify-between">
                  <div>
                    <strong class="text-base text-slate-800">${s(e.question_title)}</strong>
                    <small class="text-slate-500 block">${s(e.subject)} · Submitted ${l(e.submitted_at)}</small>
                    <p class="text-xs text-slate-600 mt-2">${s(t.feedback||``)}</p>
                  </div>
                  <div class="text-right">
                    <strong class="text-2xl text-emerald-700 font-black">${u(t.final_marks)}</strong>
                    <span class="text-xs text-slate-500 block"> / ${u(t.max_marks)}</span>
                  </div>
                </div>`:`
                  <div class="card flex items-center justify-between">
                    <div>
                      <strong class="text-base text-slate-800">${s(e.question_title)}</strong>
                      <small class="text-slate-500 block">${s(e.subject)} · Submitted ${l(e.submitted_at)}</small>
                    </div>
                    ${y(`Awaiting teacher review`)}
                  </div>`}).join(``):w(`No published evaluations yet.`)}
    </div>
  `,`results`)}async function M(){v();let e=await i.teacherAnalytics().catch(()=>({total_evaluations:0,average_score_percentage:0,distribution:[]})),t=e.distribution||[];return x(`
    <div class="page-heading">
      <div>
        <span class="eyebrow">Aggregate Analytics</span>
        <h2>Evaluation Analytics</h2>
        <p>Class performance distribution across teacher-managed subjects.</p>
      </div>
    </div>
    <div class="metric-grid">
      ${C(`Evaluations`,e.total_evaluations,`blue`)}
      ${C(`Class Average`,`${e.average_score_percentage}%`,`teal`)}
    </div>
    <section class="card">
      <div class="section-heading">
        <h3>Score Distribution</h3>
      </div>
      <div class="progress-list">
        ${t.map(e=>`
          <div>
            <span>${s(e.band)}</span>
            <strong>${e.count} <small class="muted">(${e.percentage}%)</small></strong>
          </div>`).join(``)||`<div class="empty-state">No evaluation data recorded yet.</div>`}
      </div>
    </section>
  `,`analytics`)}var N=0;async function P(){let e=++N;if(o.previewBlobUrl&&=(URL.revokeObjectURL(o.previewBlobUrl),null),!o.user){v(),a.innerHTML=S(),F();return}let t=d(),n=f(t.split(`/`)[0]);if([`TEACHER`,`STUDENT`].includes(n)&&n!==f(o.role))m(p(o.role));else try{a.innerHTML=`<div class="p-12 text-center text-slate-500 font-semibold">Loading EvalAI…</div>`;let n;if(t.startsWith(`teacher/subject/`)){let e=t.split(`/subject/`)[1];n=await D(e)}else if(t.startsWith(`teacher/review/`)){let e=t.split(`/review/`)[1];n=await O(e)}else if(t===`teacher/analytics`)n=await M();else if(t.startsWith(`student/subject/`)){let e=t.split(`/subject/`)[1];n=await A(e)}else n=t===`student/results`?await j():await(o.role===`TEACHER`?E():k());if(e!==N||t!==d())return;a.innerHTML=n,g(),I(),L()}catch(n){if(e!==N||t!==d())return;v(),a.innerHTML=o.user?x(`
          <div class="error-page p-8 text-center max-w-lg mx-auto bg-white rounded-2xl border border-red-200 mt-12">
            <h2 class="text-xl font-bold text-red-700">Could not load this page</h2>
            <p class="text-sm text-slate-600 my-4">${s(n.message)}</p>
            <a class="button button-primary" href="#/${o.role.toLowerCase()}/dashboard">Return to Dashboard</a>
          </div>
        `):S(),o.user?I():F()}}function F(){document.querySelectorAll(`[data-password-toggle]`).forEach(e=>e.addEventListener(`click`,()=>{let t=e.parentElement.querySelector(`input`);if(!t)return;let n=t.type===`password`;t.type=n?`text`:`password`,e.setAttribute(`aria-pressed`,String(n)),e.setAttribute(`aria-label`,n?`Hide password`:`Show password`),e.innerHTML=h(n?`eyeOff`:`eye`)})),document.querySelectorAll(`[data-role]`).forEach(e=>e.addEventListener(`click`,()=>{o.role=e.dataset.role.toUpperCase(),P()})),document.querySelector(`#auth-switch`)?.addEventListener(`click`,()=>{o.authMode=o.authMode===`login`?`register`:`login`,P()}),document.querySelector(`#auth-form`)?.addEventListener(`submit`,async e=>{e.preventDefault();let t=new FormData(e.currentTarget),n=document.querySelector(`#auth-error`),r=e.currentTarget.querySelector(`button[type=submit]`);r.disabled=!0,n.classList.add(`hidden`);try{let e;if(o.authMode===`register`){let n=t.get(`password`);if(n!==t.get(`confirmPassword`))throw Error(`Passwords do not match.`);let r=String(t.get(`fullName`)).trim().split(/\s+/);e=await i.register(o.role,{username:t.get(`username`),email:t.get(`email`),password:n,confirm_password:t.get(`confirmPassword`),first_name:r.shift()||`User`,last_name:r.join(` `)||``})}else e=await i.login(t.get(`email`),t.get(`password`));let n=f(e.role),r=f(o.role);if(o.authMode===`login`&&r!==n)throw await i.logout(),Error(`This account is registered as a ${n.toLowerCase()}, not a ${r.toLowerCase()}.`);o.user=e,o.role=n,o.authMode=`login`,m(p(n))}catch(e){n.textContent=e.message,n.classList.remove(`hidden`)}finally{r.disabled=!1}})}function I(){document.querySelector(`#logout`)?.addEventListener(`click`,async()=>{v();try{await i.logout()}catch{_(`Signed out locally; the server could not confirm the session logout.`,`error`)}o.user=null,o.role=`teacher`,o.authMode=`login`,m(`login`),P()})}function L(){let e=d(),t=document.querySelector(`#create-subject-modal`);document.querySelector(`#open-create-subject-modal`)?.addEventListener(`click`,()=>t?.showModal()),document.querySelector(`#close-create-subject-modal`)?.addEventListener(`click`,()=>t?.close()),t?.addEventListener(`click`,e=>{e.target===t&&t.close()}),document.querySelectorAll(`.tab-btn[data-tab]`).forEach(t=>{t.addEventListener(`click`,()=>{let n=e.match(/(?:teacher|student)\/subject\/(\d+)/);if(n){let e=n[1];o.activeTab[e]=t.dataset.tab,P()}})}),document.querySelectorAll(`.filter-btn[data-filter]`).forEach(e=>{e.addEventListener(`click`,()=>{o.reviewFilter=e.dataset.filter,P()})}),document.querySelector(`#enrolled-student-search`)?.addEventListener(`input`,e=>{let t=e.currentTarget.value.trim().toLocaleLowerCase(),n=0;document.querySelectorAll(`.enrolled-student-row`).forEach(e=>{let r=e.textContent.toLocaleLowerCase().includes(t);e.hidden=!r,r&&(n+=1)}),document.querySelector(`#student-search-empty`)?.classList.toggle(`hidden`,n>0)}),document.querySelectorAll(`[data-download-url]`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.downloadUrl,n=e.dataset.filename||`download`;try{e.disabled=!0,await i.downloadAuthenticatedFile(t,n),_(`Download started.`,`success`)}catch(e){_(e.message,`error`)}finally{e.disabled=!1}})}),document.querySelector(`#create-subject-form`)?.addEventListener(`submit`,async e=>{e.preventDefault();let t=new FormData(e.currentTarget),n=e.currentTarget.querySelector(`button[type=submit]`);n.disabled=!0;try{_(`Uploading and indexing documents...`,`info`),await i.createSubjectWithDocuments(t),_(`Subject created! Documents are being processed.`,`success`),P()}catch(e){_(e.message,`error`)}finally{n.disabled=!1}}),document.querySelector(`#replace-doc-form`)?.addEventListener(`submit`,async e=>{e.preventDefault();let t=new FormData(e.currentTarget),n=t.get(`subject_id`),r=e.currentTarget.querySelector(`button[type=submit]`);r.disabled=!0;try{_(`Uploading replacement document...`,`info`),await i.replaceSubjectDocument(n,t),_(`Document replaced! Extraction pipeline restarted.`,`success`),P()}catch(e){_(e.message,`error`)}finally{r.disabled=!1}}),document.querySelectorAll(`.save-extracted-q`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.qid,n=document.querySelector(`#q-text-${t}`)?.value,r=document.querySelector(`#q-marks-${t}`)?.value;try{e.disabled=!0,await i.updateExtractedQuestion(t,{text:n,maximum_marks:r?Number(r):null}),_(`Question updated.`,`success`),P()}catch(e){_(e.message,`error`)}finally{e.disabled=!1}})}),document.querySelector(`#enroll-student-btn`)?.addEventListener(`click`,async()=>{let t=document.querySelector(`#enroll-student-select`)?.value,n=e.match(/teacher\/subject\/(\d+)/);if(t&&n)try{await i.enrollStudent(n[1],t),_(`Student enrolled.`,`success`),P()}catch(e){_(e.message,`error`)}}),document.querySelectorAll(`.unenroll-btn`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=e.match(/teacher\/subject\/(\d+)/);if(!n)return;let r=n[1],a=t.dataset.sid;if(confirm(`Are you sure you want to unenroll this student?`))try{await i.unenrollStudent(r,a),_(`Student unenrolled.`,`info`),P()}catch(e){_(e.message,`error`)}})}),document.querySelector(`#upload-answer-sheet-form`)?.addEventListener(`submit`,async e=>{e.preventDefault();let t=new FormData(e.currentTarget),n=e.currentTarget.querySelector(`button[type=submit]`);n.disabled=!0;try{_(`Uploading answer sheet...`,`info`);let e=await i.uploadSubjectAnswerSheet(t.get(`subject_id`),t);e.submission?.status===`FAILED`?_(`Upload saved, but evaluation failed: ${e.submission.processing_error||`Retry this submission after checking the source file.`}`,`error`):e.submission?.status===`PENDING_TEACHER_REVIEW`?_(`AI evaluation completed and is awaiting teacher review.`,`success`):_(`Answer sheet uploaded and queued for AI evaluation.`,`success`),P()}catch(e){_(e.message,`error`)}finally{n.disabled=!1}}),document.querySelectorAll(`.retry-eval-btn`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.subid;e.disabled=!0;try{_(`Initiating AI evaluation retry...`,`info`);let e=await i.retrySubmission(t);e.submission?.status===`FAILED`?_(`Retry failed: ${e.submission.processing_error||`Check the answer sheet and retry again.`}`,`error`):_(`Retry queued.`,`success`),P()}catch(e){_(e.message,`error`)}finally{e.disabled=!1}})});let n=document.querySelector(`#sheet-preview-container`);if(n&&o.selectedSubmission?.answer_sheet_preview_url){let e=o.selectedSubmission.answer_sheet_preview_url,t=document.createElement(`div`);t.className=`flex w-full flex-col items-center gap-3 p-3`;let r=document.createElement(`div`);r.className=`flex w-full items-center justify-between gap-3`;let a=document.createElement(`button`);a.type=`button`,a.className=`button button-secondary text-xs`,a.textContent=`Previous page`;let s=document.createElement(`span`);s.className=`text-xs text-slate-500`;let c=document.createElement(`button`);c.type=`button`,c.className=`button button-secondary text-xs`,c.textContent=`Next page`;let l=document.createElement(`img`);l.id=`answer-sheet-preview-img`,l.className=`max-h-[650px] max-w-full rounded-xl border border-slate-200 object-contain`,l.alt=`Answer sheet page preview`,r.append(a,s,c),t.append(r,l),n.replaceChildren(t);let u=1,d=1,f=0,p=async t=>{let r=++f,p=new URL(e,window.location.origin);p.searchParams.set(`page`,String(t));try{let t=await i.getAuthenticatedBlobUrl(`${p.pathname}${p.search}`);if(!n.isConnected||o.selectedSubmission?.answer_sheet_preview_url!==e||r!==f){URL.revokeObjectURL(t.blobUrl);return}let m=o.previewBlobUrl;o.previewBlobUrl=t.blobUrl,u=t.pageNumber,d=t.pageCount,l.src=t.blobUrl,l.alt=`Answer sheet page ${u} of ${d}`,s.textContent=`Page ${u} of ${d}`,a.disabled=u<=1,c.disabled=u>=d,m&&URL.revokeObjectURL(m)}catch(e){if(!n.isConnected)return;let t=document.createElement(`div`);t.className=`p-4 text-xs text-rose-600`,t.textContent=`Failed to load preview: ${e.message}`,n.replaceChildren(t)}};a.addEventListener(`click`,()=>p(u-1)),c.addEventListener(`click`,()=>p(u+1)),p(1)}document.querySelector(`#download-sheet-btn`)?.addEventListener(`click`,async e=>{let t=e.currentTarget.dataset.url,n=e.currentTarget.dataset.filename||`answer_sheet`;if(t)try{await i.downloadAuthenticatedFile(t,n)}catch(e){_(e.message,`error`)}}),document.querySelectorAll(`.q-mark-input`).forEach(e=>{e.addEventListener(`input`,e=>{let t=e.target.dataset.qid,n=Number(e.target.dataset.max)||0,r=parseFloat(e.target.value);isNaN(r)&&(r=0),r<0&&(r=0,e.target.value=0),r>n&&(r=n,e.target.value=n),o.reviewMarks[t]=r;let i=(o.selectedEvaluation?.question_evaluations||[]).reduce((e,t)=>e+(Number(o.reviewMarks[t.id])||0),0),a=document.querySelector(`#live-total-display`);a&&(a.textContent=u(i))})}),document.querySelectorAll(`.q-reason-input`).forEach(e=>{e.addEventListener(`input`,e=>{o.reviewReasons[e.target.dataset.qid]=e.target.value})}),document.querySelectorAll(`.q-comments-input`).forEach(e=>{e.addEventListener(`input`,e=>{o.reviewComments[e.target.dataset.qid]=e.target.value})}),document.querySelectorAll(`.q-feedback-input`).forEach(e=>{e.addEventListener(`input`,e=>{o.reviewFeedback[e.target.dataset.qid]=e.target.value})});let r=()=>(o.selectedEvaluation?.question_evaluations||[]).map(e=>({id:e.id,awarded_marks:Number(o.reviewMarks[e.id])||0,teacher_override_reason:o.reviewReasons[e.id]||``,teacher_comments:o.reviewComments[e.id]||``,feedback:o.reviewFeedback[e.id]||``}));document.querySelector(`#save-draft-btn`)?.addEventListener(`click`,async()=>{if(!o.selectedEvaluation)return;let e=document.querySelector(`#save-draft-btn`);e.disabled=!0;let t=document.querySelector(`#overall-teacher-comments`)?.value||``,n=document.querySelector(`#overall-feedback-input`)?.value||``,a=r(),s=(o.selectedEvaluation?.question_evaluations||[]).reduce((e,t)=>e+(Number(o.reviewMarks[t.id])||0),0);try{await i.updateMarks(o.selectedEvaluation.id,s,t,a,n),_(`Draft edits saved successfully.`,`success`),P()}catch(e){_(e.message,`error`)}finally{e.disabled=!1}}),document.querySelector(`#approve-publish-btn`)?.addEventListener(`click`,async()=>{if(!o.selectedEvaluation||!confirm(`Are you sure you want to approve and publish this evaluation? The student will immediately be able to view their final marks and feedback.`))return;let e=document.querySelector(`#approve-publish-btn`);e.disabled=!0;let t=document.querySelector(`#overall-teacher-comments`)?.value||``,n=document.querySelector(`#overall-feedback-input`)?.value||``,a=r(),s=(o.selectedEvaluation?.question_evaluations||[]).reduce((e,t)=>e+(Number(o.reviewMarks[t.id])||0),0);try{await i.updateMarks(o.selectedEvaluation.id,s,t,a,n),await i.approveAndPublishEvaluation(o.selectedEvaluation.id,t),_(`Evaluation approved and published to student!`,`success`),P()}catch(e){_(e.message,`error`)}finally{e.disabled=!1}})}window.addEventListener(`hashchange`,P),window.addEventListener(`evalai:unauthorized`,()=>{v(),o.user=null,o.role=`teacher`,m(`login`),P()});async function R(){try{let e=await i.health();o.aiMode=String(e.ai_mode||`groq`).toLowerCase()}catch{o.aiMode=`unknown`}if(sessionStorage.getItem(`evalai_auth_token`))try{o.user=await i.me(),o.role=f(o.user.role)}catch{o.user=null,sessionStorage.removeItem(t)}location.hash||m(o.user?p(o.role):`login`),P()}R();