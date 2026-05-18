export function inviteEmailHtml({
  inviterName,
  role,
  acceptUrl,
}: {
  inviterName: string;
  role: string;
  acceptUrl: string;
}): string {
  const roleLabel = role === 'manager' ? 'Manager' : 'Team Member';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>You're invited to BRING Media Terminal</title>
</head>
<body style="margin:0;padding:0;background:#0d0d14;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#16161f;border:1px solid #2a2a3e;border-radius:12px;overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #2a2a3e;">
              <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8f00ff;">BRING MEDIA</p>
              <p style="margin:4px 0 0;font-size:22px;font-weight:600;color:#f0f0f8;">Terminal</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;font-size:24px;font-weight:500;color:#f0f0f8;">
                You're invited
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#8b87a8;line-height:1.6;">
                <strong style="color:#f0f0f8;">${inviterName}</strong> has invited you to join 
                BRING Media Terminal as a <strong style="color:#f0f0f8;">${roleLabel}</strong>.
              </p>
              <p style="margin:0 0 32px;font-size:14px;color:#8b87a8;line-height:1.6;">
                Click the button below to set your password and activate your account. 
                This link expires in <strong style="color:#f0f0f8;">48 hours</strong>.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:#8f00ff;">
                    <a href="${acceptUrl}"
                       style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">
                      Accept invitation →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:12px;color:#4a4a6a;">
                Or copy this link: <span style="color:#8b87a8;">${acceptUrl}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #2a2a3e;">
              <p style="margin:0;font-size:11px;color:#4a4a6a;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}