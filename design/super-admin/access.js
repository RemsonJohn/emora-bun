// Review-only state. No accounts, emails, tokens or passwords leave this page.
const ownerRecords = Object.fromEntries(["sagar", "anushq"].map(key => [key, {
  email: `${key}.owner@example.com`, invited: "Not invited", active: false,
  accepted: false, sessions: 0, reset: false, events: [], revision: 0,
}]))
let platformTwoFactor = false
let accessDialogContext = null
const ownerRecord = () => ownerRecords[state.merchant]
const accessButton = (label, action, style = "", disabled = false) => `<button type="button" class="button ${style}" data-access="${action}" ${disabled ? "disabled" : ""}>${label}</button>`
function recordAccess(record, action, detail = "") {
  record.events.unshift({ action, detail, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) })
}
function accessContent() {
  const record = ownerRecord()
  const pending = record.invited === "Sent"
  const status = record.accepted ? (record.active ? "Login active" : "Login deactivated") : "Awaiting first login"
  return `<div class="access-notice">${icon("info")}<p>Interactive access preview. Emails, account changes and session counts below are simulated. Reload resets this review.</p></div>
    <div class="access-grid"><div class="stack">
      <section class="panel"><div class="panel-head"><div><h2>Merchant owner</h2><p>The owner manages this store. Emora manages account access.</p></div>${badge(status, record.accepted && !record.active ? "amber" : "")}</div>
      <div class="panel-body"><div class="owner-identity"><span class="avatar">${merchants[state.merchant].initial}</span><div><strong>${esc(record.email)}</strong><small>${esc(merchants[state.merchant].name)} · Store owner</small></div></div>
      <div class="access-detail"><span>Invitation</span><strong>${esc(record.invited)}</strong></div><div class="access-detail"><span>Merchant dashboard</span><span>Public URL not connected</span></div><div class="access-detail"><span>Password setup</span><span>Owner chooses their password</span></div>
      <div class="access-actions">${record.accepted ? accessButton("Preview owner sign-in", "owner-login", "primary") : `${accessButton(record.invited === "Not invited" ? "Preview invitation" : "Preview resend", "invite", "primary")}${accessButton("View invitation email", "email", "", !pending)}${accessButton("Cancel invitation", "cancel-invite", "", !pending)}`}</div>
      <p class="access-help">Production invitations are sent only after the merchant backend, dashboard URL and email sender are ready.</p></div></section>
      <section class="panel"><div class="panel-head"><div><h2>Recovery & sessions</h2><p>Help the owner regain access without seeing their password.</p></div></div>
      <div class="setting-row"><div><h3>Password reset</h3><p>${record.reset ? "Reset link pending in this preview." : "Send a password-setting link to the verified owner email."}</p></div>${accessButton("Preview reset email", "reset", "", !record.accepted || !record.active)}</div>
      <div class="setting-row"><div><h3>Sign out all devices</h3><p>${record.sessions} simulated active ${record.sessions === 1 ? "session" : "sessions"}. A reset also signs out existing sessions.</p></div>${accessButton("Sign out devices", "sessions", "", !record.sessions)}</div>
      <div class="setting-row"><div><h3>Owner lost email access?</h3><p>Verify business ownership before changing the recovery address.</p></div>${accessButton("Review recovery", "recover", "", !record.accepted)}</div></section>
      <section class="panel"><div class="panel-head"><div><h2>Access history</h2><p>Sample events from this review session.</p></div><span class="muted">${record.events.length} events</span></div>
      ${record.events.length ? `<ol class="access-events">${record.events.map(event => `<li><span class="event-dot"></span><div><strong>${esc(event.action)}</strong><p>${esc(event.detail || "Emora admin · Preview action")}</p></div><time>${event.time}</time></li>`).join("")}</ol>` : `<div class="empty">${icon("shield")}<h3>No access changes yet</h3><p>Preview an invitation to explore the owner’s first login.</p></div>`}</section>
    </div><div class="stack"><section class="panel"><div class="panel-head"><h2>Login access</h2></div><div class="panel-body"><p class="access-copy">${record.active ? "The owner can sign into their merchant dashboard in this preview." : "The owner cannot use the dashboard until an invitation is accepted and login is active."}</p>
      ${accessButton(record.active ? "Deactivate owner login" : "Reactivate owner login", record.active ? "deactivate" : "activate", record.active ? "danger" : "", !record.accepted)}
      <div class="quiet-box">${icon("store")}<p>This control affects the owner’s login only. The storefront and customer orders stay available. Staff-wide access and store suspension are separate controls.</p></div></div></section>
      <section class="panel"><div class="panel-head"><h2>Recovery safeguards</h2></div><div class="panel-body"><ul class="access-guidance"><li>Expiring, single-use invitation links</li><li>New links replace older invitations</li><li>Email changes require ownership verification</li><li>Account changes recorded in access history</li></ul><p class="access-help">These are implementation requirements. This preview does not enforce real account security.</p></div></section>
      <details class="panel scenario-panel"><summary>Preview different outcomes</summary><div class="panel-body"><p class="access-help">Change the sample invitation outcome without sending an email.</p><div class="access-actions">${accessButton("Delivery failed", "failure", "", !pending)}${accessButton("Invitation expired", "expire", "", !pending)}</div></div></details>
    </div></div>`
}
function accessDialog(title, content, action, label, source) {
  let dialog = document.querySelector("#access-dialog")
  if (!dialog) {
    dialog = document.createElement("dialog")
    dialog.id = "access-dialog"
    dialog.setAttribute("aria-labelledby", "access-dialog-title")
    dialog.addEventListener("cancel", event => { event.preventDefault(); closeModal(dialog) })
    dialog.addEventListener("close", () => dialog.querySelectorAll('input[type="password"]').forEach(input => { input.value = "" }))
    document.body.append(dialog)
  }
  accessDialogContext = { merchant: state.merchant, action, revision: ownerRecord().revision }
  dialog.innerHTML = `<form id="access-form"><div class="dialog-head"><h2 id="access-dialog-title">${title}</h2><button type="button" class="iconbutton" data-close aria-label="Close dialog">×</button></div><div class="panel-body">${content}<p class="access-form-error" role="alert" id="access-error"></p></div><div class="dialog-footer"><button type="button" class="button" data-close>Cancel</button><button class="button primary" type="submit">${label}</button></div></form>`
  openModal(dialog, source)
}
function invitationEmail(record) {
  return `<div class="email-preview"><span class="muted">Email preview · Nothing is sent</span><h3>Your ${esc(merchants[state.merchant].name)} dashboard is ready</h3><p>To: ${esc(record.email)}</p><p>You’ve been invited to manage your store. Set your password to get started.</p><p class="access-help">Single-use link · 24-hour expiry shown for design review. Production expiry will come from the backend.</p></div>`
}
function passwordPreview() {
  return `<p class="access-copy">Choose a sample password to explore the flow. Do not enter a real password. The preview does not store it.</p><div class="form-grid"><div class="field full"><label for="preview-password">Sample password</label><input id="preview-password" type="password" autocomplete="new-password" minlength="12" required><small>Use at least 12 characters for this preview.</small></div><div class="field full"><label for="preview-confirm">Confirm sample password</label><input id="preview-confirm" type="password" autocomplete="new-password" required></div></div>`
}
function teamSecurity() {
  return `<div class="pagehead"><div><h1>Team security</h1><p>Protect Emora’s access across merchants.</p></div>${badge("Design preview")}</div><div class="access-notice">${icon("shield")}<p>Admin two-factor authentication is required in the proposed production flow. This screen demonstrates setup only.</p></div><section class="panel security-panel"><div class="panel-head"><div><h2>Two-factor authentication</h2><p>Authenticator app and recovery codes</p></div>${badge(platformTwoFactor ? "Setup preview complete" : "Setup required", platformTwoFactor ? "" : "amber")}</div><div class="panel-body"><p class="access-copy">After signing in with a password, an Emora admin confirms a code from their authenticator app before entering the platform.</p><ol class="security-steps"><li>Add Emora to your authenticator app.</li><li>Verify the current six-digit code.</li><li>Save recovery codes somewhere private.</li></ol>${accessButton(platformTwoFactor ? "Review setup again" : "Preview authenticator setup", "two-factor", "primary")}<div class="quiet-box">${icon("info")}<p>No authenticator secret or working recovery codes are generated here. Real enrollment, recovery and enforcement belong to production authentication.</p></div></div></section>`
}
document.addEventListener("click", event => {
  const source = event.target.closest("[data-access]")
  if (!source || source.disabled) return
  const record = ownerRecord()
  const action = source.dataset.access
  const reason = `<div class="field"><label for="access-reason">Reason for this change</label><textarea id="access-reason" required maxlength="300" placeholder="Explain the request for the access history"></textarea></div>`
  if (action === "owner-login") accessDialog("Merchant sign-in preview", `<p class="access-copy">${esc(merchants[state.merchant].name)} merchant dashboard. Use any sample password; no real credentials are checked.</p><div class="field"><label for="login-email">Owner email</label><input id="login-email" type="email" value="${esc(record.email)}" required></div><div class="field"><label for="login-password">Sample sign-in password</label><input id="login-password" type="password" autocomplete="off" required></div><div class="access-actions">${accessButton("Forgot password?", "forgot")}</div>`, action, "Continue sample sign-in", source)
  if (action === "forgot") {
    const dialog = source.closest("dialog")
    const form = dialog.querySelector("form")
    dialog.querySelector("h2").textContent = "Recover your password"
    form.querySelector(".panel-body").innerHTML = `<p class="access-copy">Enter the email you use for your merchant dashboard. This previews a recovery request; nothing is sent.</p><div class="field"><label for="forgot-email">Recovery email</label><input id="forgot-email" type="email" required value="${esc(record.email)}"></div><p class="access-form-error" id="access-error" role="alert"></p>`
    form.querySelector('[type="submit"]').textContent = "Preview recovery request"
    accessDialogContext.action = "forgot"
    form.querySelector("input").focus()
  }
  if (action === "invite") accessDialog("Invite the store owner", `${invitationEmail(record)}<p class="access-help">${record.invited === "Not invited" ? "The owner will choose their own password." : "Resending invalidates the previous invitation link."} This action simulates sending.</p>`, "invite", "Simulate sending invitation", source)
  if (action === "email") accessDialog("Owner invitation email", invitationEmail(record), "start-password", "Preview Set password link", source)
  if (action === "cancel-invite") accessDialog("Cancel this invitation?", `<p>The current preview invitation will no longer allow access.</p>`, action, "Cancel invitation", source)
  if (action === "reset") accessDialog("Help the owner reset their password", `<p class="access-copy">A reset link would be sent to <strong>${esc(record.email)}</strong>. Completing recovery signs out their existing sessions.</p>${reason}`, action, "Preview reset link", source)
  if (action === "sessions") accessDialog("Sign out the owner’s devices?", `<p class="access-copy">Revoke all ${record.sessions} sample sessions. Their account stays active and they can sign in again.</p>${reason}`, action, "Sign out devices", source)
  if (action === "deactivate" || action === "activate") accessDialog(action === "deactivate" ? "Deactivate owner login?" : "Reactivate owner login?", `<p class="access-copy">${action === "deactivate" ? "Block this owner and revoke their sessions. The storefront and orders remain available." : "Restore this owner’s login. Previously revoked sessions remain signed out."}</p>${reason}`, action, action === "deactivate" ? "Deactivate login" : "Reactivate login", source)
  if (action === "recover") accessDialog("Review owner email recovery", `<p class="access-copy">Current address: ${esc(record.email)}. Production recovery needs independent ownership verification; the checkbox below only simulates that review.</p><div class="field"><label for="recovery-email">New owner email</label><input id="recovery-email" type="email" required placeholder="owner@example.com"></div>${reason}<label class="option-line recovery-check"><input id="ownership-verified" type="checkbox" required>I completed the sample ownership review</label><p class="access-help">In production, notify both addresses, invalidate existing links and sessions, and require a new invitation.</p>`, action, "Preview verified recovery", source)
  if (action === "failure" || action === "expire") {
    record.invited = action === "failure" ? "Delivery failed" : "Expired"
    record.revision++
    recordAccess(record, `Invitation ${record.invited.toLowerCase()}`, "Simulated outcome · No email sent")
    renderPart()
  }
  if (action === "two-factor") accessDialog("Set up an authenticator", `<div class="setup-placeholder">${icon("shield")}<strong>Authenticator pairing preview</strong><p>In production, a private QR code appears here. There is no scannable code in this review.</p></div><div class="field"><label for="sample-code">Sample verification code</label><input id="sample-code" inputmode="numeric" pattern="123456" required maxlength="6" placeholder="123456"><small>Enter 123456 to preview successful verification.</small></div>`, "two-factor", "Verify sample code", source)
})
document.addEventListener("submit", async event => {
  if (event.target.id !== "access-form") return
  event.preventDefault()
  const form = event.target
  const submit = form.querySelector('[type="submit"]')
  if (submit.disabled) return
  const { merchant, action, revision } = accessDialogContext
  const record = ownerRecords[merchant]
  const dialog = form.closest("dialog")
  if (action === "owner-login") {
    if (!record.active || !record.accepted || form.querySelector("#login-email").value.trim().toLowerCase() !== record.email.toLowerCase()) {
      form.querySelector("#access-error").textContent = "Sign-in unavailable. Contact Emora for help with your account."
      return
    }
    form.querySelector("#login-password").value = ""
    record.sessions++
    recordAccess(record, "Merchant sign-in preview completed", "Simulated session · Merchant dashboard is a separate application")
  }
  if (action === "forgot") {
    form.querySelector(".panel-body").innerHTML = `<div class="email-preview"><h3>Check your email</h3><p>If an eligible account exists for that address, it will receive recovery instructions.</p><p class="access-help">Preview only. No email was sent.</p></div>`
    submit.textContent = "Return to access overview"
    accessDialogContext.action = "forgot-done"
    return
  }
  if (action === "start-password" || action === "set-password" || action === "reset-password") {
    if (revision !== record.revision || (action !== "reset-password" && record.invited !== "Sent") || (action === "reset-password" && (!record.active || !record.reset))) {
      form.querySelector("#access-error").textContent = "This preview link is no longer valid. Request a new link."
      return
    }
  }
  if (action === "start-password") {
    form.querySelector(".panel-body").innerHTML = `${passwordPreview()}<p id="access-error" class="access-form-error" role="alert"></p>`
    dialog.querySelector("h2").textContent = "Set your password"
    submit.textContent = "Complete owner setup preview"
    accessDialogContext.action = "set-password"
    form.querySelector("input").focus()
    return
  }
  if (action === "set-password" || action === "reset-password") {
    if (form.querySelector("#preview-password").value !== form.querySelector("#preview-confirm").value) {
      form.querySelector("#access-error").textContent = "The passwords do not match."
      return
    }
    form.querySelectorAll('input[type="password"]').forEach(input => { input.value = "" })
    record.accepted = true
    record.active = true
    record.invited = "Accepted"
    record.reset = false
    record.sessions = action === "set-password" ? 1 : 0
    record.revision++
    recordAccess(record, action === "set-password" ? "Owner setup completed" : "Password recovery completed", "Sample owner action · No password stored")
  }
  const reason = form.querySelector("#access-reason")?.value.trim()
  if (form.querySelector("#access-reason") && !reason) {
    form.querySelector("#access-error").textContent = "Enter a reason for the access history."
    return
  }
  if (action === "reset") {
    record.reset = true
    record.revision++
    recordAccess(record, "Password reset requested", reason)
    accessDialogContext.action = "reset-password"
    accessDialogContext.revision = record.revision
    form.querySelector(".panel-body").innerHTML = `<div class="email-preview"><h3>Reset link preview</h3><p>Recipient: ${esc(record.email)}. Nothing was emailed.</p></div>${passwordPreview()}<p id="access-error" class="access-form-error" role="alert"></p>`
    submit.textContent = "Complete password reset preview"
    form.querySelector("input").focus()
    return
  }
  if (action === "invite") { record.invited = "Sent"; record.revision++; recordAccess(record, "Invitation sent — simulation", `To ${record.email} · Previous links invalidated`) }
  if (action === "cancel-invite") { record.invited = "Cancelled"; record.revision++; recordAccess(record, "Invitation cancelled") }
  if (action === "deactivate") { record.active = false; record.sessions = 0; record.reset = false; record.revision++; recordAccess(record, "Owner login deactivated", reason) }
  if (action === "activate") { record.active = true; recordAccess(record, "Owner login reactivated", reason) }
  if (action === "sessions") { record.sessions = 0; recordAccess(record, "Owner sessions revoked", reason) }
  if (action === "recover") {
    const email = form.querySelector("#recovery-email").value.trim()
    if (email.toLowerCase() === record.email.toLowerCase()) { form.querySelector("#access-error").textContent = "Enter a different recovery email."; return }
    record.email = email; record.active = false; record.accepted = false; record.sessions = 0; record.reset = false; record.invited = "Not invited"; record.revision++
    recordAccess(record, "Owner email recovery reviewed", `${reason} · Re-invitation required; notification to both addresses is simulated`)
  }
  if (action === "two-factor") {
    form.querySelector(".panel-body").innerHTML = `<h3>Save your recovery codes</h3><p class="access-copy">These are non-working examples. Real codes would be shown once and stored privately by the admin.</p><div class="recovery-codes">DEMO-ONLY-01<br>DEMO-ONLY-02<br>DEMO-ONLY-03</div><label class="option-line"><input type="checkbox" required>I understand how to save recovery codes</label>`
    submit.textContent = "Finish setup preview"
    accessDialogContext.action = "finish-two-factor"
    return
  }
  if (action === "finish-two-factor") platformTwoFactor = true
  submit.disabled = true
  await closeModal(dialog)
  const active = document.activeElement
  const actionSelector = active?.dataset?.access
  if (location.hash === "#security") render()
  else renderPart()
  const replacement = actionSelector && document.querySelector(`[data-access="${actionSelector}"]:not(:disabled)`)
  if (replacement) replacement.focus({ preventScroll: true })
  else { main.setAttribute("tabindex", "-1"); main.focus({ preventScroll: true }) }
  toast("Preview updated. No live account or email was changed.")
})
