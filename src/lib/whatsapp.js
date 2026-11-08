import { BUSINESS } from './config'

// Build a wa.me click-to-chat link with a prefilled message.
export function waLink(message = '') {
  const base = `https://wa.me/${BUSINESS.whatsapp}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

export function consultationMessage({ name, level, institution, service, need, ref }) {
  const lines = [
    `Hello AEC, my name is ${name}.`,
    `Level: ${level}${institution ? `, ${institution}` : ''}.`,
    `I need help with: ${service}.`,
  ]
  if (need) lines.push(`Details: ${need}`)
  if (ref) lines.push(`Ref: ${ref}`)
  return lines.join('\n')
}
