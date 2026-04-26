const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { createAsyncSpy, createSpy } = require('../../helpers/spies');

const modulePath = path.join(__dirname, '../../../src/utils/emailService.js');

test('sendEmail logs a mock message when SMTP credentials are absent', async () => {
  delete process.env.SMTP_USER;

  const sendMail = createAsyncSpy(async () => {});
  const log = createSpy(() => {});

  const { sendEmail } = loadModule(modulePath, {
    nodemailer: {
      createTransport: () => ({ sendMail }),
    },
  });

  const originalLog = console.log;
  console.log = log;

  try {
    await sendEmail('alice@example.com', 'Hello', 'Body');
  } finally {
    console.log = originalLog;
  }

  assert.equal(sendMail.calls.length, 0);
  assert.match(log.calls[0][0], /\[Email Mock\]/);
});

test('sendEmail forwards mail to the transporter when SMTP is configured', async () => {
  process.env.SMTP_USER = 'smtp-user';
  process.env.SMTP_PASS = 'smtp-pass';

  const sendMail = createAsyncSpy(async () => {});

  const { sendEmail } = loadModule(modulePath, {
    nodemailer: {
      createTransport: () => ({ sendMail }),
    },
  });

  await sendEmail('alice@example.com', 'Hello', 'Body');

  assert.equal(sendMail.calls.length, 1);
  assert.equal(sendMail.calls[0][0].to, 'alice@example.com');
  assert.equal(sendMail.calls[0][0].subject, 'Hello');
});
