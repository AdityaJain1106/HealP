
import nodemailer from 'nodemailer'

const contactEmail = process.env.CONTACT_EMAIL
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD

if (!contactEmail || !gmailAppPassword) {
  throw new Error(
    'Missing CONTACT_EMAIL or GMAIL_APP_PASSWORD in server/.env'
  )
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: contactEmail,
    pass: gmailAppPassword,
  },
})

export interface ContactEmailInput {
  name: string
  email: string
  category: string
  message: string
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }

    return entities[character]
  })
}

export async function sendContactEmail(
  input: ContactEmailInput
): Promise<void> {
  const safeName = escapeHtml(input.name)
  const safeEmail = escapeHtml(input.email)
  const safeCategory = escapeHtml(input.category)
  const safeMessage = escapeHtml(input.message)

  await transporter.sendMail({
    from: `"HealP Contact Form" <${contactEmail}>`,
    to: contactEmail,
    replyTo: input.email,
    subject: `HealP Contact: ${input.category}`,
    text: `
New message received through HealP Contact Us.

Name: ${input.name}
Email: ${input.email}
Category: ${input.category}

Message:
${input.message}
    `,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>New HealP Contact Message</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Category:</strong> ${safeCategory}</p>
        <hr />
        <h3>Message</h3>
        <p style="white-space: pre-wrap;">${safeMessage}</p>
      </div>
    `,
  })
}
