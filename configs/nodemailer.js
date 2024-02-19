const nodemailer = require('nodemailer');
require('dotenv').config();

const USER = process.env.USER;
const PASSWORD = process.env.PASSWORD;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: USER,
        pass: PASSWORD
    }
});

function sendMail(receiver, otp) {
    console.log(USER, PASSWORD);
    return new Promise((resolve, reject) => {
        const mailOptions = {
            from: USER,
            to: receiver,
            subject: 'Verify OTP',
            html: `
                <div style="font-family: Helvetica, Arial, sans-serif; min-width: 100px; overflow: auto; line-height: 2">
                    <div style="margin: 50px auto; width: 70%; padding: 20px 0">
                        <p style="font-size: 1.1em">Hi,</p>
                        <p>Thank you for choosing MobileX. Use the following OTP to complete your Sign Up procedures. OTP is valid for 5 minutes</p>
                        <h2 style="background: #00466a; margin: 0 auto; width: max-content; padding: 0 10px; color: #fff; border-radius: 4px;">${otp}</h2>
                        <p style="font-size: 0.9em;">Regards,<br />MobileX</p>
                        <hr style="border: none; border-top: 1px solid #eee" />
                    </div>
                </div>`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                reject(error);
            } else {
                console.log('Email sent: '+ info.response);
                resolve();
            }
        })
    })
}

module.exports = sendMail;