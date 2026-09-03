const sendEmail = async ({
  to,
  subject,
  text,
  html,
}) => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error(
      "BREVO_API_KEY is missing from environment variables."
    );
  }

  if (!process.env.EMAIL_USER) {
    throw new Error(
      "EMAIL_USER is missing from environment variables."
    );
  }

  try {
    const response = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",

        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },

        body: JSON.stringify({
          sender: {
            name: "Blaiz Business Manager",
            email: process.env.EMAIL_USER,
          },

          to: [
            {
              email: to,
            },
          ],

          subject,

          textContent: text,

          htmlContent: html,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Brevo email error:",
        data
      );

      throw new Error(
        data.message ||
          "Brevo failed to send the email."
      );
    }

    console.log(
      "Email sent successfully through Brevo:",
      data.messageId
    );

    return data;
  } catch (error) {
    console.error(
      "Email service error:",
      error
    );

    throw error;
  }
};

module.exports = sendEmail;